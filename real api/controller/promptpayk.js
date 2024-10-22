const qrcode = require('qrcode');
const promptpay = require('promptpay-qr');

module.exports.generatePromptPayQrCode = async (req, res) => {
  const { phoneNumber, amount, payId } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'กรุณาระบุหมายเลขโทรศัพท์' });
  }

  try {
    // ล้างหมายเลขโทรศัพท์
    const sanitizedPhoneNumber = phoneNumber.replace(/-/g, '');
    if (!/^0\d{9}$/.test(sanitizedPhoneNumber)) {
      return res.status(400).json({ message: 'หมายเลขโทรศัพท์ไม่ถูกต้อง' });
    }

    // แปลงหมายเลขโทรศัพท์ให้เป็นรูปแบบ +66 สำหรับ PromptPay
    const formattedPhoneNumber = `66${sanitizedPhoneNumber.substring(1)}`;

    // สร้างข้อมูล QR PromptPay โดยใช้ promptpay-qr
    const qrData = promptpay(formattedPhoneNumber, { amount: parseFloat(amount) });

    // สร้าง QR Code จากข้อมูลที่ได้
    qrcode.toDataURL(qrData, function (err, url) {
      if (err) {
        console.error('Error generating QR Code:', err);
        return res.status(500).json({ message: 'การสร้าง QR Code ล้มเหลว', error: err });
      }

      // คุณสามารถเก็บ payId และข้อมูลอื่นๆ ในระบบ backend ของคุณ ณ จุดนี้
      // เพื่อเชื่อมโยงการชำระเงินกับรายการในฐานข้อมูล
      res.json({ qrCodeUrl: url, payId: payId || 'defaultPayId' });
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', error: error.message });
  }
};
