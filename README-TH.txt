อัปโหลด index.html, style.css และ script.js ทับไฟล์เดิมใน GitHub ทั้ง 3 ไฟล์

สาเหตุที่ข้อความหาย:
ตัวเลือก RESET ถูกต่อท้าย selector ที่มี comma ผิดรูปแบบ ทำให้ panel ของ ROLEPLAY และ PROFILE ทั้ง panel ถูกผูกเป็นปุ่ม RESET เมื่อคลิกช่องใด ๆ ข้อมูลจึงถูกล้างทุกครั้ง ส่วน REVIEW ไม่โดนเพราะอยู่ selector ตัวสุดท้าย

ชุดนี้แก้โดย:
- ผูก RESET จากภายในแต่ละ panel เท่านั้น
- หน้า editor เปิดครั้งแรกเป็นช่องว่าง
- คลิกช่องอื่นแล้วข้อความไม่หาย
- กลับช่องเดิมแล้วพิมพ์ต่อได้
- ออกจาก editor แล้วกลับมา ข้อมูลยังค้าง
- ล้างเฉพาะเมื่อกด RESET
- ไม่มี fetch / Blob / eval / dynamic JavaScript loader

หลัง Vercel Deploy เสร็จ กด Ctrl + F5 หนึ่งครั้ง
