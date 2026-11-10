const express = require("express");
const router = express.Router();
const loginCon = require('../controller/login');
const { verifyToken } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

router.post('/login', loginCon.loginUser);
router.get('/userinfo', verifyToken, loginCon.getUserInfo);
router.put('/updateprofile', verifyToken, handleUpload('User_image'), loginCon.UpdateProfile);
router.put('/changepassbytoken', verifyToken, loginCon.ChangePassbyID);

module.exports = router;
