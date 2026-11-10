const config = require("../config");
const sql = require("mssql");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendMail, esc } = require('../utils/mailer');

const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) out += chars[crypto.randomInt(chars.length)];
    return out;
};

// 2627 / 2601 = ละเมิด unique constraint
const isDuplicateError = (err) => err && (err.number === 2627 || err.number === 2601);

// สมัครสมาชิก (เฉพาะ admin) -- สร้างรหัสผ่านชั่วคราวแบบสุ่มและส่งทางอีเมล
module.exports.enrollment = async (req, res) => {
    const { IDcard, User_Firstname, User_Lastname, House_number, phone, email, username } = req.body || {};
    const defaultRole = 'Resident';
    const defaultStatus = 'Living';

    if (!User_Firstname || !User_Lastname || !email || !IDcard || !phone || !House_number || !username) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    if (![User_Firstname, User_Lastname, email, IDcard, phone, House_number, username].every(v => typeof v === 'string')) {
        return res.status(400).json({ message: 'Invalid input.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email.' });
    }

    let transaction;
    try {
        const pool = await sql.connect(config);

        const dup = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('username', sql.NVarChar, username)
            .input('IDcard', sql.NVarChar, IDcard)
            .query(`SELECT
                        SUM(CASE WHEN email = @email THEN 1 ELSE 0 END) AS e,
                        SUM(CASE WHEN username = @username THEN 1 ELSE 0 END) AS u,
                        SUM(CASE WHEN IDcard = @IDcard THEN 1 ELSE 0 END) AS i
                    FROM UserAccount`);
        const d = dup.recordset[0];
        if (d.e > 0) return res.status(400).json({ message: 'Email already exists.' });
        if (d.u > 0) return res.status(400).json({ message: 'Username already exists.' });
        if (d.i > 0) return res.status(400).json({ message: 'IDcard already exists.' });

        // บ้านต้องมีอยู่จริงและยังว่าง
        const house = await pool.request()
            .input('House_number', sql.NVarChar, House_number)
            .query(`SELECT House_status FROM House WHERE RTRIM(House_number) = @House_number`);
        if (house.recordset.length === 0) {
            return res.status(400).json({ message: 'House not found.' });
        }
        if (String(house.recordset[0].House_status).trim() !== 'Empty') {
            return res.status(400).json({ message: 'House already exists.' });
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const insertUser = await transaction.request()
            .input('User_Firstname', sql.NVarChar, User_Firstname)
            .input('User_Lastname', sql.NVarChar, User_Lastname)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('phone', sql.NVarChar, phone)
            .input('role', sql.NVarChar, defaultRole)
            .input('IDcard', sql.NVarChar, IDcard)
            .query('INSERT INTO UserAccount (User_Firstname, User_Lastname, username, email, password, phone, role, IDcard) OUTPUT INSERTED.User_ID VALUES (@User_Firstname, @User_Lastname, @username, @email, @password, @phone, @role, @IDcard)');

        const User_ID = insertUser.recordset[0].User_ID;

        await transaction.request()
            .input('User_ID', sql.Int, User_ID)
            .input('R_Firstname', sql.NVarChar, User_Firstname)
            .input('R_Lastname', sql.NVarChar, User_Lastname)
            .input('House_number', sql.NChar, House_number)
            .input('status', sql.Char, defaultStatus)
            .query('INSERT INTO Resident (User_ID, R_Firstname, R_Lastname, EntryDate, House_number, status) VALUES (@User_ID, @R_Firstname, @R_Lastname, GETDATE(), @House_number, @status)');

        // อัปเดตสถานะบ้านเฉพาะเมื่อยังว่างอยู่ (กันสมัครบ้านเดียวกันพร้อมกัน)
        const upd = await transaction.request()
            .input('House_number', sql.NChar, House_number)
            .query(`UPDATE House SET House_status = 'Full' WHERE House_number = @House_number AND RTRIM(House_status) = 'Empty'`);
        if (upd.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'House already exists.' });
        }

        await transaction.commit();

        // ส่งรหัสผ่านชั่วคราวทางอีเมล (ถ้าส่งไม่สำเร็จ ให้ admin เห็นรหัสในผลลัพธ์)
        let emailSent = true;
        try {
            await sendMail({
                to: email,
                subject: 'บัญชีผู้ใช้ของคุณถูกสร้างแล้ว',
                html: `<p>เรียนคุณ ${esc(User_Firstname)} ${esc(User_Lastname)}</p>
                       <p>ชื่อผู้ใช้: <b>${esc(username)}</b><br>รหัสผ่านชั่วคราว: <b>${esc(tempPassword)}</b></p>
                       <p>กรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านทันที</p>`,
            });
        } catch (mailErr) {
            emailSent = false;
            console.error('Failed to send temp password email:', mailErr.message);
        }

        const body = { message: 'User registered successfully.', emailSent };
        if (!emailSent) body.tempPassword = tempPassword;
        res.status(201).json(body);

    } catch (error) {
        if (transaction) {
            try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        }
        if (isDuplicateError(error)) {
            return res.status(400).json({ message: 'Duplicate data (email, username, IDcard or house).' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};

// ---------- ลืมรหัสผ่าน: ขอรหัสยืนยันทางอีเมล แล้วใช้รหัสนั้นตั้งรหัสผ่านใหม่ ----------
// เก็บใน memory (หมดอายุ 10 นาที, ผิดได้ไม่เกิน 5 ครั้ง) -- ถ้ารีสตาร์ทเซิร์ฟเวอร์ รหัสที่ขอไว้จะใช้ไม่ได้
const resetCodes = new Map(); // User_ID -> { hash, expires, attempts, requestedAt }
const CODE_TTL_MS = 10 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest();

module.exports.requestReset = async (req, res) => {
    const { identifier } = req.body || {};
    const generic = { message: 'If the account exists, a verification code has been sent to its email.' };

    if (typeof identifier !== 'string' || !identifier) {
        return res.status(400).json({ message: 'identifier is required' });
    }

    try {
        const conn = await sql.connect(config);
        const result = await conn.request()
            .input('identifier', sql.NVarChar, identifier)
            .query('SELECT User_ID, email FROM UserAccount WHERE username = @identifier OR email = @identifier');

        if (result.recordset.length !== 1) {
            return res.status(200).json(generic); // ไม่บอกว่ามีบัญชีหรือไม่
        }

        const { User_ID, email } = result.recordset[0];
        const prev = resetCodes.get(User_ID);
        if (prev && Date.now() - prev.requestedAt < REQUEST_COOLDOWN_MS) {
            return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
        }

        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        resetCodes.set(User_ID, { hash: hashCode(code), expires: Date.now() + CODE_TTL_MS, attempts: 0, requestedAt: Date.now() });

        try {
            await sendMail({
                to: email,
                subject: 'รหัสยืนยันสำหรับตั้งรหัสผ่านใหม่',
                html: `<p>รหัสยืนยันของคุณคือ <b style="font-size:20px">${esc(code)}</b></p><p>รหัสนี้ใช้ได้ 10 นาที หากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยอีเมลนี้</p>`,
            });
        } catch (mailErr) {
            console.error('Failed to send reset code:', mailErr.message);
        }

        res.status(200).json(generic);
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};

module.exports.changepass = async (req, res) => {
    const { identifier, code, password } = req.body || {};

    if (typeof identifier !== 'string' || typeof code !== 'string' || typeof password !== 'string' || !identifier || !code || !password) {
        return res.status(400).json({ message: 'identifier, code and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const conn = await sql.connect(config);
        const found = await conn.request()
            .input('identifier', sql.NVarChar, identifier)
            .query('SELECT User_ID FROM UserAccount WHERE username = @identifier OR email = @identifier');

        const invalid = () => res.status(400).json({ message: 'Invalid or expired verification code.' });
        if (found.recordset.length !== 1) return invalid();

        const User_ID = found.recordset[0].User_ID;
        const entry = resetCodes.get(User_ID);
        if (!entry || Date.now() > entry.expires || entry.attempts >= MAX_ATTEMPTS) {
            resetCodes.delete(User_ID);
            return invalid();
        }

        entry.attempts++;
        if (!crypto.timingSafeEqual(entry.hash, hashCode(code))) return invalid();

        resetCodes.delete(User_ID);
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await conn.request()
            .input('User_ID', sql.Int, User_ID)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE UserAccount SET password = @password WHERE User_ID = @User_ID');

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
