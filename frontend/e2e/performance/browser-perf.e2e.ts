import { test, expect } from "@playwright/test";
import { registerUser, uniqueSuffix } from "../helpers/api";
import { setCookieAndStorage } from "../fixtures/auth";

const THRESHOLDS = {
  ttfb: 2000,
  domContentLoaded: 1500,
  fcp: 2000,
  loginFlow: 3000,
  timelineLoad: 3000,
  postCreate: 2000,
};

interface NavTiming {
  ttfb: number;
  domContentLoaded: number;
}

interface PaintEntry {
  name: string;
  startTime: number;
}

test.describe("ブラウザパフォーマンス計測", () => {
  let testUser: { accessToken: string; refreshToken: string; userId: number; username: string; email: string };

  test.beforeAll(async () => {
    const suffix = uniqueSuffix();
    testUser = await registerUser(`e2e_perf_${suffix}`, `e2e_perf_${suffix}@test.invalid`, "E2eTest1");
  });

  test("ログインページの TTFB が 2000ms 未満である", async ({ page }) => {
    await page.goto("/login");
    const timing = await page.evaluate<NavTiming>(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return { ttfb: nav.responseStart, domContentLoaded: nav.domContentLoadedEventEnd };
    });
    console.log(`[Perf] Login page TTFB: ${timing.ttfb.toFixed(1)}ms`);
    expect(timing.ttfb).toBeLessThan(THRESHOLDS.ttfb);
  });

  test("ログインページの DOMContentLoaded が 1500ms 未満である", async ({ page }) => {
    await page.goto("/login");
    const timing = await page.evaluate<NavTiming>(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return { ttfb: nav.responseStart, domContentLoaded: nav.domContentLoadedEventEnd };
    });
    console.log(`[Perf] Login page DOMContentLoaded: ${timing.domContentLoaded.toFixed(1)}ms`);
    expect(timing.domContentLoaded).toBeLessThan(THRESHOLDS.domContentLoaded);
  });

  test("ログインページの FCP (First Contentful Paint) が 2000ms 未満である", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const fcp = await page.evaluate<number>(() => {
      const entries = performance.getEntriesByType("paint") as PaintEntry[];
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
      return fcpEntry?.startTime ?? -1;
    });
    console.log(`[Perf] Login page FCP: ${fcp.toFixed(1)}ms`);
    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(THRESHOLDS.fcp);
  });

  test("ログイン操作から /home 到達まで 3000ms 未満である", async ({ page }) => {
    await page.goto("/login");
    const start = Date.now();
    await page.getByTestId("email-input").fill(testUser.email);
    await page.getByTestId("password-input").fill("E2eTest1");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("/home");
    const elapsed = Date.now() - start;
    console.log(`[Perf] Login flow duration: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(THRESHOLDS.loginFlow);
  });

  test("タイムライン初期ロード（tab-all 表示）が 3000ms 未満である", async ({ page }) => {
    await setCookieAndStorage(page, testUser);
    const start = Date.now();
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
    const elapsed = Date.now() - start;
    console.log(`[Perf] Timeline initial load: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(THRESHOLDS.timelineLoad);
  });

  test("タイムラインページの FCP が 2000ms 未満である", async ({ page }) => {
    await setCookieAndStorage(page, testUser);
    await page.goto("/home");
    await page.waitForLoadState("domcontentloaded");
    const fcp = await page.evaluate<number>(() => {
      const entries = performance.getEntriesByType("paint") as PaintEntry[];
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
      return fcpEntry?.startTime ?? -1;
    });
    console.log(`[Perf] Timeline page FCP: ${fcp.toFixed(1)}ms`);
    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(THRESHOLDS.fcp);
  });

  test("投稿作成からタイムライン反映まで 2000ms 未満である", async ({ page }) => {
    await setCookieAndStorage(page, testUser);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');

    const content = `パフォーマンステスト投稿 ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    const start = Date.now();
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: content }).first().waitFor();
    const elapsed = Date.now() - start;
    console.log(`[Perf] Post create to timeline reflect: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(THRESHOLDS.postCreate);
  });
});
