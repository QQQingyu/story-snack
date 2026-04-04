/**
 * browser.ts — Playwright 浏览器连接管理
 *
 * 职责：
 *   1. 通过 CDP 连接到已有的 Chrome/Chromium 浏览器实例
 *   2. 如果没有已有实例，启动新的浏览器
 *   3. 找到或创建番茄小说作家后台页面
 *   4. 提供截图、延迟等辅助函数
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

// ── 配置 ──

const CDP_PORT = parseInt(process.env.FANQIE_CDP_PORT || process.env.BROWSER_DEBUG_PORT || '40821', 10);
const FANQIE_URL = process.env.FANQIE_URL || 'https://writer.fanqienovel.com/';
const OUTPUT_DIR = process.env.FANQIE_OUTPUT_DIR || '/tmp/fanqie-output';
const PROTOCOL_TIMEOUT = parseInt(process.env.FANQIE_PROTOCOL_TIMEOUT || '60000', 10);

export { OUTPUT_DIR, FANQIE_URL };

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;

/**
 * 尝试通过 CDP 连接到已运行的浏览器
 */
async function connectViaCDP(): Promise<Browser> {
  const wsEndpoint = `http://127.0.0.1:${CDP_PORT}`;
  console.error(`[fanqie-browser] 尝试通过 CDP 连接: ${wsEndpoint}`);
  const browser = await chromium.connectOverCDP(wsEndpoint, {
    timeout: PROTOCOL_TIMEOUT,
  });
  console.error(`[fanqie-browser] CDP 连接成功`);
  return browser;
}

/**
 * 在浏览器中找到番茄小说作家后台标签页，或新开一个
 */
async function findOrCreateFanqiePage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();

  // 优先复用已有的番茄小说作家后台页面
  for (const page of pages) {
    const url = page.url();
    if (url.includes('writer.fanqienovel.com')) {
      console.error('[fanqie-browser] 命中已有番茄小说作家后台页面');
      await page.bringToFront();
      return page;
    }
  }

  // 没找到，新开一个标签页
  const page = await context.newPage();
  await page.goto(FANQIE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  console.error('[fanqie-browser] 已打开新的番茄小说作家后台页面');
  return page;
}

/**
 * 确保浏览器可用 — 唯一的对外入口
 */
export async function ensureBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  if (_browser?.isConnected() && _context) {
    const page = await findOrCreateFanqiePage(_context);
    return { browser: _browser, context: _context, page };
  }

  // 连接到已有浏览器
  _browser = await connectViaCDP();

  // 获取默认上下文（CDP 连接模式下的已有 context）
  const contexts = _browser.contexts();
  _context = contexts[0] || await _browser.newContext();

  const page = await findOrCreateFanqiePage(_context);
  return { browser: _browser, context: _context, page };
}

/**
 * 断开连接（不关闭浏览器）
 */
export function disconnect(): void {
  if (_browser) {
    _browser.close().catch(() => {});
    _browser = null;
    _context = null;
    console.error('[fanqie-browser] 已断开连接');
  }
}

/**
 * 截图并返回 base64
 */
export async function takeScreenshot(page: Page, fullPage = true): Promise<string> {
  const buffer = await page.screenshot({ fullPage, type: 'png' });
  return buffer.toString('base64');
}

/**
 * 人类行为模拟延迟（随机间隔）
 */
export function humanDelay(minMs = 300, maxMs = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 固定延迟
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
