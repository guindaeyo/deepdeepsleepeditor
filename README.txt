DEEP DEEP SLEEP CODE SHOP — V200

ฐาน: V198 (ก่อน V199 ที่ลบฟังก์ชัน Editor เกินไป)

V200 แก้เฉพาะระบบพรีวิวฝั่งซ้ายให้เป็น Central Engine พร้อมคืนความสามารถเดิมของ Editor:
- ทุกโคดกดเข้า Edit ได้ตามระบบเดิม
- COPY CODE / RESET / Draft / Cloud คงเดิม
- Layout desktop: Preview 60% / Controls 40%
- สองฝั่งสูงเท่ากัน ขอบล่างเสมอกัน
- ซ่อน scrollbar เฉพาะฝั่ง Preview
- ฝั่ง Controls ยังเลื่อนลงได้และเห็น scrollbar
- Preview โหลดจริงครั้งแรกครั้งเดียว หลังจากนั้น typing ใช้ DOM morph ไม่ reload iframe
- ดักทั้ง iframe.srcdoc และ setAttribute("srcdoc", ...) เฉพาะ iframe ใน Editor
- ไม่ resize / rescale / zoom ใหม่ทุก keystroke
- BBCode แสดงผลใน preview

ติดตั้ง: เขียนทับ index.html, style.css, script.js, cloud-config.js, cloud-bridge.js แล้ว Ctrl+F5
