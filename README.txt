DEEP DEEP SLEEP EDITOR — V195 FAST BOOT

ใช้ไฟล์ทั้ง 5 ตัวเขียนทับชุด V194:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V195 เปลี่ยนระบบ Preview Engine ให้ไม่แตะ iframe ทั้งเว็บตอนเปิดหน้า:
- ไม่มี global HTMLIFrameElement.prototype.srcdoc override
- ไม่มี global iframe setAttribute override
- ไม่มี startup scan / idle scan ของ editor
- ไม่มี MutationObserver ของ Central Preview
- ติดระบบกลางเฉพาะ iframe ใน Editor ที่ผู้ใช้กดเปิด
- เอา MutationObserver ที่เฝ้า class ทั้ง body ของ Commission editor ออก
- Preview editor ยังใช้ DOM patch หลังโหลดครั้งแรก เพื่อลดการกะพริบ
- BBCode preview / toolbar ยังทำงานเมื่อเข้า editor

หลังอัปโหลดให้ Ctrl+F5 หนึ่งครั้ง
