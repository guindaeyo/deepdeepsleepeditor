DEEP DEEP SLEEP CODE SHOP — V202

ฐาน: V200 (เพื่อคง routing / COPY CODE / controls / draft / cloud ครบ)

V202 แก้เฉพาะระบบ Preview ฝั่งซ้ายของหน้า Edit:
- 60% Preview / 40% Controls
- โค้ด Preview อยู่กึ่งกลางแนวนอน
- Fit แนวกว้างครั้งเดียว
- โค้ดยาวเลื่อนขึ้นลงใน iframe ได้
- scrollbar ฝั่งซ้ายล่องหนทุกชั้น
- ฝั่งขวายัง scroll และเห็น scrollbar ตามปกติ
- หลัง iframe โหลดครั้งแรก การพิมพ์ใช้ DOM morph เท่านั้น ไม่ reload
- ปิดสิทธิ์ legacy v161/v165 ไม่ให้ re-zoom/re-transform ตอนพิมพ์
- ไม่ลบ route, COPY CODE, VIEW WORK หรือ utility block ของ editor
