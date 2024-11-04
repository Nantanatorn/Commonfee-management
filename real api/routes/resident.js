const express = require("express");
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const residentscontroll = require('../controller/residents');
require('dotenv').config();

    router.get('/resident',residentscontroll.GetResident);
    router.post('/petition', verifyToken, residentscontroll.SentPetition);
    router.get('/getpetition',verifyToken, residentscontroll.Getpetition);
    router.get('/getpetitionAdmin', residentscontroll.GetpetitionAdmin);
    router.put('/updatepetition/:petition_ID',residentscontroll.UpdatePetition);
    router.get('/monthly-petition',residentscontroll.getMonthlyPetition);
    router.get('/searchresident',residentscontroll.SreachResident);
    router.get('/pageresident',residentscontroll.pageresident);
    router.get('/petitioncount',residentscontroll.GetpetitionCount);

module.exports = router;