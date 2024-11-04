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
            console.log(user);
            const storedHashedPassword = user.password;
            
            const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
            // Successful login
            if (isPasswordValid) {
                var payload ={
                    user: {
                        username:user.username,
                        role:user.role,
                        User_ID: user.User_ID,
                        User_Firstname: user.User_Firstname,
                        User_image : user.User_image
                        
                    }
                }
                jwt.sign(payload, 'jwtsecret', { expiresIn: '1h' }, (err, token) => {
                    if (err) throw err;

                    // Send the token and login success message together
                    return res.status(200).json({ message: 'Login successful', token ,data: result.recordset})
                    //เพิ่มpayload
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

module.exports.getUserInfo = async (req, res ) => {
    try {
        // ดึงค่า userId จาก token ที่ผ่าน middleware มา
        const userId = req.user.User_ID; // เปลี่ยนเป็น User_ID จาก payload ของ JWT
        console.log('userID:', userId);
        // เชื่อมต่อฐานข้อมูล
        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId) // ใช้ userId จาก JWT
            .query("SELECT * FROM UserAccount WHERE User_ID = @id ");
        
        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (result.recordset.length === 0) {
            return res.status(404).send('Not found');
        }

        // ส่งข้อมูลกลับไปในรูปแบบ JSON
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.UpdateProfile = async (req, res) => {
    const conn = await sql.connect(config);

    try {
        const userId = req.user.User_ID; // รับ userId จาก token ที่ถูกส่งมาจาก middleware
        console.log('userID:', userId);
        const { User_Firstname, User_Lastname, email, phone } = req.body; // รับค่าจาก body
        const imageFile = req.file;

        // ตรวจสอบว่ามีการอัปโหลดไฟล์รูปภาพหรือไม่
        let User_image = null;
        if (imageFile) {
            User_image = imageFile.path.replace(/\\/g, "/");
        }

        let updateQuery = `
            UPDATE UserAccount
            SET User_Firstname = @User_Firstname,
                User_Lastname = @User_Lastname,
                email = @email,
                phone = @phone
        `;

        // หากมีการอัปโหลดรูปภาพ ให้เพิ่มคอลัมน์ User_image ลงในการอัปเดต
        if (User_image) {
            updateQuery += `, User_image = @User_image`;
        }

        updateQuery += ` WHERE User_ID = @id;`;

        const request = conn.request()
            .input('id', sql.Int, userId)
            .input('User_Firstname', sql.NVarChar, User_Firstname)
            .input('User_Lastname', sql.NVarChar, User_Lastname)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone);

        // หากมีการอัปโหลดรูปภาพ ให้เพิ่มค่าของ User_image ลงใน request ด้วย
        if (User_image) {
            request.input('User_image', sql.NVarChar, User_image);
        }

        const result = await request.query(updateQuery);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'User info updated successfully.', data: result.recordset });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }

    } catch (err) {
        console.error('Error during profile update:', err);
        res.status(500).json({ message: 'Fail to update user information.' });
    }
};


module.exports.ChangePassbyID = async (req, res) => {
    try {
        // รับ userId จาก token ที่ผ่านการยืนยันจาก middleware
        const userId = req.user.User_ID; 
        console.log('userID:', userId);

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        // เข้ารหัสรหัสผ่านก่อนอัปเดตในฐานข้อมูล
        const hashedPassword = await bcrypt.hash(password, 10);

        // เชื่อมต่อฐานข้อมูล
        const conn = await sql.connect(config);
        
        // ใช้ userId เพื่ออัปเดตรหัสผ่านในฐานข้อมูล
        const result = await conn.request()
            .input('userId', sql.Int, userId)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                UPDATE UserAccount 
                SET password = @password 
                WHERE User_ID = @userId
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