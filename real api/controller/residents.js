const config = require("../config");
const express = require("express");
const sql = require("mssql");


module.exports.GetResident = async ( req , res ) => {
    
    const conn = await sql.connect(config);

    try{    
        const result = await conn.request()
        .query('select * from Resident_info')

        res.status(200).json(result.recordset);

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to get Resident');

    }

}

module.exports.SentPetition = async (req, res) => {
    const conn = await sql.connect(config);
    const defaultstatus = 'Ongoing';
    try {
        const userId = req.user.User_ID;

        // รับค่าจาก body ของ request
        const { petition_detail, petition_Type, petition_Title } = req.body;

        // ตรวจสอบข้อมูลเบื้องต้น (optional)
        if (!petition_detail || !petition_Type || !petition_Title) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        // ดำเนินการส่งคำร้อง
        const send = await conn.request()
            .input('petition_Title', sql.NVarChar, petition_Title)
            .input('petition_detail', sql.NVarChar, petition_detail)
            .input('petition_status', sql.Char, defaultstatus)
            .input('petition_Type', sql.NChar, petition_Type)
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


module.exports.GetpetitionAdmin = async (req, res) => {
    
    try {
   
        var pool = await sql.connect(config);
        const result = await pool.request()
            
            .query("SELECT * FROM PetitionViewForAdmin");
        
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