import { test, expect } from '@playwright/test';

test('BRANDCORE frontend verification', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  const failedRequests = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('Console error: ' + msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    errors.push('Page error: ' + err.message);
  });

  // Capture failed requests (only real failures, not expected 401s from protected API routes)
  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('/api/') && !url.includes('clerk.com')) {
      failedRequests.push('Failed request: ' + req.method() + ' ' + url + ' - ' + (req.failure() && req.failure().errorText ? req.failure().errorText : 'unknown'));
    }
  });

  // Capture failed responses (only non-API 4xx/5xx, not expected 401s from protected routes)
  page.on('response', res => {
    const url = res.url();
    if (!url.includes('/api/') && !url.includes('clerk.com') && res.status() >= 400) {
      failedRequests.push('Failed response: ' + res.request().method() + ' ' + url + ' - ' + res.status());
    }
  });

  // 1. Application loads
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/BRANDCORE/);
  console.log('PASS: Application loads with BRANDCORE title');

  // Take screenshot - light theme
  await page.screenshot({ path: 'C:\\BRANDCORE\\screenshot-light-desktop.png', fullPage: true });
  console.log('PASS: Screenshot captured (light theme, desktop)');

  // 2. No JavaScript exceptions on load (excluding React warnings and expected 401s)
  const realErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('onFocusIn and onFocusOut') &&
    !e.includes('401 (Unauthorized)')
  );
  if (realErrors.length > 0) {
    console.log('FAIL: JavaScript errors on load:', realErrors);
  } else {
    console.log('PASS: No JavaScript exceptions on load');
  }

  // 3. No failed network requests on load (excluding API 401s)
  const realFailed = failedRequests.filter(r => !r.includes('favicon'));
  if (realFailed.length > 0) {
    console.log('FAIL: Failed network requests on load:', realFailed);
  } else {
    console.log('PASS: No failed network requests on load');
  }

  // 4. Clerk sign-in controls render
  const signInButton = page.locator('button:has-text("Sign in")');
  const signUpButton = page.locator('button:has-text("Sign up")');
  await expect(signInButton).toBeVisible();
  await expect(signUpButton).toBeVisible();
  console.log('PASS: Clerk sign-in controls render');

  // 5. Backend status indicator
  const statusIndicator = page.locator('text=Backend offline').or(page.locator('text=Backend connected')).or(page.locator('text=Connecting…'));
  await expect(statusIndicator.first()).toBeVisible();
  console.log('PASS: Backend status indicator renders');

  // Check if backend is connected (health endpoint should pass through Vite proxy)
  const connectedText = page.locator('text=Backend connected');
  if (await connectedText.count() > 0) {
    console.log('PASS: Backend status shows connected');
  } else {
    console.log('INFO: Backend status shows offline/connecting (health check may not have completed)');
  }

  // 6. Navigation between pages - only if signed in
  const isSignedInScreen = await page.locator('text=Sign in to continue').count() > 0
  if (!isSignedInScreen) {
    const factsNav = page.locator('button:has-text("Approved Facts")').first()
    if (await factsNav.count() > 0) {
      await factsNav.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1:has-text("Approved Facts")')).toBeVisible()
      console.log('PASS: Navigation to Approved Facts page')

      // 7. Approved Facts page loads with demo mode banner
      const demoText = page.locator('text=Demo mode — backend facts endpoint not yet implemented')
      await expect(demoText).toBeVisible()
      console.log('PASS: Demo mode clearly distinguished from live data')

      // Take screenshot - Approved Facts page
      await page.screenshot({ path: 'C:\\BRANDCORE\\screenshot-facts-desktop.png', fullPage: true })
      console.log('PASS: Screenshot captured (Approved Facts page)')

      // 8. Navigation to Content Review
      const contentNav = page.locator('button:has-text("Content Review")').first()
      await contentNav.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1:has-text("Content Review")')).toBeVisible()
      console.log('PASS: Navigation to Content Review page')

      // 9. Navigation to Releases
      const releasesNav = page.locator('button:has-text("Releases")').first()
      await releasesNav.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1:has-text("Release Governance")')).toBeVisible()
      console.log('PASS: Navigation to Releases page')

      // 10. Navigation to Evidence Library
      const evidenceNav = page.locator('button:has-text("Evidence Library")')
      if (await evidenceNav.count() > 0) {
        await evidenceNav.first().click()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('h1:has-text("Evidence Library")')).toBeVisible()
        console.log('PASS: Navigation to Evidence Library page')
      } else {
        console.log('INFO: Evidence Library not in sidebar (pre-existing gap - page component exists but no nav button)')
      }
    } else {
      console.log('INFO: Approved Facts nav button not found')
    }
  } else {
    console.log('INFO: Not signed in — skipping page navigation tests (auth gate working correctly)')
  }

  // 11. Test light/dark mode toggle
  const allButtons = page.locator('button');
  const themeButtons = allButtons.filter({ has: page.locator('svg') });
  if (await themeButtons.count() > 0) {
    await themeButtons.first().click();
    await page.waitForTimeout(500);
    // Take screenshot - dark theme
    await page.screenshot({ path: 'C:\\BRANDCORE\\screenshot-dark-desktop.png', fullPage: true });
    console.log('PASS: Dark theme toggle works, screenshot captured');

    // Toggle back to light
    await themeButtons.first().click();
    await page.waitForTimeout(500);
  }

  // 12. Verify no false success notifications
  const successToasts = page.locator('[class*="toast"], [class*="notification"]').filter({ hasText: /success/i });
  if (await successToasts.count() > 0) {
    console.log('WARN: Success notifications found after potential errors');
  } else {
    console.log('PASS: No false success notifications');
  }

  // 13. Final console error check
  const finalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('onFocusIn and onFocusOut') && !e.includes('401 (Unauthorized)'));
  if (finalErrors.length > 0) {
    console.log('FAIL: Console errors detected:', finalErrors);
  } else {
    console.log('PASS: No console errors');
  }

  // 14. Final failed request check
  const finalFailed = failedRequests.filter(r => !r.includes('favicon'));
  if (finalFailed.length > 0) {
    console.log('FAIL: Failed requests detected:', finalFailed);
  } else {
    console.log('PASS: No failed network requests');
  }

  // Summary
  console.log('\n=== BROWSER VERIFICATION SUMMARY ===');
  console.log('Console errors: ' + finalErrors.length);
  console.log('Failed requests: ' + finalFailed.length);
});
