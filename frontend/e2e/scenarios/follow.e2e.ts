import { test, expect } from "@playwright/test";
import { registerUser, createPost, uniqueSuffix } from "../helpers/api";
import { setCookieAndStorage } from "../fixtures/auth";

test.describe("フォロー・ユーザー検索", () => {
  let userA: { userId: number; username: string; email: string; accessToken: string; refreshToken: string };
  let userB: { userId: number; username: string; email: string; accessToken: string; refreshToken: string };

  test.beforeAll(async () => {
    const suffix = uniqueSuffix();
    userA = await registerUser(`e2e_a_${suffix}`, `e2e_a_${suffix}@test.invalid`, "E2eTest1");
    userB = await registerUser(`e2e_b_${suffix}`, `e2e_b_${suffix}@test.invalid`, "E2eTest1");
    await createPost(`ユーザーBの投稿 ${suffix}`, userB.accessToken);
  });

  async function loginAs(
    page: import("@playwright/test").Page,
    user: typeof userA
  ) {
    await setCookieAndStorage(page, user);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
  }

  test("ユーザー名検索でユーザーBが見つかる", async ({ page }) => {
    await loginAs(page, userA);
    await page.getByRole("button", { name: "ユーザーを検索" }).click();
    await page.getByTestId("search-input").fill(userB.username);
    await page.getByTestId("search-submit").click();
    await expect(page.locator('[data-testid="search-result-item"]').filter({ hasText: userB.username }).first()).toBeVisible();
  });

  test("検索結果からフォローするとボタンが「フォロー中」に変化する", async ({ page }) => {
    await loginAs(page, userA);
    await page.getByRole("button", { name: "ユーザーを検索" }).click();
    await page.getByTestId("search-input").fill(userB.username);
    await page.getByTestId("search-submit").click();
    const resultItem = page.locator('[data-testid="search-result-item"]').filter({ hasText: userB.username }).first();
    await resultItem.getByTestId("follow-button").click();
    await expect(resultItem.getByTestId("follow-button")).toHaveText("フォロー中");
  });

  test("フォロー後にフォロー中タブでユーザーBの投稿が表示される", async ({ page }) => {
    await loginAs(page, userA);
    await page.getByRole("button", { name: "ユーザーを検索" }).click();
    await page.getByTestId("search-input").fill(userB.username);
    await page.getByTestId("search-submit").click();
    const resultItem = page.locator('[data-testid="search-result-item"]').filter({ hasText: userB.username }).first();
    const followBtn = resultItem.getByTestId("follow-button");
    if ((await followBtn.innerText()).includes("フォローする")) {
      await followBtn.click();
      await expect(followBtn).toHaveText("フォロー中");
    }

    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
    await page.getByTestId("tab-following").click();
    await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible();
  });

  test("アンフォローするとボタンが「フォローする」に変化する", async ({ page }) => {
    await loginAs(page, userA);
    await page.getByRole("button", { name: "ユーザーを検索" }).click();
    await page.getByTestId("search-input").fill(userB.username);
    await page.getByTestId("search-submit").click();
    const resultItem = page.locator('[data-testid="search-result-item"]').filter({ hasText: userB.username }).first();
    const followBtn = resultItem.getByTestId("follow-button");

    if ((await followBtn.innerText()).includes("フォローする")) {
      await followBtn.click();
      await expect(followBtn).toHaveText("フォロー中");
    }
    await followBtn.click();
    await expect(followBtn).toHaveText("フォローする");
  });
});
