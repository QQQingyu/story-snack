/**
 * operator.ts — 纯 CDP 底层操作封装（参考 douyin-upload-mcp-skill）
 *
 * 设计原则：
 *   - 所有 DOM 查询通过 page.evaluate() 一次性执行
 *   - 鼠标/键盘事件通过 CDP Input 域发送，生成 isTrusted=true 的原生事件
 *   - 每个方法都是独立的原子操作
 */
import type { Page } from 'playwright';

interface LocateResult {
  found: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  selector?: string;
}

function humanize(x: number, y: number, jitter = 3) {
  return {
    x: x + (Math.random() * 2 - 1) * jitter,
    y: y + (Math.random() * 2 - 1) * jitter,
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min: number, max: number) {
  return sleep(min + Math.random() * (max - min));
}

export function createOperator(page: Page) {

  /**
   * 通过 CSS 选择器列表查找第一个可见元素，返回其中心坐标
   * 支持 :has-text("xxx") 伪选择器
   */
  async function locate(selectors: string | string[]): Promise<LocateResult> {
    const sels = Array.isArray(selectors) ? selectors : [selectors];
    return page.evaluate((selsInner: string[]) => {
      for (const sel of selsInner) {
        let el: Element | null = null;
        try {
          if (sel.includes(':has-text(')) {
            const m = sel.match(/^(.*):has-text\("(.*)"\)$/);
            if (m) {
              const candidates = [...document.querySelectorAll(m[1] || '*')];
              el = candidates.find(n => {
                const r = n.getBoundingClientRect();
                const st = getComputedStyle(n);
                return r.width > 0 && r.height > 0
                  && st.display !== 'none' && st.visibility !== 'hidden'
                  && n.textContent?.includes(m[2]);
              }) || null;
            }
          } else {
            const all = [...document.querySelectorAll(sel)];
            el = all.find(n => {
              const r = n.getBoundingClientRect();
              const st = getComputedStyle(n);
              return r.width > 0 && r.height > 0
                && st.display !== 'none' && st.visibility !== 'hidden';
            }) || null;
          }
        } catch { /* selector syntax error */ }

        if (el) {
          const rect = el.getBoundingClientRect();
          return {
            found: true,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            width: rect.width,
            height: rect.height,
            selector: sel,
          };
        }
      }
      return { found: false };
    }, sels);
  }

  return {
    locate,

    /**
     * 点击元素 — 用 mouse.move + down + up 生成 isTrusted=true 事件
     */
    async click(selectors: string | string[], opts: { jitter?: number } = {}) {
      const { jitter = 5 } = opts;
      const sels = Array.isArray(selectors) ? selectors : [selectors];
      const loc = await locate(sels);
      if (!loc.found || !loc.x || !loc.y) {
        return { ok: false, error: 'not_found', selectors: sels };
      }

      const { x, y } = humanize(loc.x, loc.y, jitter);
      await page.mouse.move(x, y);
      await randomDelay(30, 80);
      await page.mouse.down();
      await randomDelay(50, 100);
      await page.mouse.up();

      return { ok: true, x, y, selector: loc.selector };
    },

    /**
     * 在指定坐标点击
     */
    async clickAt(x: number, y: number) {
      const h = humanize(x, y, 3);
      await page.mouse.move(h.x, h.y);
      await randomDelay(30, 80);
      await page.mouse.down();
      await randomDelay(50, 100);
      await page.mouse.up();
      return { ok: true, x: h.x, y: h.y };
    },

    /**
     * 输入文本 — 用 Playwright keyboard.insertText（内部走 CDP Input.insertText）
     */
    async type(text: string) {
      await page.keyboard.insertText(text);
      return { ok: true, length: text.length };
    },

    /**
     * 填写 input/textarea — 先点击聚焦，再全选清除，再输入
     */
    async fill(selectors: string | string[], text: string) {
      const clickResult = await this.click(selectors);
      if (!clickResult.ok) return clickResult;

      await randomDelay(100, 200);

      // 全选并清除现有内容
      await page.keyboard.press('Meta+a');
      await randomDelay(50, 100);
      await page.keyboard.press('Backspace');
      await randomDelay(50, 100);

      // 用 CDP insertText 输入
      await this.type(text);
      return { ok: true, selector: clickResult.selector };
    },

    /**
     * 轮询等待条件满足
     */
    async waitFor(
      conditionFn: (...args: unknown[]) => unknown,
      opts: { timeout?: number; interval?: number; args?: unknown[] } = {},
    ) {
      const { timeout = 30_000, interval = 500, args = [] } = opts;
      const start = Date.now();

      while (Date.now() - start < timeout) {
        try {
          const result = await page.evaluate(conditionFn, ...args);
          if (result) return { ok: true, result, elapsed: Date.now() - start };
        } catch { /* page loading */ }
        await sleep(interval);
      }
      return { ok: false, error: 'timeout', elapsed: Date.now() - start };
    },

    /**
     * 截图
     */
    async screenshot(fullPage = false) {
      const buffer = await page.screenshot({ fullPage, type: 'png' });
      return buffer.toString('base64');
    },

    /** evaluate 快捷方式 */
    async query<T>(fn: (...args: unknown[]) => T, ...args: unknown[]) {
      return page.evaluate(fn, ...args);
    },

    /** 当前 URL */
    url() { return page.url(); },

    /** 原始 page */
    get page() { return page; },
  };
}
