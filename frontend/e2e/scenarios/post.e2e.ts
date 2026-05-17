import { test, expect } from "../fixtures/auth";

test.describe("投稿 CRUD", () => {
  test("投稿を作成するとタイムラインに表示される", async ({ authenticatedPage: page }) => {
    const content = `E2Eテスト投稿 ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    await page.getByTestId("post-submit").click();
    await expect(page.locator('[data-testid="post-content"]').filter({ hasText: content }).first()).toBeVisible();
  });

  test("投稿を編集すると変更後のテキストが表示される", async ({ authenticatedPage: page }) => {
    const original = `編集前 ${Date.now()}`;
    const updated = `編集後 ${Date.now()}`;

    await page.getByTestId("post-textarea").fill(original);
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: original }).first().waitFor();

    const card = page.locator('[data-testid="post-card"]').filter({ has: page.locator(`text=${original}`) }).first();
    await card.getByTestId("edit-button").click();
    // Use page-level locator after entering edit mode — the card filter no longer matches
    // once edit-textarea replaces post-content in the DOM
    await page.getByTestId("edit-textarea").fill(updated);
    await page.getByTestId("edit-save").click();

    await expect(page.locator('[data-testid="post-content"]').filter({ hasText: updated }).first()).toBeVisible();
  });

  test("投稿削除ダイアログでOKを押すと投稿が削除される", async ({ authenticatedPage: page }) => {
    const content = `削除テスト ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: content }).first().waitFor();

    const card = page.locator('[data-testid="post-card"]').filter({ has: page.locator(`text=${content}`) }).first();
    await card.getByTestId("delete-button").click();
    await page.getByTestId("confirm-ok").click();

    await expect(page.locator('[data-testid="post-content"]').filter({ hasText: content })).toHaveCount(0);
  });

  test("投稿削除ダイアログでキャンセルを押すと投稿が残る", async ({ authenticatedPage: page }) => {
    const content = `キャンセルテスト ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: content }).first().waitFor();

    const card = page.locator('[data-testid="post-card"]').filter({ has: page.locator(`text=${content}`) }).first();
    await card.getByTestId("delete-button").click();
    await page.getByTestId("confirm-cancel").click();

    await expect(page.locator('[data-testid="post-content"]').filter({ hasText: content }).first()).toBeVisible();
  });

  test("281文字入力すると投稿ボタンが disabled になる", async ({ authenticatedPage: page }) => {
    const overLimit = "あ".repeat(281);
    await page.getByTestId("post-textarea").fill(overLimit);
    await expect(page.getByTestId("post-submit")).toBeDisabled();
    await expect(page.getByTestId("char-remaining")).toHaveText("-1");
  });

  test("テキストが空のとき投稿ボタンが disabled になる", async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId("post-submit")).toBeDisabled();
  });
});
