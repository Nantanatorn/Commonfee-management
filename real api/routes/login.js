const express = require("express");
const router = express.Router();
const loginCon =require('../Controller/login')
require('dotenv').config();

//http://localhost:3000/api/login
router.post('/login',loginCon.loginUser)

module.exports = router;