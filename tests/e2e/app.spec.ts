import { _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { join } from 'path';

test('Electron App Launch & Navigation Test', async () => {
  // 1. Launch Electron App (similar to how 'npm start' does it)
  // We use the current directory '.' as the main script location
  const electronApp = await electron.launch({
    args: ['.'],
  });

  // 2. Wait for the first window to render
  const window = await electronApp.firstWindow();

  // 3. Verify that the app title 'LocalPOS' is visible on the sidebar
  await expect(window.locator('text=LocalPOS').first()).toBeVisible();

  // 4. Test Navigation: Click the 'Inventory' menu item
  await window.click('text=Inventory');

  // 5. Verify we are on Inventory page by checking for the 'Add Product' button
  await expect(window.locator('text=Add Product')).toBeVisible();
  
  // 6. Navigate to 'Employees' page
  await window.click('text=Employees');
  
  // 7. Verify we are on Employees page (usually there is an Add Employee button)
  await expect(window.locator('text=Add Employee')).toBeVisible();

  // 8. Take a screenshot to prove the test reached this point (Saved in test-results)
  await window.screenshot({ path: 'tests/e2e/screenshots/employees.png' });

  // 9. Close the app gracefully
  await electronApp.close();
});
