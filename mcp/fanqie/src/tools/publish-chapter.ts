/**
 * publish-chapter.ts — 发布章节到番茄小说
 *
 * 基于 operator.ts 的 CDP 原子操作，参考 douyin-upload-mcp-skill 的模式。
 * 所有点击用 mouse.move+down+up（isTrusted=true），输入用 CDP Input.insertText。
 */
import type { Page } from 'playwright';
import { createOperator } from '../operator.js';
import { takeScreenshot, sleep } from '../browser.js';

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

// ── 番茄编辑器选择器 ──
const SEL = {
  createChapterBtn: ['button:has-text("创建章节")', 'a:has-text("创建章节")'],
  nextStepBtn: ['button:has-text("下一步")', 'a:has-text("下一步")'],
  titlePlaceholder: ['*:has-text("请输入标题")'],
  titleInput: ['[data-placeholder*="标题"]', '[placeholder*="标题"]'],
  contentEditor: [
    '[contenteditable="true"]:not([placeholder*="标题"])',
    '.ProseMirror',
    '[contenteditable="true"]',
  ],
  // Arco Design Modal
  arcoModal: ['[class*="arco-modal"]'],
  publishConfirmBtn: ['button:has-text("确认发布")', 'button:has-text("发布")'],
  // 引导弹窗
  dismissBtns: ['button:has-text("跳过")', 'button:has-text("知道了")', 'button:has-text("关闭")'],
};

export async function publishChapter(
  initialPage: Page,
  params: PublishChapterParams,
): Promise<PublishChapterResult> {
  let page = initialPage;
  const { bookId } = params;
  // 番茄平台会自动加"第N章"前缀，标题里不能重复带
  const chapterTitle = params.chapterTitle.replace(/^第\s*\d+\s*章[：:\s]*/u, '');
  // 去掉正文中的 markdown 分节标题（## 上 · xxx、## 中 · xxx、## 下 · xxx）
  const chapterContent = params.chapterContent.replace(/^#{1,3}\s+.+$/gm, '').replace(/\n{3,}/g, '\n\n');

  try {
    // ─── Step 1: 导航到指定作品的章节管理页 ───
    // 必须用 bookId 定位到具体作品，避免误读其他作品的章节数
    const chapterManageUrl = `https://fanqienovel.com/main/writer/chapter-manage/${bookId}`;
    await page.goto(chapterManageUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await sleep(3000);
    console.error(`[publish] 章节管理页: ${page.url()}`);

    // ─── Step 1.5: 读取当前作品的已有章节数 ───
    let nextChapterNum = 1;
    try {
      // 在章节管理页中，统计已有章节行数
      // 番茄的章节管理页每章一行，包含"第N章"文字
      const chapterRows = await page.$$eval(
        '[class*="chapter"], tr, [class*="item"]',
        (rows) => {
          let maxNum = 0;
          for (const row of rows) {
            const text = row.textContent || '';
            const match = text.match(/第\s*(\d+)\s*章/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
          return maxNum;
        }
      );
      if (chapterRows > 0) {
        nextChapterNum = chapterRows + 1;
        console.error(`[publish] 已有 ${chapterRows} 章 → 新章节编号: ${nextChapterNum}`);
      } else {
        // 回退：从页面全文匹配
        const bodyText = await page.textContent('body');
        const allMatches = bodyText?.matchAll(/第\s*(\d+)\s*章/g);
        if (allMatches) {
          for (const m of allMatches) {
            const num = parseInt(m[1], 10);
            if (num >= nextChapterNum) nextChapterNum = num + 1;
          }
        }
        if (nextChapterNum > 1) {
          console.error(`[publish] 页面文本匹配 → 新章节编号: ${nextChapterNum}`);
        } else {
          console.error(`[publish] 未发现已有章节 → 新章节编号: 1`);
        }
      }
    } catch (e) {
      console.error(`[publish] 章节数检测失败，使用默认值 1: ${e}`);
    }

    // ─── Step 2: 点击"创建章节" ───
    const context = page.context();
    const pagePromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null);

    let clicked = false;
    for (const sel of SEL.createChapterBtn) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      return { ok: false, message: '未找到创建章节按钮', error: 'BTN_NOT_FOUND', screenshot: await takeScreenshot(page, false) };
    }

    const newPage = await pagePromise;
    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded');
      page = newPage;
      console.error(`[publish] 新标签页: ${page.url()}`);
    } else {
      await page.waitForURL(/publish/, { timeout: 10000 }).catch(() => {});
    }

    // 创建 operator（必须在正确的 page 上）
    const op = createOperator(page);

    // ─── Step 3: 等待编辑器就绪 + 关闭引导弹窗 ───
    await sleep(3000);
    for (let i = 0; i < 3; i++) {
      const dismissed = await op.click(SEL.dismissBtns);
      if (!dismissed.ok) break;
      console.error(`[publish] 关闭引导弹窗: ${dismissed.selector}`);
      await sleep(800);
    }

    // ─── Step 4a: 填写章节号 ───
    // 用 Playwright 原生 fill()，它专门处理 React controlled input
    await sleep(2000); // 等待编辑器完全加载
    {
      const inputs = await page.$$('input');
      let filled = false;
      console.error(`[publish] 找到 ${inputs.length} 个 input 元素`);
      for (const input of inputs) {
        if (!await input.isVisible()) continue;
        const isChapterNum = await input.evaluate((el) => {
          let node: Element | null = el;
          for (let i = 0; i < 8 && node; i++) {
            node = node.parentElement;
            if (!node) break;
            if (node.textContent?.includes('第') && node.textContent?.includes('章')) return true;
          }
          return false;
        });
        if (isChapterNum) {
          await input.fill(String(nextChapterNum));
          const val = await input.inputValue();
          console.error(`[publish] 章节号: fill(${nextChapterNum}), 验证值="${val}"`);
          filled = val === String(nextChapterNum);
          break;
        }
      }
      if (!filled) {
        const ss = await takeScreenshot(page, false);
        return { ok: false, message: '章节号填写失败', error: 'NUM_FILL_FAILED', screenshot: ss };
      }
    }

    await sleep(500);

    // ─── Step 4b: 填写标题 ───
    // 标题是 contenteditable div，用 Playwright click + keyboard.insertText
    {
      const titleEl = await page.$('[data-placeholder*="标题"]')
        || await page.$('[placeholder*="标题"]');

      if (titleEl) {
        const tag = await titleEl.evaluate(el => el.tagName);
        if (tag === 'INPUT') {
          await titleEl.fill(chapterTitle);
        } else {
          // contenteditable
          await titleEl.click();
          await sleep(200);
          await page.keyboard.insertText(chapterTitle);
        }
        console.error(`[publish] 标题已填写: ${chapterTitle} (tag=${tag})`);
      } else {
        // 回退：点击"请输入标题"文字
        const placeholder = await page.$('text=请输入标题');
        if (placeholder) {
          await placeholder.click();
          await sleep(200);
          await page.keyboard.insertText(chapterTitle);
          console.error(`[publish] 标题已填写(占位符点击): ${chapterTitle}`);
        } else {
          return { ok: false, message: '未找到标题输入框', error: 'TITLE_NOT_FOUND', screenshot: await takeScreenshot(page, false) };
        }
      }
    }

    await sleep(500);

    // ─── Step 5: 填写正文 ───
    // 正文编辑器是页面上最大的 contenteditable，需要和标题区分开
    {
      // 先点击空白处让标题失去焦点
      await page.mouse.click(100, 600);
      await sleep(300);

      // 找所有 contenteditable，选择面积最大的那个（正文编辑器）
      const editables = await page.$$('[contenteditable="true"]');
      let contentEl = null;
      let maxArea = 0;
      for (const el of editables) {
        const box = await el.boundingBox();
        if (!box) continue;
        const area = box.width * box.height;
        if (area > maxArea) {
          maxArea = area;
          contentEl = el;
        }
      }

      if (!contentEl) {
        return { ok: false, message: '未找到正文编辑器', error: 'CONTENT_NOT_FOUND', screenshot: await takeScreenshot(page, false) };
      }

      await contentEl.click();
      await sleep(300);
      const plainText = chapterContent.split('\n').filter(l => l.trim()).join('\n');
      await page.keyboard.insertText(plainText);
      console.error(`[publish] 正文已填写 (insertText, ${plainText.length} 字符, 编辑器面积=${maxArea})`);
    }

    console.error(`[publish] 正文已填写`);
    await sleep(2000);

    // ─── Step 6: 点击"下一步" ───
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    {
      // 直接用 DOM click 触发（"下一步"不在 Modal 里，DOM click 有效）
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('button, a');
        for (const btn of btns) {
          if (btn.textContent?.trim().includes('下一步')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              (btn as HTMLElement).click();
              return { ok: true, text: btn.textContent?.trim().slice(0, 20), x: Math.round(rect.x), y: Math.round(rect.y) };
            }
          }
        }
        return { ok: false };
      });
      console.error(`[publish] 点击下一步: ${JSON.stringify(clicked)}`);
      if (!clicked.ok) {
        return { ok: false, message: '未找到下一步按钮', error: 'NEXT_NOT_FOUND', screenshot: await takeScreenshot(page, false) };
      }
    }
    await sleep(3000);

    // ─── Step 7-9: 处理弹窗直到发布完成 ───
    // 番茄发布流程中会随机出现多种弹窗：
    //   - "是否进行内容风险检测？" → 点击"取消"跳过（随机）
    //   - "检测到你还有错别字未修改" → 点击"提交"继续（随机）
    //   - "发布设置" → 点击"确认发布"（必要）
    // 统一用循环处理：每轮检测当前弹窗类型，点击对应按钮
    let published = false;
    for (let round = 0; round < 10 && !published; round++) {
      await sleep(2000);

      const action = await page.evaluate(() => {
        const btns = document.querySelectorAll('button, span, div, a');

        // 优先级1: 发布确认按钮（最终目标）
        for (const btn of btns) {
          const text = btn.textContent?.trim();
          if (text === '确认发布') {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              // 先勾选"是否使用AI"→ 选"否"
              const labels = document.querySelectorAll('label, span, div');
              for (const label of labels) {
                const lt = label.textContent?.trim();
                if (lt === '否') {
                  const radio = label.querySelector('input[type="radio"]')
                    || label.previousElementSibling as HTMLInputElement | null;
                  if (radio && (radio as HTMLInputElement).type === 'radio') {
                    (radio as HTMLInputElement).click();
                  } else {
                    // 直接点击"否"文字或其容器
                    (label as HTMLElement).click();
                  }
                  break;
                }
              }
              // 点击确认发布
              (btn as HTMLElement).click();
              return { action: 'published', text };
            }
          }
        }

        // 优先级2: 提交按钮（错别字确认等随机弹窗）
        for (const btn of btns) {
          const text = btn.textContent?.trim();
          if (text === '提交') {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              (btn as HTMLElement).click();
              return { action: 'submit', text };
            }
          }
        }

        // 优先级3: 取消按钮（风险检测等随机弹窗，点取消跳过）
        // 只在有弹窗遮罩时才点取消，避免误点
        const hasModal = !!document.querySelector('[class*="arco-modal"]');
        if (hasModal) {
          for (const btn of btns) {
            const text = btn.textContent?.trim();
            if (text === '取消') {
              const rect = btn.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                (btn as HTMLElement).click();
                return { action: 'dismiss', text };
              }
            }
          }
        }

        // 优先级4: 下一步按钮（还在编辑器页面，需要继续推进）
        for (const btn of btns) {
          if (btn.textContent?.trim().includes('下一步')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              (btn as HTMLElement).click();
              return { action: 'next', text: '下一步' };
            }
          }
        }

        return { action: 'none' };
      });

      console.error(`[publish] 弹窗循环 #${round}: ${JSON.stringify(action)}`);

      if (action.action === 'published') {
        published = true;
      }
      // dismiss/submit/next 继续下一轮循环
      // none 也继续（可能弹窗还在加载）
    }

    await sleep(3000);
    const screenshot = await takeScreenshot(page, false);

    return {
      ok: true,
      message: published
        ? `章节发布成功: "${chapterTitle}"，请查看截图确认`
        : `章节发布操作已执行: "${chapterTitle}"，请查看截图确认`,
      screenshot,
    };

  } catch (err) {
    const error = err as Error;
    let screenshot: string | undefined;
    try { screenshot = await takeScreenshot(page, false); } catch { /* ignore */ }
    return { ok: false, message: `发布出错: ${error.message}`, error: 'PUBLISH_ERROR', detail: error.stack, screenshot };
  }
}
