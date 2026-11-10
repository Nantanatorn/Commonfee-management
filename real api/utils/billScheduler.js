const sql = require('mssql');
const config = require('../config');

// ออกบิลประจำเดือนอัตโนมัติ (ปิดไว้เป็นค่าเริ่มต้น เพราะการออกบิลจะส่งอีเมลหาลูกบ้านทุกคน)
// เปิดด้วย AUTO_BILL=true ใน .env  | BILL_DAY = วันที่ของเดือนที่เริ่มออกบิล (1-28, ค่าเริ่มต้น 1)
//
// ทำงานทุกชั่วโมง: ถ้าถึงวันออกบิลแล้ว และเดือนนี้ยังไม่มีบิลเลย จึงออกบิล
// (เซิร์ฟเวอร์ปิดอยู่ตอนวันที่ 1 ก็ออกย้อนหลังให้เมื่อเปิดขึ้นมา และ SendBill กันออกซ้ำรายคนอยู่แล้ว)

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

// ตัดสินใจว่าควรออกบิลตอนนี้หรือไม่ (แยกเป็นฟังก์ชันล้วนๆ เพื่อทดสอบง่าย)
const shouldIssueBills = ({ now, billDay, billsThisMonth }) =>
    now.getDate() >= billDay && billsThisMonth === 0;

const parseBillDay = (value) => {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n >= 1 && n <= 28 ? n : 1;
};

let running = false;

const tick = async (payments) => {
    if (running) return;
    running = true;
    try {
        const pool = await sql.connect(config);

        const count = await pool.request().query(`
            SELECT COUNT(*) AS n FROM PayCommonfee
            WHERE YEAR(Pay_Date) = YEAR(GETDATE()) AND MONTH(Pay_Date) = MONTH(GETDATE())`);

        const ok = shouldIssueBills({
            now: new Date(),
            billDay: parseBillDay(process.env.BILL_DAY),
            billsThisMonth: count.recordset[0].n,
        });
        if (!ok) return;

        const manager = await pool.request().query('SELECT TOP 1 User_ID FROM villagemanager ORDER BY manager_ID');
        if (manager.recordset.length === 0) {
            console.warn('AutoBill skipped: no village manager found');
            return;
        }

        const bills = await payments.createBills(manager.recordset[0].User_ID);
        console.log(`AutoBill: created ${bills.length} bills`);
        if (bills.length > 0) {
            payments.sendBillEmails(bills.map(b => b.Pay_ID))
                .catch(e => console.error('AutoBill email job failed:', e.message));
        }
    } catch (err) {
        console.error('AutoBill failed', err.message);
    } finally {
        running = false;
    }
};

const startBillScheduler = () => {
    if (String(process.env.AUTO_BILL).toLowerCase() !== 'true') {
        console.log('AutoBill disabled (set AUTO_BILL=true in .env to enable)');
        return;
    }
    const payments = require('../controller/payments');
    console.log(`AutoBill enabled (bill day ${parseBillDay(process.env.BILL_DAY)})`);
    tick(payments);
    setInterval(() => tick(payments), CHECK_INTERVAL_MS);
};

module.exports = { startBillScheduler, shouldIssueBills, parseBillDay };
