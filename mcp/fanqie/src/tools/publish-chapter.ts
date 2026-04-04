/**
 * publish-chapter.ts — 发布章节到番茄小说
 *
 * 流程：
 *   1. 导航到书籍的章节管理页
 *   2. 点击新建章节
 *   3. 填写标题和正文内容
 *   4. 点击发布
 *   5. 等待发布确认
 *   6. 截图验证
 */
import type { Page } from 'playwright';
import { takeScreenshot, humanDelay, sleep } from '../browser.js';

export interface PublishChapterParams {
  bookId: string;
  chapterTitle: string;
  chapterContent: string;
}

export interface PublishChapterResult {
  ok: boolean;
  message: string;
  screenshot?: string;
  error?: string;
  detail?: string;
}

export async function publishChapter(
  page: Page,
  params: PublishChapterParams,
): Promise<PublishChapterResult> {
  const { bookId, chapterTitle, chapterContent } = params;

  try {
    // ─── Step 1: 导航到章节管理页 ───
    // TODO: URL 路径需要在实际站点验证，可能是 /book/{bookId}/chapter 或类似路径
    const chapterManageUrl = `https://writer.fanqienovel.com/works/${bookId}/chapter`;
    console.error(`[fanqie-publish] 导航到章节管理页: ${chapterManageUrl}`);

    await page.goto(chapterManageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await humanDelay(1500, 2500);

    // ─── Step 2: 点击新建章节按钮 ───
    // TODO: 选择器需要在实际页面验证
    const newChapterSelectors = [
      'button:has-text("新建章节")',
      'button:has-text("添加章节")',
      'button:has-text("新增章节")',
      '[class*="add-chapter"]',
      '[class*="new-chapter"]',
      '.chapter-add-btn',
    ];

    let clicked = false;
    for (const selector of newChapterSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          clicked = true;
          console.error(`[fanqie-publish] 点击新建章节按钮: ${selector}`);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (!clicked) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到新建章节按钮',
        error: 'NEW_CHAPTER_BUTTON_NOT_FOUND',
        detail: '无法在页面上找到新建章节按钮，可能页面结构已变化。请截图查看当前页面状态。',
        screenshot,
      };
    }

    await humanDelay(1000, 2000);

    // ─── Step 3: 填写章节标题 ───
    // TODO: 选择器需要在实际页面验证
    const titleSelectors = [
      'input[placeholder*="章节标题"]',
      'input[placeholder*="标题"]',
      'input[class*="chapter-title"]',
      '.chapter-title-input input',
      '[class*="title"] input',
    ];

    let titleFilled = false;
    for (const selector of titleSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.click();
          await humanDelay();
          await input.fill('');
          await humanDelay(200, 400);
          await input.type(chapterTitle, { delay: 50 });
          titleFilled = true;
          console.error(`[fanqie-publish] 填写标题完成: ${selector}`);
          break;
        }
      } catch {
        // try next
      }
    }

    if (!titleFilled) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到章节标题输入框',
        error: 'TITLE_INPUT_NOT_FOUND',
        detail: '无法在页面上找到章节标题输入框。',
        screenshot,
      };
    }

    await humanDelay(500, 1000);

    // ─── Step 4: 填写章节内容 ───
    // TODO: 选择器需要在实际页面验证 — 番茄小说的编辑器可能是富文本编辑器
    const contentSelectors = [
      '[contenteditable="true"]',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="内容"]',
      '.chapter-content textarea',
      '[class*="editor-content"]',
      '[class*="chapter-editor"]',
      '.ProseMirror',
      '.ql-editor',
    ];

    let contentFilled = false;
    for (const selector of contentSelectors) {
      try {
        const editor = await page.$(selector);
        if (editor) {
          await editor.click();
          await humanDelay();

          // 判断是 textarea 还是 contenteditable
          const tagName = await editor.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'textarea') {
            await editor.fill(chapterContent);
          } else {
            // contenteditable 富文本编辑器
            // 将内容按段落分割，每段用 <p> 包裹
            const paragraphs = chapterContent.split('\n').filter(line => line.trim());
            const html = paragraphs.map(p => `<p>${p}</p>`).join('');
            await editor.evaluate((el, htmlContent) => {
              el.innerHTML = htmlContent;
              // 触发 input 事件确保框架能感知变化
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, html);
          }

          contentFilled = true;
          console.error(`[fanqie-publish] 填写内容完成: ${selector}`);
          break;
        }
      } catch {
        // try next
      }
    }

    if (!contentFilled) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到章节内容编辑器',
        error: 'CONTENT_EDITOR_NOT_FOUND',
        detail: '无法在页面上找到章节内容编辑区域。',
        screenshot,
      };
    }

    await humanDelay(1000, 1500);

    // ─── Step 5: 点击发布按钮 ───
    // TODO: 选择器需要在实际页面验证
    const publishSelectors = [
      'button:has-text("发布")',
      'button:has-text("提交")',
      'button:has-text("保存并发布")',
      '[class*="publish-btn"]',
      '[class*="submit-btn"]',
      'button.primary:has-text("发布")',
    ];

    let published = false;
    for (const selector of publishSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          published = true;
          console.error(`[fanqie-publish] 点击发布按钮: ${selector}`);
          break;
        }
      } catch {
        // try next
      }
    }

    if (!published) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到发布按钮',
        error: 'PUBLISH_BUTTON_NOT_FOUND',
        detail: '内容已填写但未找到发布按钮。',
        screenshot,
      };
    }

    // ─── Step 6: 等待发布确认 ───
    await sleep(3000);
    await humanDelay(1000, 2000);

    // TODO: 检查是否有发布成功提示或错误提示
    // 可能的成功标志：Toast 提示、页面跳转回章节列表、出现成功弹窗
    const successIndicators = [
      '.toast:has-text("成功")',
      '[class*="success"]',
      '[class*="message"]:has-text("成功")',
    ];

    let confirmed = false;
    for (const selector of successIndicators) {
      try {
        const el = await page.$(selector);
        if (el) {
          confirmed = true;
          break;
        }
      } catch {
        // ignore
      }
    }

    const screenshot = await takeScreenshot(page, false);

    return {
      ok: true,
      message: confirmed
        ? `章节发布成功: "${chapterTitle}"`
        : `发布操作已执行（未检测到明确确认提示），请查看截图确认: "${chapterTitle}"`,
      screenshot,
    };
  } catch (err) {
    const error = err as Error;
    let screenshot: string | undefined;
    try {
      screenshot = await takeScreenshot(page, false);
    } catch {
      // ignore screenshot failure
    }

    return {
      ok: false,
      message: `发布过程出错: ${error.message}`,
      error: 'PUBLISH_ERROR',
      detail: error.stack,
      screenshot,
    };
  }
}
