const express = require("express");
const router = express.Router();
const housecontroll = require('../controller/house');
const { adminOnly } = require('../middleware/auth');

router.post('/house', adminOnly, housecontroll.Addhouse);
router.get('/gethouse', adminOnly, housecontroll.GetEmptyHouse);
router.get('/housestatus', adminOnly, housecontroll.GetHouseWithResident);

module.exports = router;
