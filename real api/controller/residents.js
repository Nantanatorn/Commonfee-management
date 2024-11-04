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


module.exports.UpdatePetition = async (req, res) => {
    try {
      const petition_ID = req.params.petition_ID || req.body.petition_ID;
  
      if (!petition_ID) {
        return res.status(400).json({ message: 'Petition ID is required' });
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
        .query(`WITH MonthlyPetition AS (
                SELECT 
                    FORMAT(petition_Date, 'MMMM', 'en-EN') AS petition_Date,
                    MIN(petition_Date) AS First_petition_Date,
                    SUM(CASE WHEN petition_Type = 'Repair' THEN 1 ELSE 0 END) AS Repair_Count,
                    SUM(CASE WHEN petition_Type = 'Normal' THEN 1 ELSE 0 END) AS Normal_Count
                FROM 
                    Petition
                GROUP BY 
                    FORMAT(petition_Date, 'MMMM', 'en-EN')
                )
                SELECT 
                    petition_Date,
                    Repair_Count,
                    Normal_Count
                FROM 
                    MonthlyPetition
                ORDER BY 
                    First_petition_Date;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }   
}

module.exports.SreachResident = async ( req , res ) => {
    try {
        // รับค่าที่ใช้ค้นหา (query parameter ที่ชื่อ 'search')
        const search = req.query.search;

        if (!search) {
            return res.status(400).json({ message: 'Search parameter is required' });
        }

        // เชื่อมต่อฐานข้อมูล
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('search', sql.VarChar, `%${search}%`)  // รับค่า search และใช้ wildcard
            .query(`
                SELECT * FROM Resident_info
                WHERE R_Firstname LIKE @search
                OR R_Lastname LIKE @search
                OR House_number LIKE @search
                OR email LIKE @search
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'No residents found' });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error searching resident:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


module.exports.pageresident = async (req, res) => {
    try {
        // รับค่าของ page และ limit จาก query parameter (ถ้าไม่มีค่าจะใช้ค่าเริ่มต้น)
        const page = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (เริ่มต้นเป็น 1)
        const limit = parseInt(req.query.limit) || 10; // จำนวนรายการต่อหน้า (เริ่มต้นเป็น 10)

        // คำนวณ OFFSET เพื่อใช้ในการเลื่อนข้อมูล
        const offset = (page - 1) * limit;

        // เชื่อมต่อฐานข้อมูล
        const conn = await sql.connect(config);
        
        // ใช้ OFFSET และ FETCH สำหรับการทำ Pagination
        const result = await conn.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT * FROM Resident_info
                ORDER BY R_ID
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);
        
        // นับจำนวนรายการทั้งหมด (เพื่อนำไปคำนวณหน้าทั้งหมด)
        const countResult = await conn.request()
            .query(`SELECT COUNT(*) AS total FROM Resident_info`);
        
        const total = countResult.recordset[0].total;
        const totalPages = Math.ceil(total / limit);

        // ส่งข้อมูลการทำ Pagination กลับไปยัง Client
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