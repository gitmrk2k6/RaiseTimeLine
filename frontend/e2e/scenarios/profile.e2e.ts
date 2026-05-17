import { test, expect } from "../fixtures/auth";
import { registerUser, uniqueSuffix } from "../helpers/api";

test.describe("プロフィール表示", () => {
  test("自分のプロフィールにユーザー名と「プロフィールを編集」リンクが表示される", async ({
    authenticatedPage: page,
    testUser,
  }) => {
    await page.goto(`/profile/${testUser.userId}`);
    await expect(page.getByTestId("profile-username")).toHaveText(testUser.username);
    await expect(page.getByRole("link", { name: "プロフィールを編集" })).toBeVisible();
  });

  test("他ユーザーのプロフィールに「フォローする」ボタンが表示される", async ({
    authenticatedPage: page,
  }) => {
    const suffix = uniqueSuffix();
    const otherUser = await registerUser(`e2e_other_${suffix}`, `e2e_other_${suffix}@test.invalid`, "E2eTest1");
    await page.goto(`/profile/${otherUser.userId}`);
    await expect(page.getByTestId("follow-toggle")).toBeVisible();
    await expect(page.getByTestId("follow-toggle")).toHaveText("フォローする");
  });

  test("プロフィールにフォロー数とフォロワー数が表示される", async ({
    authenticatedPage: page,
    testUser,
  }) => {
    await page.goto(`/profile/${testUser.userId}`);
    await expect(page.getByTestId("following-count")).toBeVisible();
    await expect(page.getByTestId("follower-count")).toBeVisible();
  });

  test("他ユーザープロフィールでフォローするとボタンが「フォロー中」に変化する", async ({
    authenticatedPage: page,
  }) => {
    const suffix = uniqueSuffix();
    const otherUser = await registerUser(`e2e_follow_${suffix}`, `e2e_follow_${suffix}@test.invalid`, "E2eTest1");
    await page.goto(`/profile/${otherUser.userId}`);
    await page.getByTestId("follow-toggle").click();
    await expect(page.getByTestId("follow-toggle")).toHaveText("フォロー中");
  });
});
