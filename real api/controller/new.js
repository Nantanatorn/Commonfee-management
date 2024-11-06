const config = require("../config");
const express = require("express");
const sql = require("mssql");
const multer = require('multer');


module.exports.getAllannouce = async (req , res) => {

    const conn = await sql.connect(config);

    try{
        const result = await conn.request()
        .query("SELECT *,DATEADD(HOUR, -7, Announce_Date) AS Adjusted_Announce_Date from Announcement where Announce_Status = 'Show' ORDER BY Announce_ID DESC");

        res.status(200).json(result.recordset);

    }catch(err){

        console.error(err);
        res.status(500).send('Failt to get Announcement');

    }

}   

module.exports.AddAnoucement = async ( req , res ) => {

    const conn = await sql.connect(config);

    try{
        const {  Announce_Title, Announce_Detail } = req.body;
        const imageFile = req.file;

        const Announce_image = imageFile.path.replace(/\\/g, "/");
        const Announce_Status = 'Show';
            const Annouce = await conn.request()
            
            .input('Announce_Title',sql.NVarChar,Announce_Title)
            .input('Announce_Detail',sql.NVarChar,Announce_Detail)
            .input('Announce_image',sql.NVarChar,Announce_image)
            .input('Announce_Status',sql.NChar,Announce_Status)
            .query('Insert into Announcement (Announce_Date ,Announce_Title,Announce_Detail, Announce_image,Announce_Status) values (GETDATE() , @Announce_Title,@Announce_Detail, @Announce_image,@Announce_Status)')

            
            res.status(201).json({ message: 'Announcement added successfully.', data: Annouce.recordset });

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to add Announcement');

    }


}

module.exports.EditNews = async (req, res) => {
    const conn = await sql.connect(config);

    try {
        console.log('Request received for editing announcement:', req.params.id);
        const { Announce_Title, Announce_Detail, Announce_Status } = req.body;
        const imageFile = req.file;

        let Announce_image = null;
        if (imageFile) {
            Announce_image = imageFile.path.replace(/\\/g, "/");
            console.log('Image file received and processed:', Announce_image);
        } else {
            console.log('No new image file provided. Retaining existing image.');
        }

        let query = `
            UPDATE Announcement 
            SET Announce_Title = @Announce_Title,
                Announce_Detail = @Announce_Detail,
                Announce_Status = @Announce_Status
        `;

        if (Announce_image) {
            query += `, Announce_image = @Announce_image`;
        }

        query += ` WHERE Announce_ID = @id`;

        console.log('SQL Query to be executed:', query);

        const request = conn.request()
            .input('id', sql.Int, req.params.id)
            .input('Announce_Title', sql.NVarChar, Announce_Title)
            .input('Announce_Detail', sql.NVarChar, Announce_Detail)
            .input('Announce_Status', sql.NChar, Announce_Status);

        if (Announce_image) {
            request.input('Announce_image', sql.NVarChar, Announce_image);
        }

        console.log('Executing SQL Query...');
        const Annouce = await request.query(query);

        console.log('Announcement updated successfully:', Annouce.recordset);
        res.status(200).json({ message: 'Announcement updated successfully.', data: Annouce.recordset });

    } catch (err) {
        console.error('Error while editing announcement:', err);
        res.status(500).send('Fail to edit Announcement');
    }
};


module.exports.getPageannouce = async (req, res) => {
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
                    SELECT *,
                    DATEADD(HOUR, -7, Announce_Date) AS Adjusted_Announce_Date
                    FROM Announcement
                    ORDER BY Announce_ID DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY;
                
            `);
        
        // นับจำนวนรายการทั้งหมด (เพื่อนำไปคำนวณหน้าทั้งหมด)
        const countResult = await conn.request()
            .query(`SELECT COUNT(*) AS total FROM Announcement`);
        
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
        res.status(500).send('Failed to get Announcement');
    }
};