const config = require("../config");
const express = require("express");
const sql = require("mssql");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.loginUser = async(req,res)=>{
    const { username, password } = req.body;
    const pool = await sql.connect(config);
    
    try {
        // Query to check if user exists with the given username and password
        const result = await pool.request()

        .input('username', sql.VarChar, username)//bind username
        .query('SELECT * FROM UserAccount WHERE username = @username'); //query

        if (result.recordset.length === 0) {
            // Username not found
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const storedHashedPassword = user.password;
        
            const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
            // Successful login
            if (isPasswordValid) {
                var payload ={
                    user: {
                        username:user.username,
                        role:user.role,
                        picture:user.picture
                    }
                }
                jwt.sign(payload, 'jwtsecret', { expiresIn: '1h' }, (err, token) => {
                    if (err) throw err;

                    // Send the token and login success message together
                    return res.status(200).json({ message: 'Login successful', token });//เพิ่มpayload
                });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
 
        } 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
