const qrcode = require('qrcode');
const promptpay = require('promptpay-qr');
const sql = require('mssql');
const config = require('../config');
const { positiveInt } = require('../middleware/validate');

// สร้าง PromptPay QR ของบิลที่ล็อกอินอยู่เป็นเจ้าของ
// - เบอร์รับเงินมาจาก .env (PROMPTPAY_PHONE) ไม่รับจาก client
// - ยอดเงินคำนวณจากบิลในฐานข้อมูล (ค่าส่วนกลาง + ค่าปรับ) ไม่เชื่อยอดที่ client ส่งมา
module.exports.generatePromptPayQrCode = async (req, res) => {
  const payId = positiveInt(req.query.payId);
  if (!payId) {
    return res.status(400).json({ message: 'payId ไม่ถูกต้อง' });
  }

  const phone = String(process.env.PROMPTPAY_PHONE || '').replace(/-/g, '');
  if (!/^0\d{9}$/.test(phone)) {
    console.error('PROMPTPAY_PHONE is missing or invalid in .env');
    return res.status(500).json({ message: 'ระบบยังไม่ได้ตั้งค่าเบอร์ PromptPay สำหรับรับเงิน' });
  }

  try {
    const pool = await sql.connect(config);
    const bill = await pool.request()
      .input('payId', sql.Int, payId)
      .input('userId', sql.Int, req.user.User_ID)
      .query(`SELECT p.Pay_Amount, ISNULL(p.Pay_Fine, 0) AS Pay_Fine, RTRIM(p.Pay_Status) AS Pay_Status
              FROM PayCommonfee p
              JOIN Resident r ON r.R_ID = p.R_ID
              WHERE p.Pay_ID = @payId AND r.User_ID = @userId`);

    if (bill.recordset.length === 0) {
      return res.status(404).json({ message: 'ไม่พบบิลนี้' });
    }
    const { Pay_Amount, Pay_Fine, Pay_Status } = bill.recordset[0];
    if (Pay_Status !== 'Overdue') {
      return res.status(400).json({ message: 'บิลนี้ไม่ได้อยู่ในสถานะค้างชำระ' });
    }

    const amount = Math.round((Number(Pay_Amount) + Number(Pay_Fine)) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });
    }

    // แปลงหมายเลขโทรศัพท์ให้เป็นรูปแบบ 66 สำหรับ PromptPay
    const qrData = promptpay(`66${phone.substring(1)}`, { amount });

    qrcode.toDataURL(qrData, function (err, url) {
      if (err) {
        console.error('Error generating QR Code:', err);
        return res.status(500).json({ message: 'การสร้าง QR Code ล้มเหลว' });
      }
      res.json({ qrCodeUrl: url, payId, amount });
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
};
