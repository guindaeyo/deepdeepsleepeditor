DEEP DEEP SLEEP EDITOR — V192 CENTRAL PREVIEW

ใช้ไฟล์ทั้งหมดในโฟลเดอร์นี้แทนชุดเดิม:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V192
- ลบข้อความ target ใต้ BBCode toolbar เช่น onCloudRoleplayEditor / dds-bbcode-target-1
- ทุก EDIT page ใช้ Central Preview Engine เดียวกัน
- legacy resize ของแต่ละโคดยอมให้ระบบกลางจัดการในหน้า EDIT
- ไม่ reload iframe ระหว่างพิมพ์ และ batch การ morph ต่อ animation frame
- ความกว้างล็อกนิ่งและ fit ให้เห็นครบในหน้าเดียว ไม่มี horizontal scroll
- ความสูงวัดจาก scrollHeight จริง จึงเลื่อนลงเห็นท้ายโคดยาวได้ครบ
- scrollbar ซ่อน แต่ยังเลื่อนขึ้นลงได้
- BBCode แสดงผลใน preview

หลังอัปโหลดให้ Ctrl + F5 หนึ่งครั้ง
