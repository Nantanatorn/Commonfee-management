const express = require('express');
const registerCon = require('../controller/register');
const { adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/register', adminOnly, registerCon.enrollment);
router.post('/forgotpass/request', registerCon.requestReset);
router.put('/updatepass', registerCon.changepass);

module.exports = router;
