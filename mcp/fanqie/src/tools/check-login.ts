/**
 * check-login.ts — 检查番茄小说作家后台登录状态
 *
 * 导航到 writer.fanqienovel.com，检测是否已登录：
 *   - 已登录：能看到后台仪表盘元素
 *   - 未登录：出现登录表单/二维码
 */
import type { Page } from 'playwright';
import { FANQIE_URL, takeScreenshot, humanDelay } from '../browser.js';

export interface CheckLoginResult {
  ok: boolean;
  loggedIn: boolean;
  phase: 'logged_in' | 'not_logged_in';
  message: string;
  screenshot?: string;
}

export async function checkLogin(page: Page): Promise<CheckLoginResult> {
  // 先导航到首页
  const currentUrl = page.url();
  if (!currentUrl.includes('writer.fanqienovel.com')) {
    await page.goto(FANQIE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
  }

  await humanDelay(1000, 2000);

  // 检查是否跳转到了登录页
  const url = page.url();
  const isLoginPage = url.includes('/login') || url.includes('/sign');

  if (isLoginPage) {
    const screenshot = await takeScreenshot(page, false);
    return {
      ok: true,
      loggedIn: false,
      phase: 'not_logged_in',
      message: '未登录 — 请在浏览器中手动登录番茄小说作家后台，然后重新调用本接口检查',
      screenshot,
    };
  }

  // 检查页面上是否有后台仪表盘的标志性元素
  // TODO: 以下选择器需要在实际页面上验证，可能需要调整
  const dashboardIndicators = [
    '.works-manage',           // 作品管理
    '[class*="dashboard"]',    // 仪表盘
    '[class*="sidebar"]',      // 侧边栏（后台常见）
    '[class*="header-user"]',  // 用户头像区域
    'a[href*="/book"]',        // 书籍相关链接
    '.creator-home',           // 创作者主页
  ];

  let foundDashboard = false;
  for (const selector of dashboardIndicators) {
    try {
      const el = await page.$(selector);
      if (el) {
        foundDashboard = true;
        break;
      }
    } catch {
      // ignore
    }
  }

  // 兜底判断：如果没被重定向到登录页，且URL中有 writer.fanqienovel.com，大概率已登录
  if (!foundDashboard && url.includes('writer.fanqienovel.com') && !isLoginPage) {
    foundDashboard = true;
  }

  if (foundDashboard) {
    return {
      ok: true,
      loggedIn: true,
      phase: 'logged_in',
      message: '已登录番茄小说作家后台',
    };
  }

  const screenshot = await takeScreenshot(page, false);
  return {
    ok: true,
    loggedIn: false,
    phase: 'not_logged_in',
    message: '无法确认登录状态 — 请在浏览器中手动检查并登录，然后重新调用本接口',
    screenshot,
  };
}
