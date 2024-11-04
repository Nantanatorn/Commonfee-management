require('dotenv').config();
const express = require("express");
const router = express.Router();
const Noticon = require("../controller/notification");

    router.post('/unpaidnoti',Noticon.SendNotiUnpaid);




module.exports = router;

