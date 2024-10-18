const config = require("../config");
const express = require("express");
const sql = require("mssql");



module.exports.Addhouse = async ( res , req ) => {

    
    const conn = await sql.connect(config);
    const defaultStatus = 'Empty';

    try{
        
        const { House_number, House_Size} = req.body;
        const addHouse =  await conn.request()

        .input('House_number',sql.NVarChar, House_number)
        .input('House_Size',sql.NVarChar,House_Size)
        .inpuit('House_status',sql.NVarChar,defaultStatus)
        .query ('insert into House (House_number , House_Size , House_status) values (@House_number , @House_Size , @defaultStatus) ')
        
        res.status(201).json({ message: 'House added successfully.', data: addHouse.recordset });

    }catch(err){

        console.error(err);
        res.status(500).send('Failt to get Announcement');

    }


}