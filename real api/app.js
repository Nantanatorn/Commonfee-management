const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config');
require('dotenv').config();
const { startBillScheduler } = require('./utils/billScheduler');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');


const registerroute =require('./routes/register');
const loginroute = require('./routes/login');
const newsroute = require('./routes/news');
const residentroute = require('./routes/resident');
const houseroute = require('./routes/house');
const paymentsroute = require('./routes/payment');
const promptpayroute = require('./routes/promptpay');
const notificationroute = require('./routes/notification');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = parseInt(process.env.PORT, 10) || 3500;

app.use('/',notificationroute);
app.use('/',promptpayroute);
app.use('/',paymentsroute);
app.use('/',houseroute);
app.use('/',residentroute);
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
// คิดค่าปรับบิลที่เลยกำหนดชำระ (procedure UpdateFine เป็น idempotent: ตั้งค่าปรับ = ค่าปรับตามขนาดบ้าน ไม่บวกซ้ำ)
async function runFineUpdate() {
    try {
        // procedure เวอร์ชันเก่า (Pay_Fine = Pay_Fine + Fine) จะบวกค่าปรับซ้ำทุกครั้งที่รัน
        // จึงรันก็ต่อเมื่อเป็นเวอร์ชัน idempotent จาก sql/fixes.sql แล้วเท่านั้น
        const def = await sql.query`SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.UpdateFine')) AS def`;
        const text = String(def.recordset[0]?.def || '').replace(/\s+/g, '').toLowerCase();
        if (!text) {
            console.warn('UpdateFine skipped: procedure not found');
            return;
        }
        if (text.includes('pay_fine=pay_fine+')) {
            console.warn('UpdateFine skipped: procedure is the old non-idempotent version. Run "real api/sql/fixes.sql" first.');
            return;
        }
        await sql.query`EXEC UpdateFine`;
        console.log('UpdateFine executed');
    } catch (err) {
        console.error('UpdateFine failed', err.message);
    }
}
connectToDatabase().then(() => {
    runFineUpdate();
    setInterval(runFineUpdate, 24 * 60 * 60 * 1000);
    startBillScheduler();
});

// กัน process ล่มจาก promise ที่ไม่ได้ catch
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
