const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const residentscontroll = require('../controller/residents');

// ลูกบ้าน
router.post('/petition', verifyToken, residentscontroll.SentPetition);
router.get('/getpetition', verifyToken, residentscontroll.Getpetition);

// admin เท่านั้น
router.get('/resident', adminOnly, residentscontroll.GetResident);
router.get('/getpetitionAdmin', adminOnly, residentscontroll.GetpetitionAdmin);
router.put('/updatepetition/:petition_ID', adminOnly, residentscontroll.UpdatePetition);
router.get('/monthly-petition', adminOnly, residentscontroll.getMonthlyPetition);
router.get('/pageresident', adminOnly, residentscontroll.pageresident);
router.put('/resident/:id', adminOnly, residentscontroll.UpdateResident);
router.put('/resident/:id/moveout', adminOnly, residentscontroll.MoveOutResident);
router.get('/petitioncount', adminOnly, residentscontroll.GetpetitionCount);

module.exports = router;
