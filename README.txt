DEEP DEEP SLEEP CODE SHOP — V208

แก้เฉพาะระบบ Preview ฝั่งซ้ายของหน้า Edit จาก V207:
- แก้บั๊ก cross-iframe Element detection ที่ทำให้ระบบวัด wrapper แทนตัวโคดจริง
- Fit จาก visual bounds จริง รวมของที่ยื่นซ้าย/ขวา/ด้านบน เช่น badge, star, barcode
- ล็อกกึ่งกลางของพื้นที่ Preview 60% แม้พิมพ์ข้อความ
- ไม่ถอด transform เป็น none ทุก keystroke อีก
- เริ่มจากบนสุดของ visual code และ iframe สูงตาม visual content จริง
- Preview ฝั่งซ้ายเลื่อนแนวตั้งได้ด้วย scrollbar ล่องหน
- RORAIMA / HANS X. FROST ใช้กติกาเดียวกัน
- ไม่แตะ Controls ฝั่งขวา / COPY CODE / Cloud / Draft / routing / BBCode toolbar
