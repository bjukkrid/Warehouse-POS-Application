import { _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { join } from 'path';

test('Update Existing Product Scenario', async () => {
  // 1. (เปิดแอปพลิเคชัน)
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  // 2. (ไปที่หน้า Inventory เพื่อค้นหาสินค้า)
  await window.click('text=Inventory');
  await expect(window.locator('h1', { hasText: 'Inventory' }).first()).toBeVisible();

  // 3. (ตีกรอบสายตาไปที่ตารางเฉพาะแถวที่มีสินค้า "Wireless Mouse Pro")
  const productRow = window.locator('tr').filter({ hasText: 'Wireless Mouse Pro' }).first();
  await expect(productRow).toBeVisible();

  // 4. (กดปุ่ม Edit ขอแถวสินค้านี้)
  await productRow.locator('button', { hasText: 'Edit' }).click();

  // 5. (หน้าจอต้องเปลี่ยนมาที่หน้าแก้ไข "Edit Product" แล้ว)
  await expect(window.locator('h1', { hasText: 'Edit Product' }).first()).toBeVisible();

  // 6. (ทดสอบการอัปเดตราคาจาก 3500 เป็น 3990)
  await window.fill('input[name="basePrice"]', '3990');
  
  // 7. (ทดสอบการอัปเดตจำนวนสต็อกจาก 25 เป็น 50)
  await window.fill('input[name="stock"]', '50');

  // 8. (อัปเดตรูป ลองอัปโหลดซ้ำเพิ่มเข้าไปอีก 1 รูป)
  const imagePath = join(process.cwd(), 'tests/e2e/fixtures/dummy.png');
  await window.setInputFiles('input[type="file"]', imagePath);

  // 9. ถ่ายรูปเก็บไว้
  await window.screenshot({ path: 'tests/e2e/screenshots/edit-product.png' });

  // 10. (กด Save พร้อมดัก popup "Are you sure?")
  window.on('dialog', dialog => dialog.accept());
  await window.click('text=Update Product');

  // 11. (แอปจะต้องพากลับมาหน้า Inventory สมบูรณ์)
  await expect(window.locator('h1', { hasText: 'Inventory' }).first()).toBeVisible();

  // 12. (ทวงสิทธิ์ตรวจสอบความถูกต้องบนกระดาน List สินค้า !!!)
  // ให้เราเข้าไปดูแถวเดิมของ "Wireless Mouse Pro"
  const updatedRow = window.locator('tr').filter({ hasText: 'Wireless Mouse Pro' }).first();
  
  // - ตรวจสอบว่าราคาใหม่ปรับเป็น 3990.00 แล้วใช่ไหม?
  await expect(updatedRow.locator('text=3990.00')).toBeVisible();
  
  // - ตรวจสอบว่าสต๊อกเป็น 50 จริงๆ ใช่ไหม?
  await expect(updatedRow.locator('text=In Stock (50)')).toBeVisible();

  await electronApp.close();
});
