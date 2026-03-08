import { _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { join } from 'path';

test('Add New Product Test (E2E Scenario)', async () => {
  // 1. (เปิดหน้าแอป)
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  // 2. (นำทางไปที่หน้า Inventory ก่อน)
  await window.click('text=Inventory');

  // 3. (กดปุ่มคลิก "Add Product" เพื่อเข้าไปที่หน้าเพิ่มสินค้า)
  await window.click('text=Add Product');

  // ตรวจสอบว่าเข้ามาหน้า Add Product แล้ว
  await expect(window.locator('h1', { hasText: 'Add New Product' })).toBeVisible();

  // 4. (เริ่มกระบวนการกรอกข้อมูลฟอร์ม)
  // 4.1 กรอกชื่อสินค้า 
  await window.fill('input[name="name"]', 'Premium Mechanical Keyboard');
  
  // 4.2 กรอกราคาสินค้า 
  await window.fill('input[name="basePrice"]', '3500');
  
  // 4.3 กรอกจำนวนสต๊อกสินค้า
  await window.fill('input[name="stock"]', '25');

  // 5. (การพิมพ์รหัส SKU จะช้าไป เราจะจำลองการกดปุ่มสายฟ้าเพื่อลัดคิวให้มัน Generate ให้!)
  await window.click('button[title="Auto-generate random SKU"]');

  // ลองตรวจสอบดูว่า SKU ถูกสุ่มสร้างขึ้นมาสำเร็จหรือยัง โดยการเช็คว่าแวลูของอินพุตมันไม่เป็นค่าว่าง
  const skuInputValue = await window.inputValue('input[name="sku"]');
  expect(skuInputValue.length).toBeGreaterThan(0);

  // 6. (จำลองการทำงานของ File Upload โดยการอัปโหลดรูปภาพทดสอบ)
  const imagePath = join(process.cwd(), 'tests/e2e/fixtures/dummy.png');
  // ค้นหา Input ที่มีประเภทเป็น file แล้วทำการยัดไฟล์เข้าไปได้เลย
  await window.setInputFiles('input[type="file"]', imagePath);

  // ตรวจสอบว่ารูปถูกโหลดขึ้นมาโชว์ในกล่อง Preview ของเราผ่าน Base64 เรียบร้อยแล้ว
  await expect(window.locator('img[alt="Preview 0"]')).toBeVisible();

  // 7. ถ่ายรูปหลักฐานตอนกรอกฟอร์มเสร็จสิ้น 📸
  await window.screenshot({ path: 'tests/e2e/screenshots/add-product-filled.png' });

  // 8. (ขั้นตอนสุดท้าย: กดบันทึกข้อมูลสินค้า)
  // ตั้งค่าให้บอทกดปุ่ม "OK" อัตโนมัติเวลาแอปเด้ง Dialog ถามว่า "Are you sure?"
  window.on('dialog', dialog => dialog.accept());
  await window.click('text=Save Product');

  // 9. ตัวระบบจะต้องเด้งพาเรากลับมาหน้าคำว่า "Inventory" อัตโนมัติ (เช็คการเปลี่ยนหน้า)
  await expect(window.locator('h1', { hasText: 'Inventory' }).first()).toBeVisible();

  // 10. สินค้าที่เราเพิ่มต้องแสดงในตารางค้นหาหน้า Inventory (ตรวจสอบว่าบันทึกสำเร็จ)
  await expect(window.locator('text=Premium Mechanical Keyboard').first()).toBeVisible();

  await electronApp.close();
});
