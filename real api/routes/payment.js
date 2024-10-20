const express = require("express");
const router = express.Router();
const paymentcon =require('../controller/payments')
const { verifyToken } = require('../middleware/auth');

require('dotenv').config();

router.get('/paymenthistory', verifyToken, paymentcon.PaymentHistory);


module.exports = router;