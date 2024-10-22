const config = require("../config");
const express = require("express");
const sql = require("mssql");


module.exports.PaymentHistory = async (req, res) => {
    try {
        // ดึงค่า userId จาก token ที่ผ่าน middleware มา
        const userId = req.user.User_ID; // เปลี่ยนเป็น User_ID จาก payload ของ JWT

        // เชื่อมต่อฐานข้อมูล
        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId) // ใช้ userId จาก JWT
            .query("SELECT * FROM PaymentHistoryView WHERE User_ID = @id ORDER BY Pay_ID Desc;");
        
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
};

module.exports.getpaidhistory = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`SELECT 
					R_Firstname, 
					R_Lastname, 
					House_number,
					MIN(phone) AS phone,
					MIN(Pay_Amount) AS Pay_Amount,
					MIN(Pay_Deadline) AS Pay_Deadline,
					MIN(Pay_Status) AS Pay_Status
				FROM 
					PaidandUnpaidView
				WHERE 
					Pay_Status = 'Paid'
				GROUP BY 
					R_Firstname, R_Lastname, House_number
				ORDER BY 
					House_number;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
};

module.exports.getUnpaidhistory = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`SELECT MIN(R_Firstname) AS R_Firstname, 
                MIN(R_Lastname) AS R_Lastname, 
                MIN(phone) AS phone, 
                House_number, 
				COUNT(*) AS Pay_Out,
                SUM(Pay_Amount) AS Pay_Amount, 
                MIN(Pay_Deadline) AS Pay_Deadline,
                MIN(Pay_Status) AS Pay_Status
                FROM PaidandUnpaidView
                WHERE Pay_Status = 'Overdue'
                GROUP BY House_number
                ORDER BY Pay_Amount DESC  `);

                                                                
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
};

module.exports.Payment = async (req, res) => {
    const payId = req.params.payId; // ดึง Pay_ID จาก QR Code ที่สแกน
    const userId = req.user.User_ID; // ดึง User_ID จาก Token

    if (!payId || !userId) {
        return res.status(400).json({ message: 'Invalid payId or userId' });
    }

    try {
        // เชื่อมต่อฐานข้อมูล
        let pool = await sql.connect(config);

        // ตรวจสอบว่ามีรายการชำระเงินที่ตรงกับ User_ID และ Pay_ID หรือไม่
        let paymentResult = await pool.request()
            .input('Pay_ID', sql.Int, payId)
            .input('User_ID', sql.Int, userId)
            .query(`SELECT p.*
                    FROM PayCommonfee p
                    JOIN Resident r ON p.R_ID = r.R_ID
                    WHERE r.User_ID = @User_ID AND p.Pay_ID = @Pay_ID;`);

        if (paymentResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Payment not found for this user' });
        }

        const paymentData = paymentResult.recordset[0];

        // ตรวจสอบว่าสถานะการชำระเงินไม่ใช่ 'Paid' แล้ว
        if (paymentData.Pay_Status === 'Paid') {
            return res.status(400).json({ message: 'This payment has already been processed.' });
        }

        // อัปเดตสถานะการชำระเงินเป็น 'Paid'
        await pool.request()
            .input('Pay_ID', sql.Int, payId)
            .input('Pay_Status', sql.NVarChar, 'Paid')
            .query(`UPDATE PayCommonfee SET Pay_Status = @Pay_Status WHERE Pay_ID = @Pay_ID`);

        // เพิ่มข้อมูลใบเสร็จลงในตาราง Receipt
        await pool.request()
            .input('Receipt_Date', sql.DateTime, new Date())
            .input('R_ID', sql.Int, paymentData.R_ID)
            .input('manager_ID', sql.Int, userId) // สมมติว่าผู้จัดการคือผู้ที่ชำระเงินเอง
            .input('Pay_ID', sql.Int, payId)
            .input('House_number', sql.NVarChar, paymentData.House_number)
            .query(`INSERT INTO Receipt (Receipt_Date, R_ID, manager_ID, Pay_ID, House_number)
                    VALUES (@Receipt_Date, @R_ID, @manager_ID, @Pay_ID, @House_number)`);

        // ตอบกลับไปยัง Client ว่าการทำงานสำเร็จ
        res.status(200).json({ message: 'Payment updated and receipt added successfully' });

    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports.FeeBill = async (req, res) => {
    const conn = await sql.connect(config);

    try {
        const userId = req.user.User_ID;

        let Bill = await conn.request()
            .input('userId', sql.Int, userId)
            .execute(`SendBill`);

        res.status(200).json(Bill.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};