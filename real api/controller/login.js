const config = require("../config");
const sql = require("mssql");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// ตัดข้อมูลที่ห้ามส่งออกไปให้ client (เช่น password hash)
const sanitizeUser = (u) => {
    const { password, ...safe } = u;
    return safe;
};

module.exports.loginUser = async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM UserAccount WHERE username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const payload = {
            user: {
                username: user.username,
                role: user.role,
                User_ID: user.User_ID,
                User_Firstname: user.User_Firstname,
                User_image: user.User_image
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Server error' });
            }
            return res.status(200).json({
                message: 'Login successful',
                token,
                data: result.recordset.map(sanitizeUser)
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getUserInfo = async (req, res) => {
    try {
        const userId = req.user.User_ID;
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query("SELECT * FROM UserAccount WHERE User_ID = @id ");

        if (result.recordset.length === 0) {
            return res.status(404).send('Not found');
        }

        res.status(200).json(result.recordset.map(sanitizeUser));
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.UpdateProfile = async (req, res) => {
    try {
        const userId = req.user.User_ID;
        const { User_Firstname, User_Lastname, email, phone } = req.body || {};
        const imageFile = req.file;

        const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
        if (![User_Firstname, User_Lastname, email, phone].every(nonEmpty)) {
            return res.status(400).json({ message: 'User_Firstname, User_Lastname, email and phone are required' });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email.' });
        }

        const conn = await sql.connect(config);

        let User_image = null;
        if (imageFile) {
            User_image = `public/${imageFile.filename}`;
        }

        let updateQuery = `
            UPDATE UserAccount
            SET User_Firstname = @User_Firstname,
                User_Lastname = @User_Lastname,
                email = @email,
                phone = @phone
        `;

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

        if (User_image) {
            request.input('User_image', sql.NVarChar, User_image);
        }

        const result = await request.query(updateQuery);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'User info updated successfully.' });
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
        const userId = req.user.User_ID;
        const { password } = req.body || {};

        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password is required (min 6 characters)' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const conn = await sql.connect(config);

        const result = await conn.request()
            .input('userId', sql.Int, userId)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                UPDATE UserAccount
                SET password = @password
                WHERE User_ID = @userId
            `);

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
