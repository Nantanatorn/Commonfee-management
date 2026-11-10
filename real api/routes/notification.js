const express = require("express");
const router = express.Router();
const Noticon = require("../controller/notification");
const { adminOnly } = require('../middleware/auth');

router.post('/unpaidnoti', adminOnly, Noticon.SendNotiUnpaid);

module.exports = router;
