const express = require("express");
const router = express.Router();
const newscontroll = require('../controller/new');
require('dotenv').config();
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

    router.get('/getannouce',newscontroll.getAllannouce);
    router.post('/addanoucement',upload.single('Announce_image'),newscontroll.AddAnoucement);


module.exports = router;