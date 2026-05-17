import { test, expect } from "@playwright/test";
import { registerUser, uniqueSuffix } from "../helpers/api";
import { setCookieAndStorage } from "../fixtures/auth";

test.describe("認証フロー", () => {
  test("新規ユーザー登録後に /home へリダイレクトされる", async ({ page }) => {
    const suffix = uniqueSuffix();
    await page.goto("/register");
    await page.getByTestId("username-input").fill(`e2e_${suffix}`);
    await page.getByTestId("email-input").fill(`e2e_${suffix}@test.invalid`);
    await page.getByTestId("password-input").fill("E2eTest1");
    await page.getByTestId("register-submit").click();
    await expect(page).toHaveURL("/home");
  });

  test("ログイン成功後に /home へリダイレクトされる", async ({ page }) => {
    const suffix = uniqueSuffix();
    await registerUser(`e2e_${suffix}`, `e2e_${suffix}@test.invalid`, "E2eTest1");
    await page.goto("/login");
    await page.getByTestId("email-input").fill(`e2e_${suffix}@test.invalid`);
    await page.getByTestId("password-input").fill("E2eTest1");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL("/home");
  });

  test("空のメールアドレスでクライアントバリデーションエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("password-input").fill("somepassword");
    // HTML5 type="email" では空値はバリデーション通過するため noValidate で Zod バリデーションを走らせる
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("無効なメールアドレス形式でクライアントバリデーションエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill("notanemail");
    await page.getByTestId("password-input").fill("somepassword");
    // HTML5 constraint validation を無効化して Zod バリデーションを通す
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("メールアドレスの形式が正しくありません")).toBeVisible();
  });

  test("誤ったパスワードでサーバーエラーメッセージが表示される", async ({ page }) => {
    const suffix = uniqueSuffix();
    await registerUser(`e2e_${suffix}`, `e2e_${suffix}@test.invalid`, "E2eTest1");
    await page.goto("/login");
    await page.getByTestId("email-input").fill(`e2e_${suffix}@test.invalid`);
    await page.getByTestId("password-input").fill("WrongPass1");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("server-error")).toBeVisible();
  });

  test("ログアウト後に /login へリダイレクトされる", async ({ page }) => {
    const suffix = uniqueSuffix();
    const user = await registerUser(`e2e_${suffix}`, `e2e_${suffix}@test.invalid`, "E2eTest1");
    await setCookieAndStorage(page, user);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL("/login");
  });

  test("7文字パスワードでバリデーションエラーが表示される", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("username-input").fill("testuser");
    await page.getByTestId("email-input").fill("test@test.invalid");
    await page.getByTestId("password-input").fill("Abc123x");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("パスワードは8文字以上で入力してください")).toBeVisible();
  });

  test("英字のみのパスワードでバリデーションエラーが表示される", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("username-input").fill("testuser");
    await page.getByTestId("email-input").fill("test@test.invalid");
    await page.getByTestId("password-input").fill("onlyalpha");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("パスワードは英字と数字を両方含む必要があります")).toBeVisible();
  });
});
