DEEP DEEP SLEEP CODE SHOP — V190 GLOBAL EDITOR PREVIEW

ใช้ไฟล์ทั้ง 5 ตัวนี้เขียนทับ V189:
- index.html
- style.css
- script.js
- cloud-config.js
- cloud-bridge.js

V190 แก้ระบบพรีวิวหน้า EDIT ทั้งเว็บ:
- ทุก editor และ protected commission editor ใช้กติกาพรีวิวเดียวกัน
- หลังพรีวิวโหลดครั้งแรก การพิมพ์จะอัปเดต DOM เดิม ไม่ reload srcdoc ใหม่
- ปิด fade/opacity/animation ของพรีวิวทั้งหมดในหน้า EDIT
- ยกเลิก transform/scale/translate ของ iframe ที่ renderer เก่าใส่ซ้ำจนพรีวิวเพี้ยน
- พรีวิวฝั่งซ้ายเป็น viewport คงที่
- โคดยาวหรือกว้างเกินกรอบให้เลื่อน scrollbar ภายในพรีวิวแทนการย่อจนเละ
- บังคับ scrolling=auto ให้ iframe พรีวิวใน editor
- เก็บ V189 Fast Boot, BBCode, Draft และ Cloud Save เดิมไว้

วิธีลง:
1. สำรองโฟลเดอร์ปัจจุบันไว้ก่อน
2. เอา 5 ไฟล์หลักจาก ZIP นี้เขียนทับ V189
3. กด Ctrl + F5 หนึ่งครั้ง

ไม่ต้องโหลด script V189/V188/V187 ซ้อนกัน ให้ใช้ script.js ในชุดนี้ตัวเดียว
