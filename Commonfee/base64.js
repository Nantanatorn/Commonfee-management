const fs = require('fs');

// ฟังก์ชันสำหรับแปลงฟอนต์ .ttf เป็น Base64
function convertFontToBase64(fontPath) {
  try {
    // อ่านฟอนต์ .ttf เป็น binary
    const font = fs.readFileSync(fontPath);

    // แปลงฟอนต์เป็น Base64
    const fontBase64 = font.toString('base64');

    // พิมพ์ผลลัพธ์ที่เป็น Base64
    console.log('data:font/ttf;base64,' + fontBase64);
  } catch (err) {
    console.error('Error reading or converting font:', err);
  }
}

// ระบุที่อยู่ของไฟล์ฟอนต์ .ttf
const fontPath = 'THSarabunNew.ttf';  // ใส่ที่อยู่ไฟล์ฟอนต์ที่ต้องการแปลง

// เรียกใช้งานฟังก์ชันแปลงฟอนต์
convertFontToBase64(fontPath);
