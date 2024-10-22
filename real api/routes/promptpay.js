const express = require('express');
const router = express.Router();
const qrCodeController = require('../controller/promptpayk');

// เส้นทางสำหรับการสร้าง PromptPay QR Code
router.get('/gpromptpay', qrCodeController.generatePromptPayQrCode);

module.exports = router;