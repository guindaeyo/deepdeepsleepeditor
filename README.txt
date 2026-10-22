DEEP DEEP SLEEP EDITOR — V186 STEADY PREVIEW
============================================

ใช้ไฟล์ในโฟลเดอร์นี้ทั้งชุดแทนชุด V185 เดิม:

1. index.html
2. style.css
3. script.js
4. cloud-config.js
5. cloud-bridge.js

สิ่งที่เปลี่ยนจาก V185:
- แก้อาการพรีวิวฝั่งซ้ายในหน้า Editor กะพริบตอนพิมพ์/แก้ค่า
- พรีวิวที่โหลดแล้วจะพยายาม patch DOM เดิมแทนการ reload iframe srcdoc ทุกครั้ง
- ปิด opacity fade/loading effect เฉพาะ iframe พรีวิวในหน้า Editor
- การ์ดพรีวิวหน้ารวมยังใช้ loading effect เดิม
- ระบบ BBCode และ Cloud จาก V185 คงเดิม

วิธีลง:
- สำรองชุดเดิมไว้ก่อน
- เอา 5 ไฟล์หลักจาก ZIP นี้เขียนทับไฟล์เดิม
- อย่าโหลด script V185/V184 ซ้ำอีกไฟล์พร้อม script.js นี้
- จากนั้นกด Ctrl + F5
