const express = require("express");
const router = express.Router();
const paymentcon =require('../controller/payments')
const { verifyToken } = require('../middleware/auth');

require('dotenv').config();

    router.get('/paymenthistory', verifyToken, paymentcon.PaymentHistory);
    router.get('/getpaid',paymentcon.getpaidhistory);
    router.get('/getunPaid',paymentcon.getUnpaidhistory);
    router.get('/monthly-payment',paymentcon.getMonthly);
    router.get('/Fee',paymentcon.Fee);
    router.get('/AllFee',paymentcon.GetAllFee);
    router.put('/pay/:payId', verifyToken, paymentcon.Payment);
    router.post('/sendBill',verifyToken,paymentcon.FeeBill);
    router.put('/changerate',paymentcon.ChangePayrate);
    router.get('/getreceipt/:payId',paymentcon.getReceipt);
    router.get('/getincome',paymentcon.GetIncome);
    router.get('/paidhistory',paymentcon.LastPaid);
    




module.exports = router;   