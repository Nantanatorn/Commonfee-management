const nodemailer = require('nodemailer');
const sql = require('mssql');
const config = require('../config');
require('dotenv').config();
const moment = require('moment');

module.exports.SendNotiUnpaid = async (req, res) => {
  try {
    const conn = await sql.connect(config);

    // ดึงข้อมูลผู้ใช้ที่มีสถานะ "ยังไม่จ่าย" (เช่น Pay_Status = 'Overdue')
    const result = await conn.request().query("SELECT * FROM notificationview WHERE Pay_Status = 'Overdue'");
    const unpaidUsers = result.recordset;

    if (unpaidUsers.length === 0) {
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
    // Loop ส่งอีเมลให้กับผู้ที่ยังไม่จ่าย
    let successCount = 0;
    let errorMessages = [];

    for (let user of unpaidUsers) { 
      try {
        const formattedDate = moment(user.Pay_Date).locale('th').format('LL');
        const formattedDeadline = moment(user.Pay_Deadline).locale('th').format('LL');
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'คุณมียอดค้างชำระ',
          html: `   <h3>วันที่ ${currentFormattedDate} </h3>
                    <h3>เรียนคุณ ${user.R_Firstname} ${user.R_Lastname},</h3>
                    <h3>บ้านเลขที่ ${user.House_number}</h3>
                    <h4>บริษัท บ้านดี จำกัด ขอเรียนว่าคุณ ${user.R_Firstname}  มียอดค้างชำระค่าส่วนกลางสำหรับวันที่<strong>${formattedDate}</strong> <br>
                    เป็นจำนวนเงิน <strong>${user.Pay_Amount} บาท</strong> ทางเราจึงขอให้ท่านดำเนินการชำระเงินภายในวันที่ ${formattedDeadline} <br>
                    เพื่อป้องกันการถูกเพิกถอนสิทธิในการใช้พื้นที่ส่วนกลาง และ ค่าปรับจากการจ่ายล่าช้า.</h4>
                    <br>
                    <p>จึงเรียนมาเพื่อทราบ</p>
                    <p>ฝ่ายบริการลูกบ้าน,</p>
                    <p><b>บริษัท บ้านดี จำกัด</b><br>
                    โทรศัพท์: 12-343-45678<br>
                    อีเมล: support@bandee.com</p>
                `

        };

        await transporter.sendMail(mailOptions);
        successCount++;

      } catch (error) {
        // ถ้าการส่งอีเมลล้มเหลว ให้เก็บข้อความข้อผิดพลาดใน array
        console.error(`Error sending email to ${user.email}:`, error.message);
        errorMessages.push(`Error sending email to ${user.email}: ${error.message}`);
      }
    }

    // ส่งผลลัพธ์กลับ
    res.status(200).json({
      message: `Emails sent successfully to ${successCount} users`,
      errors: errorMessages,
    });

  } catch (error) {
    console.error('Error while sending emails:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
