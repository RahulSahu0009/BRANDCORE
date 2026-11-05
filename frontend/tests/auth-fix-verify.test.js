import { test, expect } from '@playwright/test';

test('BRANDCORE auth fix - no brandcore-api template requests', async ({ page }) => {
  test.setTimeout(120000);

  const consoleErrors = [];
  const brandcoreApiRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push('Console: ' + msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('Page: ' + err.message));

  page.on('request', request => {
    if (request.url().includes('/tokens/brandcore-api')) {
      brandcoreApiRequests.push(request.url());
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check no brandcore-api token requests
  const brandcoreCount = brandcoreApiRequests.length;

  // Check backend status is not stuck on Connecting
  const statusText = await page.locator('text=Connecting').count();

  // Check theme is applied
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

  // Check for horizontal overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = 1440;

  console.log('\n=== AUTH FIX VERIFICATION ===');
  console.log(`brandcore-api requests: ${brandcoreCount}`);
  console.log(`Connecting elements: ${statusText}`);
  console.log(`Dark mode: ${isDark}`);
  console.log(`Body width: ${bodyWidth}, Viewport: ${viewportWidth}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('  -', e));
  }

  // Assertions
  expect(brandcoreCount).toBe(0);
  expect(consoleErrors.length).toBe(0);
});
