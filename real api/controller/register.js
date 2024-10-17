const config = require("../config");
const express = require("express");
const sql = require("mssql");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




module.exports.enrollment = async (req, res) => {
    const {IDcard , User_Firstname , User_Lastname , House_number , phone , email} = req.body;
    const defaultRole = 'Resident';
    // Simple validation
    if (!User_Firstname || !User_Lastname  || !email || !houseID ||  !IDcard || !phone || !House_number) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        const pool = await sql.connect(config);

        // Check if email already exists
        const checkUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM UserAccount WHERE email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(1234567890, 10); // Salt rounds = 10
        const username = User_Firstname;
        // Insert new user
        const transaction = new sql.Transaction(pool)
        await transaction.begin();
        try {
            const insertCustomer = await transaction.request()
                
                .input('User_Firstname', sql.VarChar, User_Firstname)
                .input('User_Lastname', sql.VarChar, User_Lastname)
                .input('username', sql.VarChar, username)
                .input('email',sql.VarChar,email)
                .input('password', sql.VarChar, hashedPassword) // Store hashed password
                .input('phone', sql.VarChar, phone)
                .input('role', sql.VarChar, defaultRole)
                .input('IDcard',sql.VarChar,IDcard)
                .input('houseID',sql.Int,houseID)
                .query('INSERT INTO UserAccount ( User_Firstname, User_Lastname, username,email, password, phone,role,IDcard,houseID) OUTPUT INSERTED.User_ID VALUES (@User_Firstname, @User_Lastname, @username, @email, @password, @phone,@role,@IDcard,@houseID)');

            const User_ID = insertCustomer.recordset[0].User_ID;
            await transaction.request()
            .input('User_ID', sql.Int, User_ID)
            .input('R_Firstname', sql.VarChar, User_Firstname) // Use User_Firstname as R_Firstname
            .input('R_Lastname', sql.VarChar, User_Lastname)   // Use User_Lastname as R_Lastname
            .query('INSERT INTO Resident (User_ID, R_Firstname, R_Lastname) VALUES (@User_ID, @R_Firstname, @R_Lastname)');
    
        

            await transaction.commit();
            res.status(201).json({ message: 'User registered successfully.' });
        } catch (error) {
            await transaction.rollback();
            console.error('Transaction error:', error);
            res.status(500).json({ mesage: 'Error during registreation.' });
        }

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};
module.exports.changepass = async (req, res ,next) => {
    const { username, email } = req.query;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const conn = await sql.connect(config);
        const result = await conn.request()
            .input('username', sql.VarChar, username || null)
            .input('email', sql.VarChar, email || null)
            .input('password', sql.VarChar, hashedPassword)
            .query(`UPDATE UserAccount SET password = @password WHERE username = @username OR email = @email`);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'Password updated successfully.' });
        } else {
            res.status(404).json({ message: 'User not found or email does not match.' });
        }
    } catch (error) {
        console.error('Error during password update:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};
