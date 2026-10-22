DEEP DEEP SLEEP CODE SHOP — V189 FAST BOOT

ใช้ไฟล์ทั้ง 5 ตัวนี้เขียนทับ V188:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V189 แก้หน้าเว็บโหลดช้าโดย:
- ไม่สแกนทั้งหน้าเว็บซ้ำทุกครั้งที่พิมพ์
- MutationObserver เฝ้าเฉพาะ node ที่เพิ่มใหม่ ไม่เฝ้า class ทั้งเว็บ
- BBCode toolbar ถูกติดตั้งตอนเปิด/สร้าง editor หรือ focus ช่องที่เกี่ยวข้อง
- preview card เปลี่ยนจาก eager เป็น lazy
- ยกเลิก preload CSS/รูปของ editor ที่ยังไม่ได้เปิด
- ลด fetch priority ของ card previews

ระบบ steady preview / BBCode / Cloud Save จาก V188 ยังคงอยู่
หลังอัปโหลดให้กด Ctrl + F5 หนึ่งครั้ง
