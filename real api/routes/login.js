const express = require("express");
const router = express.Router();
const loginCon =require('../controller/login')
require('dotenv').config();
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination : (req , file , cb) => {
        cb(null, 'public/');
    },
    filename: (req , file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
    const upload = multer({ storage: storage});


    //http://localhost:3000/api/login
    router.post('/login',loginCon.loginUser)
    router.get('/userinfo',verifyToken,loginCon.getUserInfo);
    router.put('/updateprofile',verifyToken,upload.single('User_image'),loginCon.UpdateProfile);
    router.put('/changepassbytoken',verifyToken,loginCon.ChangePassbyID)


    module.exports = router;