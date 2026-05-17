import { test, expect } from "../fixtures/auth";

test.describe("コメント機能", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const content = `コメントテスト ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: content }).first().waitFor();
    await page.locator('[data-testid="post-card"]').first().getByTestId("comment-toggle").click();
    await page.getByTestId("comment-textarea").first().waitFor();
  });

  test("コメントを追加するとコメント一覧に表示される", async ({ authenticatedPage: page }) => {
    const commentText = `テストコメント ${Date.now()}`;
    await page.getByTestId("comment-textarea").first().fill(commentText);
    await page.getByTestId("comment-submit").first().click();
    await expect(page.locator('[data-testid="comment-item"]').filter({ hasText: commentText }).first()).toBeVisible();
  });

  test("コメント削除ダイアログでOKを押すとコメントが削除される", async ({ authenticatedPage: page }) => {
    const commentText = `削除コメント ${Date.now()}`;
    await page.getByTestId("comment-textarea").first().fill(commentText);
    await page.getByTestId("comment-submit").first().click();
    await page.locator('[data-testid="comment-item"]').filter({ hasText: commentText }).first().waitFor();

    await page.locator('[data-testid="comment-item"]')
      .filter({ hasText: commentText })
      .first()
      .getByTestId("comment-delete")
      .click();
    await page.getByTestId("confirm-ok").click();

    await expect(page.locator('[data-testid="comment-item"]').filter({ hasText: commentText })).toHaveCount(0);
  });

  test("141文字入力するとコメント送信ボタンが disabled になる", async ({ authenticatedPage: page }) => {
    const overLimit = "あ".repeat(141);
    await page.getByTestId("comment-textarea").first().fill(overLimit);
    await expect(page.getByTestId("comment-submit").first()).toBeDisabled();
  });
});
