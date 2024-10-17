const config = require("../config");
const express = require("express");
const sql = require("mssql");
const multer = require('multer');


module.exports.getAllannouce = async (req , res) => {

    const conn = await sql.connect(config);

    try{
        const result = await conn.request()
        .query("SELECT * from Announcement");

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
            
            const Annouce = await conn.request()
            
            .input('Announce_Title',sql.NVarChar,Announce_Title)
            .input('Announce_Detail',sql.NVarChar,Announce_Detail)
            .input('Announce_image',sql.NVarChar,Announce_image)
            .query('Insert into Announcement (Announce_Date ,Announce_Title,Announce_Detail, Announce_image) values (GETDATE() , @Announce_Title,@Announce_Detail, @Announce_image)')

            
            res.status(201).json({ message: 'Announcement added successfully.', data: Annouce.recordset });

    }catch(err){

        console.error(err);
        res.status(500).send('Fail to add Announcement');

    }


}