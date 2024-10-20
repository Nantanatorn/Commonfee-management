const express = require("express");
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const residentscontroll = require('../controller/residents');
require('dotenv').config();

    router.get('/resident',residentscontroll.GetResident);
    router.post('/petition', verifyToken, residentscontroll.SentPetition);
    router.get('/getpetition',verifyToken, residentscontroll.Getpetition);
    router.get('/getpetitionAdmin', residentscontroll.GetpetitionAdmin)


module.exports = router;