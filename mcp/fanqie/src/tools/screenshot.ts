/**
 * screenshot.ts — 截图工具
 *
 * 捕获当前页面状态，返回 base64 编码的 PNG 图片
 */
import type { Page } from 'playwright';
import { takeScreenshot } from '../browser.js';

export interface ScreenshotResult {
  ok: boolean;
  message: string;
  screenshot?: string;
  url?: string;
}

export async function screenshot(page: Page, fullPage = true): Promise<ScreenshotResult> {
  try {
    const url = page.url();
    const base64 = await takeScreenshot(page, fullPage);

    return {
      ok: true,
      message: `截图完成，当前页面: ${url}`,
      screenshot: base64,
      url,
    };
  } catch (err) {
    const error = err as Error;
    return {
      ok: false,
      message: `截图失败: ${error.message}`,
    };
  }
}
