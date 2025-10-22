import { test, expect } from "@playwright/test";

test.describe("Wiki Application", () => {
  test("should display homepage and browse articles as anonymous user", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Wiki" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("should sign up, create article, edit article, and view article", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = "password123";

    await page.goto("/");

    await page.getByRole("link", { name: "Sign Up" }).click();
    await expect(page).toHaveURL("/signup");

    await page.getByLabel("Name").fill(testName);
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: "Sign Up" }).click();

    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.getByText(testName)).toBeVisible();

    await page.getByRole("link", { name: "Create Article" }).click();
    await expect(page).toHaveURL("/article/new");

    const articleTitle = `Test Article ${timestamp}`;
    const articleContent = `# Hello World

This is a **test article** with _markdown_ support.

- Item 1
- Item 2
- Item 3`;

    await page.getByLabel("Title").fill(articleTitle);
    await page.getByLabel("Content (Markdown supported)").fill(articleContent);
    await page.getByRole("button", { name: "Create Article" }).click();

    await page.waitForURL(/\/article\/\d+/, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: articleTitle })
    ).toBeVisible();
    await expect(page.getByText("Hello World")).toBeVisible();
    await expect(page.getByText("test article")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/article\/\d+\/edit/);

    const updatedContent = `${articleContent}\n\n## Updated Section\n\nThis article has been updated!`;
    await page.getByLabel("Content (Markdown supported)").clear();
    await page.getByLabel("Content (Markdown supported)").fill(updatedContent);
    await page.getByRole("button", { name: "Update Article" }).click();

    await page.waitForURL(/\/article\/\d+$/, { timeout: 10000 });
    await expect(page.getByText("Updated Section")).toBeVisible();
    await expect(
      page.getByText("This article has been updated!")
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: articleTitle })).toBeVisible();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("should not allow editing others' articles", async ({
    page,
    context,
  }) => {
    const timestamp = Date.now();
    const user1Email = `user1-${timestamp}@example.com`;
    const user2Email = `user2-${timestamp}@example.com`;
    const password = "password123";

    await page.goto("/signup");
    await page.getByLabel("Name").fill("User One");
    await page.getByLabel("Email").fill(user1Email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.getByRole("link", { name: "Create Article" }).click();
    const articleTitle = `Protected Article ${timestamp}`;
    await page.getByLabel("Title").fill(articleTitle);
    await page
      .getByLabel("Content (Markdown supported)")
      .fill("This is a protected article.");
    await page.getByRole("button", { name: "Create Article" }).click();
    await page.waitForURL(/\/article\/\d+/, { timeout: 10000 });

    const articleUrl = page.url();
    const articleId = articleUrl.match(/\/article\/(\d+)/)?.[1];

    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForTimeout(1000);

    await page.goto("/signup");
    await page.getByLabel("Name").fill("User Two");
    await page.getByLabel("Email").fill(user2Email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto(`/article/${articleId}`);
    await expect(
      page.getByRole("heading", { name: articleTitle })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit" })).not.toBeVisible();

    await page.goto(`/article/${articleId}/edit`);
    await expect(page).toHaveURL(`/article/${articleId}`);
  });

  test("should require login to create article", async ({ page }) => {
    await page.goto("/article/new");
    await expect(page).toHaveURL("/login");
  });
});
