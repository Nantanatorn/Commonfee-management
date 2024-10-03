const express = require('express');
require('dotenv').config();

const registerCon=require('../controller/register')
const router = express.Router();

router.post('/register',registerCon.enrollment)
module.exports = router;