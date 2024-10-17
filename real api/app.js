const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config');
require('dotenv').config();
const app = express();
const bodyParser = require('body-parser');
const path = require('path');


const registerroute =require('./routes/register');
const loginroute = require('./routes/login');
const newsroute = require('./routes/news');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 3500;

app.use('/',registerroute);
app.use('/',loginroute);
app.use('/',newsroute);
app.use('/public', express.static(path.join(__dirname, 'public')));

async function connectToDatabase() {
    try{
        await sql.connect(config);
        const result = await sql.query`SELECT DB_NAME() AS CurrentDatabase`; // ดึงชื่อฐานข้อมูลปัจจุบัน
        console.log('Connected to mssql');
        console.log('Using database:', result.recordset[0].CurrentDatabase); // แสดงชื่อฐานข้อมูล
        
    }catch(err){
        console.error('Database connection failed',err);
    }
}
connectToDatabase();

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
