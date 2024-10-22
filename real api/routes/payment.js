const express = require("express");
const router = express.Router();
const paymentcon =require('../controller/payments')
const { verifyToken } = require('../middleware/auth');

require('dotenv').config();

    router.get('/paymenthistory', verifyToken, paymentcon.PaymentHistory);
    router.get('/getpaid',paymentcon.getpaidhistory);
    router.get('/getunPaid',paymentcon.getUnpaidhistory);
    router.put('/pay/:payId', verifyToken, paymentcon.Payment);
    router.post('/sendBill',verifyToken,paymentcon.FeeBill);




module.exports = router;   