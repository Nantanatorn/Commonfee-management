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


module.exports.getMonthly = async (req , res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`WITH MonthlyPayment AS (
                SELECT 
                    FORMAT(Pay_Date, 'MMMM', 'en-EN') AS Pay_Month,
                    MIN(Pay_Date) AS First_Pay_Date,
                    SUM(CASE WHEN Pay_Status = 'Paid' THEN 1 ELSE 0 END) AS Paid_Count,
                    SUM(CASE WHEN Pay_Status = 'Overdue' THEN 1 ELSE 0 END) AS Overdue_Count
                FROM 
                    PayCommonfee
                GROUP BY 
                    FORMAT(Pay_Date, 'MMMM', 'en-EN')
                )
                SELECT 
                    Pay_Month,
                    Paid_Count,
                    Overdue_Count
                FROM 
                    MonthlyPayment
                ORDER BY 
                    First_Pay_Date;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
}


module.exports.getpaidhistory = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`SELECT 
					R_Firstname, 
					R_Lastname, 
					House_number,
					MIN(phone) AS phone,
                    FORMAT(MIN(Pay_Date), 'MMMM', 'en-EN') AS Pay_Month,
					MIN(Pay_Amount) AS Pay_Amount,
					MIN(Pay_Deadline) AS Pay_Deadline,
					MIN(Pay_Status) AS Pay_Status
				FROM 
					PaymentHistoryView
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
                FORMAT(MIN(Pay_Date), 'MMMM', 'en-EN') AS Pay_Month, 
                SUM(Pay_Amount) AS Pay_Amount, 
                MIN(Pay_Deadline) AS Pay_Deadline,
                MIN(Pay_Status) AS Pay_Status
                FROM PaymentHistoryView
                WHERE Pay_Status = 'Overdue'
                GROUP BY House_number
                ORDER BY Pay_Amount DESC; `);

                                                                
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
};

module.exports.Payment = async (req, res) => {
    const payId = req.params.payId;
    const userId = req.user.User_ID;

    if (!payId || !userId) {
        return res.status(400).json({ message: 'Invalid payId or userId' });
    }

    let transaction; // Declare transaction here to use it in catch block.

    try {
        // เชื่อมต่อฐานข้อมูล
        let pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);

        // เริ่ม Transaction
        await transaction.begin();

        // ตรวจสอบว่ามีรายการชำระเงินที่ตรงกับ User_ID และ Pay_ID หรือไม่
        let paymentResult = await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .input('User_ID', sql.Int, userId)
            .query(`
                SELECT p.*
                FROM PayCommonfee p
                JOIN Resident r ON p.R_ID = r.R_ID
                WHERE r.User_ID = @User_ID AND p.Pay_ID = @Pay_ID;
            `);

        if (paymentResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Payment not found for this user' });
        }

        const paymentData = paymentResult.recordset[0];

        // ตรวจสอบว่าสถานะการชำระเงินไม่ใช่ 'Paid' แล้ว
        if (paymentData.Pay_Status === 'Paid') {
            await transaction.rollback();
            return res.status(400).json({ message: 'This payment has already been processed.' });
        }

        // อัปเดตสถานะการชำระเงินเป็น 'Paid'
        await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .input('Pay_Status', sql.NVarChar, 'Paid')
            .query(`UPDATE PayCommonfee SET Pay_Status = @Pay_Status WHERE Pay_ID = @Pay_ID`);

        // เรียก Stored Procedure เพื่อเพิ่มข้อมูลใบเสร็จ
        await transaction.request()
            .input('Paid_Date', sql.DateTime, new Date())
            .input('R_ID', sql.Int, paymentData.R_ID)
            .input('Paid_Amount', sql.Money, paymentData.Pay_Amount)
            .input('Pay_ID', sql.Int, payId)
            .execute('UpdatePayment');

        // ยืนยันการทำงาน (commit)
        await transaction.commit();

        // ตอบกลับไปยัง Client ว่าการทำงานสำเร็จ
        res.status(200).json({ message: 'Payment updated and receipt added successfully' });

    } catch (err) {
        console.error('Error processing payment:', err);
        if (transaction) {
            await transaction.rollback();
        }
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