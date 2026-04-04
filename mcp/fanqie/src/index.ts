/**
 * index.ts — Fanqie Novel MCP Server 主入口
 *
 * 注册 3 个工具：
 *   - fanqie_check_login: 检查登录状态
 *   - fanqie_publish_chapter: 发布章节
 *   - fanqie_screenshot: 截图
 *
 * 通过 stdio 与 MCP 客户端通信，遵循 Douyin MCP 相同的模式。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { ensureBrowser, disconnect } from './browser.js';
import { checkLogin } from './tools/check-login.js';
import { publishChapter } from './tools/publish-chapter.js';
import { screenshot } from './tools/screenshot.js';

// ─── stdio 保护：拦截所有 stdout 写入，非 JSON 强制走 stderr ───
const _origStdoutWrite = process.stdout.write.bind(process.stdout);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(process.stdout as any).write = function (
  chunk: any,
  encodingOrCallback?: any,
  callback?: any,
): boolean {
  const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
  if (str.trimStart().startsWith('{')) {
    return _origStdoutWrite(chunk, encodingOrCallback, callback);
  }
  return process.stderr.write(chunk, encodingOrCallback, callback);
};

console.log = console.error;
console.warn = console.error;
console.info = console.error;
console.debug = console.error;

// ─── MCP Server ───

const server = new McpServer({
  name: 'fanqie-mcp-server',
  version: '0.1.0',
});

// ─── 登录检查 ───

server.registerTool(
  'fanqie_check_login',
  {
    description:
      '检查番茄小说作家后台是否已登录。如果未登录，返回截图提示用户在浏览器中手动登录。',
    inputSchema: {},
  },
  async () => {
    try {
      const { page } = await ensureBrowser();
      const result = await checkLogin(page);
      disconnect();

      const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [];

      if (result.loggedIn) {
        content.push({ type: 'text', text: `✅ ${result.message}` });
      } else {
        content.push({ type: 'text', text: `❌ ${result.message}` });
        if (result.screenshot) {
          content.push({
            type: 'image',
            data: result.screenshot,
            mimeType: 'image/png',
          });
        }
      }

      return { content };
    } catch (err) {
      const error = err as Error;
      return {
        content: [{ type: 'text' as const, text: `执行崩溃: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// ─── 发布章节 ───

server.registerTool(
  'fanqie_publish_chapter',
  {
    description:
      '发布章节到番茄小说。自动完成：导航到章节管理页 → 新建章节 → 填写标题和正文 → 点击发布。',
    inputSchema: {
      bookId: z.string().describe('书籍 ID（从番茄小说作家后台 URL 中获取）'),
      chapterTitle: z.string().describe('章节标题'),
      chapterContent: z.string().describe('章节正文内容'),
    },
  },
  async ({ bookId, chapterTitle, chapterContent }) => {
    try {
      const { page } = await ensureBrowser();
      const result = await publishChapter(page, { bookId, chapterTitle, chapterContent });
      disconnect();

      const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [];

      content.push({ type: 'text', text: result.ok ? `✅ ${result.message}` : `❌ ${result.message}` });

      if (result.detail) {
        content.push({ type: 'text', text: `详情: ${result.detail}` });
      }

      if (result.screenshot) {
        content.push({
          type: 'image',
          data: result.screenshot,
          mimeType: 'image/png',
        });
      }

      return { content, isError: !result.ok };
    } catch (err) {
      const error = err as Error;
      return {
        content: [{ type: 'text' as const, text: `执行崩溃: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// ─── 截图 ───

server.registerTool(
  'fanqie_screenshot',
  {
    description: '对当前番茄小说作家后台页面进行截图，返回 base64 图片。用于调试或查看页面当前状态。',
    inputSchema: {
      fullPage: z.boolean().optional().default(true).describe('是否截取整个页面（默认 true）'),
    },
  },
  async ({ fullPage }) => {
    try {
      const { page } = await ensureBrowser();
      const result = await screenshot(page, fullPage);
      disconnect();

      const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [];

      content.push({ type: 'text', text: result.message });

      if (result.screenshot) {
        content.push({
          type: 'image',
          data: result.screenshot,
          mimeType: 'image/png',
        });
      }

      return { content, isError: !result.ok };
    } catch (err) {
      const error = err as Error;
      return {
        content: [{ type: 'text' as const, text: `执行崩溃: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// ─── 启动 ───

async function run(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fanqie Novel MCP Server running on stdio');
}

run().catch(console.error);
