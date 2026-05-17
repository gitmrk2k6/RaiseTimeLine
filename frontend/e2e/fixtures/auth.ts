import { test as base, type Page } from "@playwright/test";
import { registerUser, uniqueSuffix, type TestUser } from "../helpers/api";

const COOKIE_NAME = "raisetimeline_access_token";

export interface AuthFixtures {
  authenticatedPage: Page;
  testUser: TestUser;
}

export async function setCookieAndStorage(
  page: Page,
  user: Pick<TestUser, "accessToken" | "refreshToken" | "userId" | "username">
) {
  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: user.accessToken,
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.addInitScript(
    ({ accessToken, refreshToken, userId, username }) => {
      localStorage.setItem("raisetimeline_access_token", accessToken);
      localStorage.setItem("raisetimeline_refresh_token", refreshToken);
      localStorage.setItem("raisetimeline_user_id", String(userId));
      localStorage.setItem("raisetimeline_username", username);
    },
    {
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      userId: user.userId,
      username: user.username,
    }
  );
}

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const suffix = uniqueSuffix();
    const user = await registerUser(
      `e2e_${suffix}`,
      `e2e_${suffix}@test.invalid`,
      "E2eTest1"
    );
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await setCookieAndStorage(page, testUser);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
    await use(page);
  },
});

export { expect } from "@playwright/test";
