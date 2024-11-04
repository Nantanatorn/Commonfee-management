const config = require("../config");
const express = require("express");
const sql = require("mssql");
const nodemailer = require('nodemailer');
const moment = require('moment');

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
            .input('Paid_Fine',sql.Money,paymentData.Pay_Fine)
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
    let transaction;
    try {
        const conn = await sql.connect(config);
        transaction = new sql.Transaction(conn);
        await transaction.begin(); // เริ่มการทำงานของ Transaction

        const userId = req.user.User_ID;

        let Bill = await transaction.request()
            .input('userId', sql.Int, userId)
            .execute(`SendBill`);

        if (!Bill.recordset || Bill.recordset.length === 0) {
            await transaction.rollback(); // ยกเลิกการทำงานทั้งหมดหากไม่มีการสร้างบิล
            return res.status(404).json({ message: 'No bill generated for user' });
        }

        // ดึงข้อมูลผู้ใช้ที่ยังไม่ได้ชำระเงิน (Pay_Status = 'Overdue')
        const result = await transaction.request().query("SELECT * FROM notificationview WHERE Pay_Status = 'Overdue'");
        const unpaidUsers = result.recordset;

        if (unpaidUsers.length === 0) {
            await transaction.rollback(); // ยกเลิกการทำงานทั้งหมดหากไม่มีผู้ใช้ที่ยังไม่ได้ชำระเงิน
            return res.status(404).json({ message: 'No unpaid users found' });
        }

        // กำหนดค่า Nodemailer โดยใช้ข้อมูลจาก .env
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const currentFormattedDate = moment().locale('th').format('LL');
        let successCount = 0;
        let errorMessages = [];

        for (let user of unpaidUsers) {
            try {
                const formattedDate = moment(user.Pay_Date).locale('th').format('LL');
                const formattedDeadline = moment(user.Pay_Deadline).locale('th').format('LL');
                
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'กรุณาชำระเงิน',
                    html: `
                    <h3>วันที่ ${currentFormattedDate} </h3>
                    <h3>เรียนคุณ ${user.R_Firstname} ${user.R_Lastname},</h3>
                    <h3>บ้านเลขที่ ${user.House_number}</h3>
                    <h4>บริษัท บ้านดี จำกัด ขอเรียนว่าคุณ ${user.R_Firstname}  มียอดชำระค่าส่วนกลางสำหรับวันที่<strong>${formattedDate}</strong> <br>
                    เป็นจำนวนเงิน <strong>${user.Pay_Amount} บาท</strong> ทางเราจึงขอให้ท่านดำเนินการชำระเงินภายในวันที่ ${formattedDeadline} <br>
                    เพื่อป้องกันการถูกเพิกถอนสิทธิในการใช้พื้นที่ส่วนกลาง.</h4>
                    <br>
                    <p>จึงเรียนมาเพื่อทราบ</p>
                    <p>ฝ่ายบริการลูกบ้าน,</p>
                    <p><b>บริษัท บ้านดี จำกัด</b><br>
                    โทรศัพท์: 12-343-45678<br>
                    อีเมล: support@bandee.com</p>
                    `,
                };

                await transporter.sendMail(mailOptions);
                successCount++;
            } catch (error) {
                console.error(`Error sending email to ${user.email}:`, error.message);
                errorMessages.push(`Error sending email to ${user.email}: ${error.message}`);
            }
        }

        // ถ้าไม่มีข้อผิดพลาด ให้ทำการ commit การเปลี่ยนแปลงในฐานข้อมูล
        await transaction.commit();

        // ส่ง response กลับไปยัง client หลังจากการส่งอีเมลทั้งหมด
        res.status(200).json({
            message: `บิลถูกสร้างและส่งอีเมลเรียบร้อยแล้ว จำนวน ${successCount} คน`,
            errors: errorMessages,
            data: Bill.recordset,
        });

    } catch (err) {
        if (transaction) {
            await transaction.rollback(); // ยกเลิกการทำงานทั้งหมดหากเกิดข้อผิดพลาด
        }
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports.ChangePayrate = async (req, res) => {
    try {
        // เชื่อมต่อกับฐานข้อมูล
        const conn = await sql.connect(config);
        
        // ดึงค่าจาก body ของคำขอ
        const { House_Size, Land_size, FeeRate, Fine } = req.body;
        
        // ตรวจสอบว่าค่าที่จำเป็นต้องไม่เป็นค่าว่าง
        if (!House_Size || Land_size == null || FeeRate == null || Fine == null) {
            return res.status(400).json({ message: 'Invalid input data, all fields are required' });
        }
        
        // ทำการอัปเดตข้อมูลในตาราง PriceandSize โดยกำหนดเงื่อนไขที่ House_Size
        const Payrate = await conn.request()
            .input('House_Size', sql.VarChar, House_Size)
            .input('Land_size', sql.Int, Land_size)
            .input('FeeRate', sql.Money, FeeRate)
            .input('Fine',sql.Money,Fine)
            .query(`
                UPDATE PriceandSize
                SET Land_size = @Land_size, FeeRate = @FeeRate ,  Fine = @Fine
                WHERE House_Size = @House_Size
            `);

        // ตรวจสอบว่ามีการอัปเดตจริงหรือไม่
        if (Payrate.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'No record updated, possibly House_Size not found' });
        }

        // ส่งผลลัพธ์กลับ
        res.status(200).json({
            message: 'Update successfully',
        });

    } catch (error) {
        // จัดการกับข้อผิดพลาด
        console.error('error message', error.message);
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
};

module.exports.Fee = async (req , res) => {
    const conn = await sql.connect(config);

    try {
        // รับค่าขนาดบ้านจาก query parameter
        const House_Size = req.query.House_Size;

        if (!House_Size) {
            return res.status(400).json({ message: 'House_Size is required' });
        }

        // ใช้ค่า House_Size เพื่อค้นหา
        const result = await conn.request()
            .input('House_Size', sql.VarChar, House_Size)
            .query('SELECT * FROM PriceandSize WHERE House_Size = @House_Size');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'No data found for the given House_Size' });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to get data');
    }

}

module.exports.GetAllFee = async (req , res ) => {
    const conn = await sql.connect(config);

    try{    
        const result = await conn.request()
        .query('select * from PriceandSize')

        res.status(200).json(result.recordset);

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to get ');

    }
}


module.exports.getReceipt = async (req, res) => {
    try {
        const { payId } = req.params; // รับ Pay_ID จาก params

        // เชื่อมต่อฐานข้อมูล
        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('payId', sql.Int, payId) // ใช้ payId จาก request
            .query("SELECT * FROM ReceiptView WHERE Pay_ID = @payId");

        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (result.recordset.length === 0) {
            return res.status(404).send('Not found');
        }

        // ส่งข้อมูลกลับไปในรูปแบบ JSON
        res.status(200).json(result.recordset); // ส่งเฉพาะใบเสร็จที่ตรงกับ Pay_ID
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.GetIncome = async ( req , res ) => {
    const conn = await sql.connect(config);

    try{    
        const result = await conn.request()
        .query(`SELECT 
                DATENAME(MONTH, Receipt_Date) AS Month,
                SUM(Receipt_Total) AS TotalAmount
                FROM 
                ReceiptView
                GROUP BY 
                DATENAME(MONTH, Receipt_Date), 
                MONTH(Receipt_Date)
                ORDER BY 
                MONTH(Receipt_Date);
            `)

        res.status(200).json(result.recordset);

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to get ');

    }
}

