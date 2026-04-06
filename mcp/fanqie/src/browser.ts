/**
 * browser.ts — Playwright 浏览器连接管理
 *
 * 职责：
 *   1. 通过 CDP 连接到已有的 Chrome/Chromium 浏览器实例
 *   2. 如果没有已有实例，自动启动带调试端口的 Chrome（独立 profile，不影响用户浏览器）
 *   3. 找到或创建番茄小说作家后台页面
 *   4. 提供截图、延迟等辅助函数
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// ── 配置 ──

const CDP_PORT = parseInt(process.env.FANQIE_CDP_PORT || process.env.BROWSER_DEBUG_PORT || '40821', 10);
const FANQIE_URL = process.env.FANQIE_URL || 'https://fanqienovel.com/main/writer/';
const OUTPUT_DIR = process.env.FANQIE_OUTPUT_DIR || '/tmp/fanqie-output';
const PROTOCOL_TIMEOUT = parseInt(process.env.FANQIE_PROTOCOL_TIMEOUT || '60000', 10);

// 固定 profile 目录 — 保持登录态，不影响用户的正常 Chrome
const CHROME_PROFILE_DIR = process.env.FANQIE_CHROME_PROFILE || path.join(os.homedir(), '.chrome-fanqie');

export { OUTPUT_DIR, FANQIE_URL };

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;

/**
 * 在 macOS 上找到 Chrome 的可执行路径
 */
function findChromePath(): string | null {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * 检查 CDP 端口是否可连接
 */
async function isCDPReady(): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 等待 CDP 端口就绪
 */
async function waitForCDP(maxRetries = 10, intervalMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (await isCDPReady()) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * 自动启动带调试端口的 Chrome（独立 profile）
 */
async function launchChromeWithDebugPort(): Promise<void> {
  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('找不到 Chrome/Chromium。请安装 Google Chrome。');
  }

  console.error(`[fanqie-browser] 自动启动 Chrome（profile: ${CHROME_PROFILE_DIR}）`);

  // 使用独立的 user-data-dir，这样：
  // 1. 不影响用户正常使用的 Chrome
  // 2. 可以和用户的 Chrome 同时运行
  // 3. 登录态持久化（固定 profile 目录）
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${CHROME_PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    FANQIE_URL,
  ];

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  console.error(`[fanqie-browser] Chrome 启动中，等待 CDP 就绪...`);
  const ready = await waitForCDP(15, 1000);
  if (!ready) {
    throw new Error(`Chrome 启动后 CDP 端口 ${CDP_PORT} 未就绪。请检查是否有其他进程占用该端口。`);
  }
  console.error(`[fanqie-browser] CDP 就绪`);
}

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
    if (url.includes('fanqienovel.com/main/writer')) {
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
 *
 * 逻辑：
 *   1. 如果已有连接，复用
 *   2. 尝试 CDP 连接
 *   3. 连接失败 → 自动启动 Chrome → 重试连接
 */
export async function ensureBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  if (_browser?.isConnected() && _context) {
    const page = await findOrCreateFanqiePage(_context);
    return { browser: _browser, context: _context, page };
  }

  // 第一次尝试：直接连接
  try {
    _browser = await connectViaCDP();
  } catch {
    console.error(`[fanqie-browser] CDP 连接失败，自动启动 Chrome...`);

    // 自动启动 Chrome
    await launchChromeWithDebugPort();

    // 重试连接
    _browser = await connectViaCDP();
  }

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
