const express = require("express");
const router = express.Router();
const paymentcon = require('../controller/payments');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { handleSlipUpload } = require('../middleware/upload');

// ลูกบ้าน (ต้อง login)
router.get('/paymenthistory', verifyToken, paymentcon.PaymentHistory);
router.get('/searchpayment', verifyToken, paymentcon.SearchPaymentHistory);
router.put('/pay/:payId', verifyToken, handleSlipUpload('slip'), paymentcon.Payment);
router.get('/slip/:payId', verifyToken, paymentcon.getSlip);
router.get('/getreceipt/:payId', verifyToken, paymentcon.getReceipt);

// อัตราค่าส่วนกลาง (ข้อมูลสาธารณะ ใช้แสดงผล)
router.get('/Fee', paymentcon.Fee);
router.get('/AllFee', paymentcon.GetAllFee);

// admin เท่านั้น
router.get('/getpaid', adminOnly, paymentcon.getpaidhistory);
router.get('/getunPaid', adminOnly, paymentcon.getUnpaidhistory);
router.get('/getpending', adminOnly, paymentcon.getPendingPayments);
router.put('/confirmpay/:payId', adminOnly, paymentcon.ConfirmPayment);
router.put('/rejectpay/:payId', adminOnly, paymentcon.RejectPayment);
router.get('/monthly-payment', adminOnly, paymentcon.getMonthly);
router.post('/sendBill', adminOnly, paymentcon.FeeBill);
router.put('/changerate', adminOnly, paymentcon.ChangePayrate);
router.get('/getincome', adminOnly, paymentcon.GetIncome);
router.get('/paidhistory', adminOnly, paymentcon.LastPaid);

module.exports = router;
