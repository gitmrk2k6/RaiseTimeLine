import { test, expect } from "../fixtures/auth";

test.describe("いいね機能", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const content = `いいねテスト ${Date.now()}`;
    await page.getByTestId("post-textarea").fill(content);
    await page.getByTestId("post-submit").click();
    await page.locator('[data-testid="post-content"]').filter({ hasText: content }).first().waitFor();
  });

  test("いいねするとカウントが1増加しハートが赤くなる", async ({ authenticatedPage: page }) => {
    const card = page.locator('[data-testid="post-card"]').first();
    const likeCount = card.getByTestId("like-count");
    const likeButton = card.getByTestId("like-button");

    const before = parseInt(await likeCount.innerText(), 10);
    await likeButton.click();
    await expect(likeCount).toHaveText(String(before + 1));
    await expect(likeButton).toHaveClass(/text-red-500/);
  });

  test("いいね済みの投稿を再タップするとカウントが1減少しハートが元に戻る", async ({ authenticatedPage: page }) => {
    const card = page.locator('[data-testid="post-card"]').first();
    const likeCount = card.getByTestId("like-count");
    const likeButton = card.getByTestId("like-button");

    await likeButton.click();
    const afterLike = parseInt(await likeCount.innerText(), 10);
    await likeButton.click();
    await expect(likeCount).toHaveText(String(afterLike - 1));
    await expect(likeButton).not.toHaveClass(/text-red-500/);
  });
});
