DEEP DEEP SLEEP EDITOR — V185 BBCode FIX
===============================================

ใช้ไฟล์ในโฟลเดอร์นี้ทั้งชุด:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

วิธีลง:
1) สำรองไฟล์ชุดเดิมไว้ก่อน
2) อัปโหลด/เขียนทับ 5 ไฟล์ด้านบนด้วยไฟล์จาก ZIP นี้
3) ไม่ต้องเพิ่ม script V184/V185 แยกอีกตัว
4) อย่าโหลด script.js เก่าสองไฟล์พร้อมกัน
5) รีเฟรชแบบล้างแคช (Ctrl+F5)

สิ่งที่แก้ใน V185:
- ปุ่ม BBCode ที่เคยเป็นช่องว่างให้แสดงไอคอน/ข้อความได้
- รองรับ toolbar ที่ใช้ data-bbcode หลายชุด รวมถึง food/history/hans/jewel/code013/code014
- Live Preview ฝั่งซ้ายของ Editor แปลง BBCode เช่น [b][i]รักรัก[/i][/b] เป็นผลลัพธ์จริง
- ครอบทั้ง queue preview, fast DOM patch และ direct iframe.srcdoc
- คง cloud-config / cloud-bridge เดิม
- แก้ preload ddsh-chocolate-love.css ให้ชี้ไฟล์ออนไลน์แทน local file ที่ไม่ได้อยู่ในชุด

หมายเหตุ:
- index.html ยังโหลด core script จาก CDN ตามโครงสร้างเดิม กรุณาอย่าลบ
- ไฟล์ CSS/รูป/ฟอนต์อื่นที่เป็น URL ออนไลน์ยังใช้จาก URL เดิม
