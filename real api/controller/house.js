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
        res.status(500).send('Failt to get Add');

    }

}

module.exports.GetEmptyHouse = async ( req , res ) => {
    const conn = await sql.connect(config);

    try {

        const result = await conn.request()
        .query("SELECT * FROM House WHERE House_status = 'Empty' ORDER BY House_No ASC;");

        res.status(200).json(result.recordset);
        
    }catch(err){

        console.error(err);
        res.status(500).send('Fail');

    }
}

module.exports.GetHouseWithResident = async ( req , res ) => {
    const conn = await sql.connect(config);

    try {

        const result = await conn.request()
        .query(`SELECT dbo.Resident.R_ID, 
                dbo.Resident.R_Lastname, 
                dbo.Resident.R_Firstname, 
                dbo.Resident.status, 
                dbo.UserAccount.phone, 
                dbo.House.House_number, 
                dbo.House.House_No, 
                dbo.PayCommonfee.Pay_Status,
                dbo.PayCommonfee.Pay_ID
                FROM dbo.Resident
                INNER JOIN dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID
                INNER JOIN dbo.House ON dbo.Resident.House_number = dbo.House.House_number
                LEFT JOIN dbo.PayCommonfee ON dbo.Resident.R_ID = dbo.PayCommonfee.R_ID
                ORDER BY dbo.PayCommonfee.Pay_ID DESC;`);

        res.status(200).json(result.recordset);
        
    }catch(err){

        console.error(err);
        res.status(500).send('Fail');

    }
}