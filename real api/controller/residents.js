const config = require("../config");
const express = require("express");
const sql = require("mssql");
const { paging, positiveInt } = require("../middleware/validate");

const PETITION_TYPES = ['Repair', 'Normal'];


module.exports.GetResident = async ( req , res ) => {
    try{    
        const conn = await sql.connect(config);
        const result = await conn.request()
        .query('select * from Resident_info')

        res.status(200).json(result.recordset);

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to get Resident');

    }

}

module.exports.SentPetition = async (req, res) => {
    const defaultstatus = 'Ongoing';
    try {
        const conn = await sql.connect(config);
        const userId = req.user.User_ID;

        // รับค่าจาก body ของ request
        const { petition_detail, petition_Type, petition_Title } = req.body;

        // ตรวจสอบข้อมูลเบื้องต้น (optional)
        if (!petition_detail || !petition_Type || !petition_Title) {
            return res.status(400).json({ message: 'Invalid input data' });
        }
        if (!PETITION_TYPES.includes(String(petition_Type).trim())) {
            return res.status(400).json({ message: `petition_Type must be one of ${PETITION_TYPES.join(', ')}` });
        }

        // ดำเนินการส่งคำร้อง
        const send = await conn.request()
            .input('petition_Title', sql.NVarChar, petition_Title)
            .input('petition_detail', sql.NVarChar, petition_detail)
            .input('petition_status', sql.Char, defaultstatus)
            .input('petition_Type', sql.NChar, String(petition_Type).trim())
            .input('User_ID', sql.Int, userId) // ใช้ตัวแปร userId ที่ได้จาก token
            .query(`INSERT INTO Petition 
                    (petition_Title, petition_detail, petition_status, petition_Type, petition_Date, User_ID) 
                    VALUES 
                    (@petition_Title, @petition_detail, @petition_status, @petition_Type, GETDATE(), @User_ID)`);

        // ส่งผลลัพธ์กลับไปยังผู้ใช้ในรูปแบบ JSON
        res.status(200).json({ message: 'Petition sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
}


module.exports.Getpetition = async (req, res) => {
    try {
        // ดึงค่า userId จาก token ที่ผ่าน middleware มา
        const userId = req.user.User_ID; // เปลี่ยนเป็น User_ID จาก payload ของ JWT

        // เชื่อมต่อฐานข้อมูล
        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId) // ใช้ userId จาก JWT
            .query("SELECT * FROM Petition WHERE User_ID = @id");

        // รายการว่างคือ [] ไม่ใช่ error
        // ส่งข้อมูลกลับไปในรูปแบบ JSON
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports.GetpetitionAdmin = async (req, res) => {
    
    try {
   
        var pool = await sql.connect(config);
        const result = await pool.request()
            
            .query("SELECT * FROM PetitionViewForAdmin");

        // รายการว่างคือ [] ไม่ใช่ error
        // ส่งข้อมูลกลับไปในรูปแบบ JSON
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports.UpdatePetition = async (req, res) => {
    try {
      const petition_ID = positiveInt(req.params.petition_ID || (req.body && req.body.petition_ID));
  
      if (!petition_ID) {
        return res.status(400).json({ message: 'A valid Petition ID is required' });
      }
  
      // เชื่อมต่อฐานข้อมูล
      var pool = await sql.connect(config);
  
      // ตรวจสอบสถานะปัจจุบัน
      const check = await pool.request()
        .input('petition_ID', sql.Int, petition_ID)
        .query("SELECT petition_status FROM Petition WHERE petition_ID = @petition_ID");
  
      if (check.recordset.length === 0) {
        return res.status(404).json({ message: 'Petition not found' });
      }
  
      const currentStatus = check.recordset[0].petition_status;
     
      // ตรวจสอบสถานะที่มีอยู่เพื่อเปลี่ยนแปลง
      let newStatus;
      if (currentStatus && currentStatus.trim() === 'Finish') {
        newStatus = 'Ongoing';
      } else if (currentStatus && currentStatus.trim() === 'Ongoing') {
        newStatus = 'Finish';
      } else {
        return res.status(400).json({ message: 'Invalid petition status' });
      }
  
      // ทำการอัปเดตสถานะใหม่
      const result = await pool
        .request()
        .input('petition_ID', sql.Int, petition_ID)
        .input('petition_status', sql.Char, newStatus)
        .query(
          `UPDATE Petition SET petition_status = @petition_status WHERE petition_ID = @petition_ID`
        );
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Petition not found' });
      }
  
      res.status(200).json({ message: 'Petition updated successfully', newStatus });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


  module.exports.getMonthlyPetition = async (req , res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        // จัดกลุ่มตามปี+เดือน (เดิมจัดตามชื่อเดือนอย่างเดียว ทำให้เดือนเดียวกันของคนละปีถูกรวมกัน)
        .query(`SELECT
                    FORMAT(MIN(petition_Date), 'MMMM', 'en-EN') AS petition_Date,
                    YEAR(petition_Date) AS petition_Year,
                    SUM(CASE WHEN RTRIM(petition_Type) = 'Repair' THEN 1 ELSE 0 END) AS Repair_Count,
                    SUM(CASE WHEN RTRIM(petition_Type) = 'Normal' THEN 1 ELSE 0 END) AS Normal_Count
                FROM
                    Petition
                WHERE
                    petition_Date IS NOT NULL
                GROUP BY
                    YEAR(petition_Date), MONTH(petition_Date)
                ORDER BY
                    YEAR(petition_Date), MONTH(petition_Date);`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
}

// รายชื่อลูกบ้านแบบแบ่งหน้า รองรับค้นหา (?search=) จากชื่อ นามสกุล บ้านเลขที่ อีเมล ชื่อผู้ใช้ เบอร์โทร และเลขบัตรประชาชน
module.exports.pageresident = async (req, res) => {
    try {
        const { page, limit, offset } = paging(req.query, 10);
        const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

        // ถ้าไม่มีคำค้นหา @search เป็น NULL แล้วเงื่อนไข `@search IS NULL` ทำให้ได้ทุกแถว
        const where = `WHERE (@search IS NULL
                    OR R_Firstname LIKE @search
                    OR R_Lastname LIKE @search
                    OR (R_Firstname + ' ' + R_Lastname) LIKE @search
                    OR House_number LIKE @search
                    OR email LIKE @search
                    OR username LIKE @search
                    OR phone LIKE @search
                    OR IDcard LIKE @search)`;
        // escape ตัวอักษรพิเศษของ LIKE เพื่อให้ค้นหาตรงตัว
        const pattern = search ? `%${search.replace(/[\[\]%_]/g, '[$&]')}%` : null;

        const conn = await sql.connect(config);

        const result = await conn.request()
            .input('search', sql.NVarChar, pattern)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT * FROM Resident_info
                ${where}
                ORDER BY R_ID
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        const countResult = await conn.request()
            .input('search', sql.NVarChar, pattern)
            .query(`SELECT COUNT(*) AS total FROM Resident_info ${where}`);

        const total = countResult.recordset[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        res.status(200).json({
            currentPage: page,
            totalPages: totalPages,
            totalItems: total,
            data: result.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to get Resident');
    }
};


// 2627 / 2601 = ละเมิด unique constraint
const isDuplicateError = (err) => err && (err.number === 2627 || err.number === 2601);

// admin: แก้ไขข้อมูลลูกบ้านที่ยังอาศัยอยู่ (ชื่อ นามสกุล อีเมล เบอร์โทร)
// ชื่อเก็บซ้ำสองตาราง (UserAccount และ Resident) จึงต้องอัปเดตทั้งสองใน transaction เดียว
module.exports.UpdateResident = async (req, res) => {
    const rid = positiveInt(req.params.id);
    if (!rid) return res.status(400).json({ message: 'รหัสลูกบ้านไม่ถูกต้อง' });

    const { User_Firstname, User_Lastname, email, phone } = req.body || {};
    const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

    if (!text(User_Firstname, 50) || !text(User_Lastname, 50)) {
        return res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล (ไม่เกิน 50 ตัวอักษร)' });
    }
    if (!text(email, 100) || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (typeof phone !== 'string' || !/^\d{9,10}$/.test(phone.trim())) {
        return res.status(400).json({ message: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' });
    }

    const first = User_Firstname.trim();
    const last = User_Lastname.trim();
    const mail = email.trim();
    const tel = phone.trim();

    let transaction;
    try {
        const pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const found = await transaction.request()
            .input('rid', sql.Int, rid)
            .query(`SELECT User_ID, RTRIM(status) AS status FROM Resident WITH (UPDLOCK) WHERE R_ID = @rid`);
        if (found.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'ไม่พบลูกบ้าน' });
        }
        const { User_ID, status } = found.recordset[0];
        if (status !== 'Living') {
            await transaction.rollback();
            return res.status(409).json({ message: 'ลูกบ้านที่ย้ายออกแล้วไม่สามารถแก้ไขข้อมูลได้' });
        }

        const dup = await transaction.request()
            .input('email', sql.NVarChar, mail)
            .input('uid', sql.Int, User_ID)
            .query(`SELECT 1 AS found FROM UserAccount WHERE email = @email AND User_ID <> @uid`);
        if (dup.recordset.length > 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        await transaction.request()
            .input('uid', sql.Int, User_ID)
            .input('first', sql.NVarChar, first)
            .input('last', sql.NVarChar, last)
            .input('email', sql.NVarChar, mail)
            .input('phone', sql.NVarChar, tel)
            .query(`UPDATE UserAccount
                    SET User_Firstname = @first, User_Lastname = @last, email = @email, phone = @phone
                    WHERE User_ID = @uid`);

        await transaction.request()
            .input('rid', sql.Int, rid)
            .input('first', sql.NVarChar, first)
            .input('last', sql.NVarChar, last)
            .query(`UPDATE Resident SET R_Firstname = @first, R_Lastname = @last WHERE R_ID = @rid`);

        await transaction.commit();
        res.status(200).json({ message: 'แก้ไขข้อมูลลูกบ้านเรียบร้อยแล้ว' });
    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        }
        if (isDuplicateError(err)) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        console.error('Error updating resident:', err);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};

// admin: ย้ายออก -- Resident.status = 'Moved' และคืนสถานะบ้านเป็น 'Empty'
// - ย้ายออกไม่ได้ถ้ายังมีบิลค้างชำระ/รอตรวจสอบ
// - เก็บ Resident.House_number และบัญชีผู้ใช้ไว้ ลูกบ้านที่ย้ายออกยังล็อกอินดูประวัติเก่าได้
// - SendBill ออกบิลเฉพาะ status = 'Living' จึงไม่ออกบิลให้คนที่ย้ายออกอีก
// - เปลี่ยนเจ้าของบ้าน = ย้ายออก แล้วลงทะเบียนคนใหม่ในบ้านเดิม
module.exports.MoveOutResident = async (req, res) => {
    const rid = positiveInt(req.params.id);
    if (!rid) return res.status(400).json({ message: 'รหัสลูกบ้านไม่ถูกต้อง' });

    let transaction;
    try {
        const pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const found = await transaction.request()
            .input('rid', sql.Int, rid)
            .query(`SELECT RTRIM(House_number) AS House_number, RTRIM(status) AS status
                    FROM Resident WITH (UPDLOCK) WHERE R_ID = @rid`);
        if (found.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'ไม่พบลูกบ้าน' });
        }
        const { House_number, status } = found.recordset[0];
        if (status !== 'Living') {
            await transaction.rollback();
            return res.status(409).json({ message: 'ลูกบ้านคนนี้ย้ายออกไปแล้ว' });
        }

        const owed = await transaction.request()
            .input('rid', sql.Int, rid)
            .query(`SELECT COUNT(*) AS n FROM PayCommonfee
                    WHERE R_ID = @rid AND RTRIM(Pay_Status) IN ('Overdue', 'Pending')`);
        const n = owed.recordset[0].n;
        if (n > 0) {
            await transaction.rollback();
            return res.status(409).json({
                message: `ย้ายออกไม่ได้ เพราะยังมีบิลค้างชำระหรือรอตรวจสอบอีก ${n} รายการ กรุณาให้ลูกบ้านชำระและยืนยันให้เรียบร้อยก่อน`,
                outstanding: n,
            });
        }

        await transaction.request()
            .input('rid', sql.Int, rid)
            .query(`UPDATE Resident SET status = 'Moved' WHERE R_ID = @rid`);

        // คืนสถานะบ้านเป็นว่าง เฉพาะเมื่อไม่มีลูกบ้านคนอื่นที่ยังอาศัยอยู่ในบ้านหลังนี้
        await transaction.request()
            .input('house', sql.NVarChar, House_number)
            .query(`UPDATE House SET House_status = 'Empty'
                    WHERE RTRIM(House_number) = @house
                      AND NOT EXISTS (SELECT 1 FROM Resident
                                      WHERE RTRIM(House_number) = @house AND RTRIM(status) = 'Living')`);

        await transaction.commit();
        res.status(200).json({ message: `ย้ายออกเรียบร้อยแล้ว บ้านเลขที่ ${House_number} กลับเป็นสถานะว่าง` });
    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        }
        console.error('Error moving out resident:', err);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};

module.exports.GetpetitionCount = async (req , res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`select
          SUM(CASE WHEN petition_Type = 'Repair' THEN 1 ELSE 0 END) AS Repair_Count,
          SUM(CASE WHEN petition_Type = 'Normal' THEN 1 ELSE 0 END) AS Normal_Count
          FROM 
          Petition`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
}  