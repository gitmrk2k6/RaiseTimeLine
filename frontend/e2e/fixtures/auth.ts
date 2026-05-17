import { test as base, type Page } from "@playwright/test";
import { registerUser, uniqueSuffix, type TestUser } from "../helpers/api";

export interface AuthFixtures {
  authenticatedPage: Page;
  testUser: TestUser;
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
    await page.goto("/login");
    await page.evaluate(
      ({ accessToken, refreshToken, userId, username }) => {
        localStorage.setItem("raisetimeline_access_token", accessToken);
        localStorage.setItem("raisetimeline_refresh_token", refreshToken);
        localStorage.setItem("raisetimeline_user_id", String(userId));
        localStorage.setItem("raisetimeline_username", username);
      },
      {
        accessToken: testUser.accessToken,
        refreshToken: testUser.refreshToken,
        userId: testUser.userId,
        username: testUser.username,
      }
    );
    await page.goto("/home");
    await page.waitForSelector('[data-testid="tab-all"]');
    await use(page);
  },
});

export { expect } from "@playwright/test";
