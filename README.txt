DEEP DEEP SLEEP CODE SHOP — V194 FAST BOOT

ใช้ไฟล์ทั้ง 5 ตัวนี้เขียนทับชุด V193 เดิม:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V194 เปลี่ยนเฉพาะ startup ของ Central Preview Engine:
- ไม่สแกน iframe/input/textarea/toolbar ทั้งเว็บตอนเปิดหน้า
- ไม่มี MutationObserver เฝ้า subtree ทั้ง .dds-main
- ค่อยติดตั้ง preview/BBCode เฉพาะ editor ที่ผู้ใช้เปิดหรือช่องที่ผู้ใช้โฟกัส
- ระบบพรีวิวไม่กะพริบ, BBCode preview, Cloud Save และ Draft ยังคงเดิม

หลังอัปโหลดให้ Ctrl+F5 หนึ่งครั้ง
