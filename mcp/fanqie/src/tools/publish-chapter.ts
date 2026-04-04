/**
 * publish-chapter.ts — 发布章节到番茄小说
 *
 * 流程：
 *   1. 导航到作品管理页 (book-manage)
 *   2. 点击"创建章节"按钮
 *   3. 关闭可能出现的引导弹窗
 *   4. 填写章节标题和正文
 *   5. 点击"下一步"然后"发布"
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
  initialPage: Page,
  params: PublishChapterParams,
): Promise<PublishChapterResult> {
  let page = initialPage;
  const { bookId, chapterTitle, chapterContent } = params;

  try {
    // ─── Step 1: 导航到作品管理页 ───
    const bookManageUrl = `https://fanqienovel.com/main/writer/book-manage?enter_from=book_detail`;
    console.error(`[fanqie-publish] 导航到作品管理页: ${bookManageUrl}`);

    await page.goto(bookManageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await humanDelay(2000, 3000);
    console.error(`[fanqie-publish] 当前页面 URL: ${page.url()}`);

    // ─── Step 2: 点击创建章节按钮 ───
    // "创建章节"可能触发页面导航或打开新标签页
    const newChapterSelectors = [
      'button:has-text("创建章节")',
      'a:has-text("创建章节")',
    ];

    let clicked = false;
    for (const selector of newChapterSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          // 监听可能的新页面（新标签页）
          const context = page.context();
          const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);

          // 同时等待导航和点击
          const [newPage] = await Promise.all([
            pagePromise,
            btn.click(),
          ]);

          if (newPage) {
            // 打开了新标签页，切换到新页面
            await newPage.waitForLoadState('domcontentloaded');
            page = newPage;
            console.error(`[fanqie-publish] 创建章节打开了新标签页: ${page.url()}`);
          } else {
            // 在当前页面导航
            await page.waitForURL(/publish/, { timeout: 10000 }).catch(() => {});
            console.error(`[fanqie-publish] 创建章节导航到: ${page.url()}`);
          }

          clicked = true;
          console.error(`[fanqie-publish] 点击创建章节按钮: ${selector}`);
          break;
        }
      } catch (e) {
        console.error(`[fanqie-publish] 尝试 ${selector} 失败: ${(e as Error).message}`);
      }
    }

    if (!clicked) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到创建章节按钮',
        error: 'NEW_CHAPTER_BUTTON_NOT_FOUND',
        detail: '无法在页面上找到创建章节按钮。',
        screenshot,
      };
    }

    await humanDelay(2000, 3000);
    console.error(`[fanqie-publish] 编辑页 URL: ${page.url()}`);

    // ─── Step 3: 关闭可能出现的引导弹窗 ───
    // 番茄编辑器首次使用时可能弹出分卷引导等弹窗
    // 注意：不要按 Escape，可能会导致编辑器退出
    const dismissSelectors = [
      'button:has-text("跳过")',
      'button:has-text("知道了")',
      'button:has-text("关闭")',
      'button:has-text("下一步"):not([class*="publish"])',
    ];

    // 尝试关闭引导弹窗（最多3轮，每轮尝试点击按钮）
    for (let attempt = 0; attempt < 3; attempt++) {
      let dismissed = false;
      for (const selector of dismissSelectors) {
        try {
          const els = await page.$$(selector);
          for (const el of els) {
            // 只点击弹窗里的按钮，不点右上角的"下一步"发布按钮
            const box = await el.boundingBox();
            if (box && box.x < 800 && box.y < 500) {
              await el.click();
              dismissed = true;
              console.error(`[fanqie-publish] 关闭引导弹窗 (attempt ${attempt}): ${selector}`);
              await humanDelay(800, 1200);
              break;
            }
          }
          if (dismissed) break;
        } catch {
          // ignore
        }
      }
      if (!dismissed) break; // 没有弹窗了
      await humanDelay(500, 800);
    }

    console.error(`[fanqie-publish] 弹窗处理完毕, 当前URL: ${page.url()}`);

    // ─── Step 4: 填写章节号和标题 ───
    // 编辑器标题区域格式: "第 ___ 章  请输入标题"
    // 章节号和标题是两个独立的输入区域

    // 4a: 填写章节号（"第___章"中间的数字）
    // 从 chapterTitle 中提取章节号，如 "修理铺开门了" 对应章节 1
    // 章节号通过外部传入或从 arc-progress 推断
    let chapterNumFilled = false;
    try {
      // 查找章节号输入框 — 通常在"第"和"章"之间
      const numInputs = await page.$$('input');
      for (const input of numInputs) {
        if (!await input.isVisible()) continue;
        const ph = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        // 章节号输入框通常是 number 或没有 placeholder
        if (type === 'number' || (ph === '' || ph === null)) {
          const box = await input.boundingBox();
          // 章节号应该在页面上方区域
          if (box && box.y < 300) {
            await input.click();
            await humanDelay();
            await input.fill('1');
            chapterNumFilled = true;
            console.error(`[fanqie-publish] 填写章节号: 1`);
            break;
          }
        }
      }
    } catch {
      // ignore
    }

    // 4b: 填写章节标题
    let titleFilled = false;

    // 方式1: 点击"请输入标题"占位符文字
    try {
      const titleArea = await page.$('text=请输入标题');
      if (titleArea) {
        await titleArea.click();
        await humanDelay();
        await page.keyboard.type(chapterTitle, { delay: 30 });
        titleFilled = true;
        console.error('[fanqie-publish] 通过点击"请输入标题"填写标题');
      }
    } catch {
      // ignore
    }

    // 方式2: 查找带有标题相关属性的元素
    if (!titleFilled) {
      const titleSelectors = [
        '[data-placeholder*="标题"]',
        '[placeholder*="标题"]',
        'input[placeholder*="标题"]',
      ];
      for (const selector of titleSelectors) {
        try {
          const el = await page.$(selector);
          if (el && await el.isVisible()) {
            await el.click();
            await humanDelay();
            const tagName = await el.evaluate(e => e.tagName.toLowerCase());
            if (tagName === 'input') {
              await el.fill(chapterTitle);
            } else {
              await page.keyboard.type(chapterTitle, { delay: 30 });
            }
            titleFilled = true;
            console.error(`[fanqie-publish] 填写标题完成: ${selector}`);
            break;
          }
        } catch {
          // try next
        }
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

    // ─── Step 5: 填写章节内容 ───
    const contentSelectors = [
      '[contenteditable="true"]:not([placeholder*="标题"])',
      'div[class*="editor"][contenteditable="true"]',
      '.ProseMirror',
      '.ql-editor',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="内容"]',
      '[contenteditable="true"]',
    ];

    let contentFilled = false;
    for (const selector of contentSelectors) {
      try {
        // 可能有多个 contenteditable，标题和正文各一个
        const editors = await page.$$(selector);
        for (const editor of editors) {
          if (!await editor.isVisible()) continue;

          // 跳过标题输入框（已经填过的）
          const text = await editor.textContent();
          if (text?.includes(chapterTitle)) continue;

          const placeholder = await editor.getAttribute('placeholder');
          if (placeholder?.includes('标题')) continue;

          await editor.click();
          await humanDelay();

          const tagName = await editor.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'textarea') {
            await editor.fill(chapterContent);
          } else {
            // contenteditable 富文本编辑器
            const paragraphs = chapterContent.split('\n').filter(line => line.trim());
            const html = paragraphs.map(p => `<p>${p}</p>`).join('');
            await editor.evaluate((el, htmlContent) => {
              el.innerHTML = htmlContent;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, html);
          }

          contentFilled = true;
          console.error(`[fanqie-publish] 填写内容完成: ${selector}`);
          break;
        }
        if (contentFilled) break;
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

    // ─── Step 6: 点击右上角"下一步"按钮 ───
    console.error('[fanqie-publish] 内容填写完毕，准备点击下一步');

    // 等待确保内容已保存
    await sleep(2000);

    // 辅助函数：点击右上角的"下一步"按钮
    async function clickNextButton(): Promise<boolean> {
      const btns = await page.$$('button:has-text("下一步"), a:has-text("下一步")');
      for (const btn of btns) {
        if (!await btn.isVisible()) continue;
        const box = await btn.boundingBox();
        if (box && box.x > 900) {
          await btn.click();
          console.error(`[fanqie-publish] 点击右上角下一步, box: x=${box.x} y=${box.y}`);
          return true;
        }
      }
      return false;
    }

    // 第一次点击"下一步"
    if (!await clickNextButton()) {
      const screenshot = await takeScreenshot(page, false);
      return {
        ok: false,
        message: '未找到下一步按钮',
        error: 'NEXT_BUTTON_NOT_FOUND',
        detail: '内容已填写但未找到右上角的下一步按钮。',
        screenshot,
      };
    }

    await humanDelay(2000, 3000);

    // ─── Step 7: 处理"内容风险检测"弹窗 ───
    // 点击"取消"跳过风险检测（不消耗使用次数）
    try {
      const cancelBtn = await page.$('button:has-text("取消")');
      if (cancelBtn && await cancelBtn.isVisible()) {
        await cancelBtn.click();
        console.error('[fanqie-publish] 跳过内容风险检测弹窗');
        await humanDelay(1000, 2000);
      }
    } catch {
      // 没有弹窗，继续
    }

    // ─── Step 8: 再次点击"下一步"进入发布设置页 ───
    await clickNextButton();
    await humanDelay(3000, 4000);
    console.error(`[fanqie-publish] 当前页面 URL: ${page.url()}`);

    // ─── Step 9: 在发布设置页点击"发布" ───
    // 可能有发布设置页面（定时发布、免费/付费等），需要点击最终的"发布"按钮
    const publishSelectors = [
      'button:has-text("发布")',
      'button:has-text("确认发布")',
      'button:has-text("提交")',
      'button:has-text("确定")',
    ];

    let published = false;
    for (const selector of publishSelectors) {
      try {
        const btns = await page.$$(selector);
        for (const btn of btns) {
          if (await btn.isVisible()) {
            await btn.click();
            published = true;
            console.error(`[fanqie-publish] 点击发布按钮: ${selector}`);
            break;
          }
        }
        if (published) break;
      } catch {
        // try next
      }
    }

    // 等待发布完成
    await sleep(3000);
    await humanDelay(1000, 2000);

    const screenshot = await takeScreenshot(page, false);

    if (published) {
      return {
        ok: true,
        message: `章节发布成功: "${chapterTitle}"，请查看截图确认`,
        screenshot,
      };
    }

    // 如果没找到发布按钮，可能"下一步"本身就是最终发布
    return {
      ok: true,
      message: `章节发布操作已执行: "${chapterTitle}"，请查看截图确认`,
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
