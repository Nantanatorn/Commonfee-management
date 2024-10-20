const express = require("express");
const router = express.Router();
const housecontroll = require('../controller/house');
require('dotenv').config();

    router.post('/house',housecontroll.Addhouse)
    router.get('/gethouse',housecontroll.GetEmptyHouse)
    router.get('/housestatus',housecontroll.GetHouseWithResident)

module.exports = router;