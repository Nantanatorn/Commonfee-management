const express = require('express');
const router = express.Router();
const qrCodeController = require('../controller/promptpayk');
const { verifyToken } = require('../middleware/auth');

// เส้นทางสำหรับการสร้าง PromptPay QR Code ของบิลตัวเอง (ต้อง login)
router.get('/gpromptpay', verifyToken, qrCodeController.generatePromptPayQrCode);

module.exports = router;
