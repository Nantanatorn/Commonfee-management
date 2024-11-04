const config = require("../config");
const express = require("express");
const sql = require("mssql");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




module.exports.enrollment = async (req, res) => {
    const {IDcard , User_Firstname , User_Lastname , House_number , phone , email,username} = req.body;
    const defaultRole = 'Resident';
    const defaultStatus = 'Living';
    // Simple validation
    if (!User_Firstname || !User_Lastname  || !email  ||  !IDcard || !phone || !House_number || !username) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
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

        const checkHouse = await pool.request()
            .input('House_number', sql.VarChar, House_number)
            .query('SELECT * FROM Resident WHERE House_number = @House_number');

        if (checkHouse.recordset.length > 0) {
            return res.status(400).json({ message: 'House already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('1234567890', 10); // Salt rounds = 10
        
        // Insert new user
        const transaction = new sql.Transaction(pool)
        await transaction.begin();
        try {
            const insertCustomer = await transaction.request()
                
                .input('User_Firstname', sql.NVarChar, User_Firstname)
                .input('User_Lastname', sql.NVarChar, User_Lastname)
                .input('username', sql.NVarChar, username)
                .input('email',sql.NVarChar,email)
                .input('password', sql.NVarChar, hashedPassword) // Store hashed password
                .input('phone', sql.NVarChar, phone)
                .input('role', sql.NVarChar, defaultRole)
                .input('IDcard',sql.NVarChar,IDcard)
                .query('INSERT INTO UserAccount ( User_Firstname, User_Lastname, username,email, password, phone,role,IDcard) OUTPUT INSERTED.User_ID VALUES (@User_Firstname, @User_Lastname, @username, @email, @password, @phone,@role,@IDcard)');

            const User_ID = insertCustomer.recordset[0].User_ID;
            await transaction.request()
            .input('User_ID', sql.Int, User_ID)
            .input('R_Firstname', sql.NVarChar, User_Firstname) // Use User_Firstname as R_Firstname
            .input('R_Lastname', sql.NVarChar, User_Lastname)   // Use User_Lastname as R_Lastname
            .input('House_number',sql.NChar,House_number)
            .input('status', sql.Char,defaultStatus)
            .query('INSERT INTO Resident (User_ID, R_Firstname, R_Lastname, EntryDate,House_number,status ) VALUES (@User_ID, @R_Firstname, @R_Lastname, GETDATE(),@House_number,@status)');
    
            await transaction.request()
            .input('House_number', sql.NChar, House_number) 
            .input('Full', sql.NChar, 'Full') 
            .query('UPDATE House SET House_status = @Full WHERE House_number = @House_number');

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

module.exports.changepass = async (req, res, next) => {
    const { identifier } = req.query; // ใช้ identifier เพื่อรับค่าได้ทั้ง username หรือ email
    const { password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Invalid input data, identifier and password are required' });
    }

    try {
        // เข้ารหัสรหัสผ่านก่อนอัปเดตในฐานข้อมูล
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const conn = await sql.connect(config);
        const result = await conn.request()
            .input('identifier', sql.VarChar, identifier)
            .input('password', sql.VarChar, hashedPassword)
            .query(`
                UPDATE UserAccount 
                SET password = @password 
                WHERE username = @identifier OR email = @identifier
            `);

        // ตรวจสอบว่ามีการอัปเดตจริงหรือไม่
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'Password updated successfully.' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error during password update:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};


