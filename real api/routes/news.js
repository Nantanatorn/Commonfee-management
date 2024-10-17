const express = require("express");
const router = express.Router();
const newscontroll = require('../controller/new');
require('dotenv').config();

    router.get('/getannouce',newscontroll.getAllannouce);
    router.post('/addanoucement',newscontroll.AddAnoucement);


module.exports = router;