const config = require("../config");
const sql = require("mssql");
const moment = require('moment');
const { paging, positiveInt, positiveMoney } = require("../middleware/validate");
const { sendMail, esc } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SLIP_DIR } = require('../middleware/upload');

const HOUSE_SIZES = ['S', 'M', 'L'];

module.exports.PaymentHistory = async (req, res) => {
    try {
        const userId = req.user.User_ID;

        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query("SELECT * FROM PaymentHistoryView WHERE User_ID = @id ORDER BY Pay_ID Desc;");

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports.getMonthly = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        // จัดกลุ่มตามปี+เดือน (เดิมจัดตามชื่อเดือนอย่างเดียว ทำให้เดือนเดียวกันของคนละปีถูกรวมกัน)
        // Pending (รอ admin ตรวจสอบ) ยังไม่ถือว่าชำระ จึงนับรวมใน Overdue_Count ให้ยอดตรงกับตอนยังไม่แจ้งชำระ
        .query(`SELECT
                    FORMAT(MIN(Pay_Date), 'MMMM', 'en-EN') AS Pay_Month,
                    YEAR(Pay_Date) AS Pay_Year,
                    SUM(CASE WHEN RTRIM(Pay_Status) = 'Paid' THEN 1 ELSE 0 END) AS Paid_Count,
                    SUM(CASE WHEN RTRIM(Pay_Status) IN ('Overdue', 'Pending') THEN 1 ELSE 0 END) AS Overdue_Count
                FROM
                    PayCommonfee
                WHERE
                    Pay_Date IS NOT NULL
                GROUP BY
                    YEAR(Pay_Date), MONTH(Pay_Date)
                ORDER BY
                    YEAR(Pay_Date), MONTH(Pay_Date);`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports.getpaidhistory = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        // คืนทุกรายการที่ชำระแล้ว (เดิม GROUP BY + MIN() ทำให้เหลือแถวเดียวต่อบ้าน ประวัติเดือนอื่นหาย)
        .query(`SELECT
                    Pay_ID,
                    R_Firstname,
                    R_Lastname,
                    House_number,
                    phone,
                    Pay_Date,
                    FORMAT(Pay_Date, 'MMMM', 'en-EN') AS Pay_Month,
                    Pay_Amount,
                    Pay_Deadline,
                    Pay_Status
                FROM
                    PaymentHistoryView
                WHERE
                    RTRIM(Pay_Status) = 'Paid'
                ORDER BY
                    Pay_Date DESC, House_number;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.getUnpaidhistory = async (req, res) => {
    try {
        var pool = await sql.connect(config);

        const result = await pool.request()
        .query(`SELECT MIN(R_Firstname) AS R_Firstname,
                MIN(R_Lastname) AS R_Lastname,
                MIN(phone) AS phone,
                House_number,
                COUNT(*) AS Pay_Out,
                FORMAT(MIN(Pay_Date), 'MMMM', 'en-EN') AS Pay_Month,
                SUM(Pay_Amount) AS Pay_Amount,
                MIN(Pay_Deadline) AS Pay_Deadline,
                MIN(Pay_Status) AS Pay_Status
                FROM PaymentHistoryView
                WHERE Pay_Status = 'Overdue'
                GROUP BY House_number
                ORDER BY Pay_Amount DESC; `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

// ตรวจ "ลายเซ็น" ของไฟล์ว่าเป็นรูปจริง (ไม่เชื่อแค่นามสกุล/mimetype ที่ client ส่งมา)
const isImageBuffer = (b) => {
    if (!b || b.length < 12) return false;
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;                                   // jpeg
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return true;                              // png
    if (b.toString('ascii', 0, 4) === 'GIF8') return true;                                              // gif
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return true;     // webp
    return false;
};

const removeFile = (filePath) => { if (filePath) fs.unlink(filePath, () => {}); };

// ลูกบ้านแจ้งชำระ: ต้องแนบสลิป (multipart field "slip")
module.exports.Payment = async (req, res) => {
    const filePath = req.file && req.file.path;
    const fail = (status, message) => { removeFile(filePath); return res.status(status).json({ message }); };

    const payId = positiveInt(req.params.payId);
    const userId = req.user.User_ID;

    if (!payId || !userId) return fail(400, 'Invalid payId or userId');
    if (!req.file) return fail(400, 'กรุณาแนบสลิปการโอนเงิน');

    let hash;
    try {
        const buf = await fs.promises.readFile(filePath);
        if (!isImageBuffer(buf)) return fail(400, 'ไฟล์ที่แนบไม่ใช่รูปภาพ');
        hash = crypto.createHash('sha256').update(buf).digest('hex');
    } catch (err) {
        console.error('Error reading slip:', err);
        return fail(500, 'Server Error');
    }

    let transaction;

    try {
        let pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // ตรวจสอบว่ามีรายการชำระเงินที่ตรงกับ User_ID และ Pay_ID หรือไม่
        let paymentResult = await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .input('User_ID', sql.Int, userId)
            .query(`
                SELECT p.*
                FROM PayCommonfee p
                JOIN Resident r ON p.R_ID = r.R_ID
                WHERE r.User_ID = @User_ID AND p.Pay_ID = @Pay_ID;
            `);

        if (paymentResult.recordset.length === 0) {
            await transaction.rollback();
            return fail(404, 'Payment not found for this user');
        }

        // Pay_Status เป็น nchar(7) จึงมีช่องว่างต่อท้าย ('Paid   ') ต้อง trim ก่อนเทียบ
        const currentStatus = String(paymentResult.recordset[0].Pay_Status).trim();
        if (currentStatus === 'Paid') {
            await transaction.rollback();
            return fail(400, 'This payment has already been processed.');
        }
        if (currentStatus === 'Pending') {
            await transaction.rollback();
            return fail(400, 'This payment is already waiting for admin confirmation.');
        }

        // สลิปใบเดียวกันห้ามใช้กับบิลอื่น
        const dup = await transaction.request()
            .input('hash', sql.Char(64), hash)
            .query('SELECT TOP 1 Pay_ID FROM PayCommonfee WHERE Slip_Hash = @hash');
        if (dup.recordset.length > 0) {
            await transaction.rollback();
            return fail(409, 'สลิปนี้เคยถูกใช้แจ้งชำระแล้ว กรุณาแนบสลิปของรายการนี้');
        }

        // ลูกบ้านแจ้งชำระ: Overdue -> Pending (รอ admin ตรวจสอบและกดยืนยัน จึงจะเป็น Paid และออกใบเสร็จ)
        // อัปเดตแบบ atomic: ถ้ามีคำขอซ้อนมาพร้อมกัน จะมีเพียงคำขอเดียวที่ผ่าน
        const updated = await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .input('Slip_Image', sql.NVarChar, path.basename(filePath))
            .input('Slip_Hash', sql.Char(64), hash)
            .query(`UPDATE PayCommonfee
                    SET Pay_Status = 'Pending', Slip_Image = @Slip_Image, Slip_Hash = @Slip_Hash
                    WHERE Pay_ID = @Pay_ID AND RTRIM(Pay_Status) = 'Overdue'`);

        if (updated.rowsAffected[0] === 0) {
            await transaction.rollback();
            return fail(400, 'This payment cannot be reported.');
        }

        await transaction.commit();

        res.status(200).json({ message: 'Payment reported. Waiting for admin confirmation.' });

    } catch (err) {
        console.error('Error reporting payment:', err);
        if (transaction) {
            try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        }
        // 2601 / 2627 = ชน unique index ของสลิป (มีคำขอที่ใช้สลิปเดียวกันเข้ามาพร้อมกัน)
        if (err && (err.number === 2601 || err.number === 2627)) {
            return fail(409, 'สลิปนี้เคยถูกใช้แจ้งชำระแล้ว กรุณาแนบสลิปของรายการนี้');
        }
        return fail(500, 'Server Error');
    }
};

// ดูสลิป: เจ้าของบิล หรือ admin เท่านั้น
module.exports.getSlip = async (req, res) => {
    try {
        const payId = positiveInt(req.params.payId);
        if (!payId) return res.status(400).json({ message: 'Invalid payId' });

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('payId', sql.Int, payId)
            .query(`SELECT p.Slip_Image, r.User_ID
                    FROM PayCommonfee p
                    JOIN Resident r ON r.R_ID = p.R_ID
                    WHERE p.Pay_ID = @payId`);

        const row = result.recordset[0];
        const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
        // ไม่ใช่เจ้าของ/ไม่มีสลิป ตอบ 404 เหมือนกัน (ไม่เปิดเผยว่ามีบิลนี้อยู่)
        if (!row || !row.Slip_Image || (!isAdmin && row.User_ID !== req.user.User_ID)) {
            return res.status(404).json({ message: 'Not found' });
        }

        res.set('Cache-Control', 'private, max-age=300');
        res.sendFile(path.join(SLIP_DIR, path.basename(row.Slip_Image)), (err) => {
            if (err && !res.headersSent) res.status(404).json({ message: 'Not found' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

// admin: รายการที่ลูกบ้านแจ้งชำระแล้ว รอตรวจสอบ
module.exports.getPendingPayments = async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`SELECT v.Pay_ID, v.R_Firstname, v.R_Lastname, v.House_number, v.phone, v.Pay_Date,
                           v.Pay_Amount, v.Pay_Fine, v.Pay_Deadline, v.Pay_Status,
                           CASE WHEN p.Slip_Image IS NULL THEN 0 ELSE 1 END AS Has_Slip
                    FROM PaymentHistoryView v
                    JOIN PayCommonfee p ON p.Pay_ID = v.Pay_ID
                    WHERE RTRIM(v.Pay_Status) = 'Pending'
                    ORDER BY v.Pay_ID DESC;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

// admin ยืนยันว่าได้รับเงินแล้ว: Pending -> Paid และออกใบเสร็จ
module.exports.ConfirmPayment = async (req, res) => {
    const payId = positiveInt(req.params.payId);
    if (!payId) {
        return res.status(400).json({ message: 'Invalid payId' });
    }

    let transaction;
    try {
        const pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // เปลี่ยนสถานะแบบ atomic เฉพาะบิลที่เป็น Pending (กัน admin กดซ้ำ/ออกใบเสร็จซ้ำ)
        const updated = await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .query(`UPDATE PayCommonfee SET Pay_Status = 'Paid' WHERE Pay_ID = @Pay_ID AND RTRIM(Pay_Status) = 'Pending'`);

        if (updated.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Payment not found or not waiting for confirmation.' });
        }

        const bill = await transaction.request()
            .input('Pay_ID', sql.Int, payId)
            .query('SELECT R_ID, Pay_Amount, Pay_Fine FROM PayCommonfee WHERE Pay_ID = @Pay_ID');
        const paymentData = bill.recordset[0];

        // เรียก Stored Procedure เพื่อเพิ่มข้อมูลใบเสร็จ
        await transaction.request()
            .input('Paid_Date', sql.DateTime, new Date())
            .input('R_ID', sql.Int, paymentData.R_ID)
            .input('Paid_Amount', sql.Money, paymentData.Pay_Amount)
            .input('Paid_Fine', sql.Money, paymentData.Pay_Fine || 0)
            .input('Pay_ID', sql.Int, payId)
            .execute('UpdatePayment');

        await transaction.commit();

        res.status(200).json({ message: 'Payment confirmed and receipt added successfully' });
    } catch (err) {
        console.error('Error confirming payment:', err);
        if (transaction) {
            try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// admin ปฏิเสธ (ยังไม่ได้รับเงิน): Pending -> Overdue และล้างสลิปเดิม เพื่อให้ลูกบ้านแนบสลิปใหม่ได้
module.exports.RejectPayment = async (req, res) => {
    try {
        const payId = positiveInt(req.params.payId);
        if (!payId) {
            return res.status(400).json({ message: 'Invalid payId' });
        }

        const pool = await sql.connect(config);

        const current = await pool.request()
            .input('Pay_ID', sql.Int, payId)
            .query(`SELECT Slip_Image FROM PayCommonfee WHERE Pay_ID = @Pay_ID AND RTRIM(Pay_Status) = 'Pending'`);

        const updated = await pool.request()
            .input('Pay_ID', sql.Int, payId)
            .query(`UPDATE PayCommonfee
                    SET Pay_Status = 'Overdue', Slip_Image = NULL, Slip_Hash = NULL
                    WHERE Pay_ID = @Pay_ID AND RTRIM(Pay_Status) = 'Pending'`);

        if (updated.rowsAffected[0] === 0) {
            return res.status(409).json({ message: 'Payment not found or not waiting for confirmation.' });
        }

        const oldSlip = current.recordset[0]?.Slip_Image;
        if (oldSlip) removeFile(path.join(SLIP_DIR, path.basename(oldSlip)));

        res.status(200).json({ message: 'Payment rejected. Status set back to Overdue.' });
    } catch (err) {
        console.error('Error rejecting payment:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ส่งอีเมลแจ้งบิลใหม่ (รันเบื้องหลังหลัง commit แล้ว เพื่อไม่ให้ request ค้างและไม่ถือ transaction)
const sendBillEmails = async (payIds) => {
    const ids = payIds.map(Number).filter(Number.isInteger);
    if (ids.length === 0) return;

    const conn = await sql.connect(config);
    const result = await conn.request().query(`
        SELECT p.Pay_ID, r.R_Firstname, r.R_Lastname, u.email, p.Pay_Date, p.Pay_Amount, p.Pay_Deadline, p.House_number
        FROM PayCommonfee p
        JOIN Resident r ON r.R_ID = p.R_ID
        JOIN UserAccount u ON u.User_ID = r.User_ID
        WHERE p.Pay_ID IN (${ids.join(',')})`);

    const currentFormattedDate = moment().locale('th').format('LL');
    let success = 0;

    for (const user of result.recordset) {
        try {
            const formattedDate = moment(user.Pay_Date).locale('th').format('LL');
            const formattedDeadline = moment(user.Pay_Deadline).locale('th').format('LL');

            await sendMail({
                to: user.email,
                subject: 'กรุณาชำระเงิน',
                html: `
                <h3>วันที่ ${esc(currentFormattedDate)} </h3>
                <h3>เรียนคุณ ${esc(user.R_Firstname)} ${esc(user.R_Lastname)},</h3>
                <h3>บ้านเลขที่ ${esc(user.House_number)}</h3>
                <h4>บริษัท บ้านดี จำกัด ขอเรียนว่าคุณ ${esc(user.R_Firstname)}  มียอดชำระค่าส่วนกลางสำหรับวันที่<strong>${esc(formattedDate)}</strong> <br>
                เป็นจำนวนเงิน <strong>${esc(user.Pay_Amount)} บาท</strong> ทางเราจึงขอให้ท่านดำเนินการชำระเงินภายในวันที่ ${esc(formattedDeadline)} <br>
                เพื่อป้องกันการถูกเพิกถอนสิทธิในการใช้พื้นที่ส่วนกลาง.</h4>
                <br>
                <p>จึงเรียนมาเพื่อทราบ</p>
                <p>ฝ่ายบริการลูกบ้าน,</p>
                <p><b>บริษัท บ้านดี จำกัด</b><br>
                โทรศัพท์: 12-343-45678<br>
                อีเมล: support@bandee.com</p>
                `,
            });
            success++;
        } catch (error) {
            console.error(`Error sending bill email to ${user.email}:`, error.message);
        }
    }
    console.log(`Bill emails sent: ${success}/${result.recordset.length}`);
};

// ออกบิลของเดือนนี้ให้ลูกบ้านที่ยังอาศัยอยู่ (SendBill กันออกซ้ำในเดือนเดียวกันอยู่แล้ว) คืนรายการบิลที่สร้างใหม่
// userId ต้องเป็น User_ID ของผู้จัดการหมู่บ้าน (ตาราง villagemanager)
const createBills = async (userId) => {
    const conn = await sql.connect(config);
    const transaction = new sql.Transaction(conn);
    await transaction.begin();
    try {
        const Bill = await transaction.request()
            .input('userId', sql.Int, userId)
            .execute('SendBill');
        // commit ก่อนส่งอีเมล เพื่อไม่ให้ transaction ค้างระหว่างรอ SMTP
        await transaction.commit();
        return Bill.recordset || [];
    } catch (err) {
        try { await transaction.rollback(); } catch (_) { /* transaction จบไปแล้ว */ }
        throw err;
    }
};

module.exports.createBills = createBills;
module.exports.sendBillEmails = sendBillEmails;

module.exports.FeeBill = async (req, res) => {
    let bills;
    try {
        bills = await createBills(req.user.User_ID);
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (bills.length === 0) {
        return res.status(409).json({ message: 'ไม่มีบิลใหม่ให้สร้าง (เดือนนี้ออกบิลไปแล้ว หรือคุณไม่มีสิทธิ์ออกบิล)' });
    }

    res.status(200).json({
        message: `สร้างบิลเรียบร้อยแล้ว จำนวน ${bills.length} รายการ (กำลังส่งอีเมลแจ้งเตือน)`,
        data: bills,
    });

    // ส่งอีเมลเบื้องหลัง (ไม่กระทบผลของการสร้างบิล)
    sendBillEmails(bills.map(b => b.Pay_ID)).catch(e => console.error('Bill email job failed:', e.message));
};


module.exports.ChangePayrate = async (req, res) => {
    try {
        const { House_Size, Land_size, FeeRate, Fine } = req.body || {};

        if (!HOUSE_SIZES.includes(House_Size)) {
            return res.status(400).json({ message: `House_Size must be one of ${HOUSE_SIZES.join(', ')}` });
        }
        const land = positiveInt(Land_size);
        const rate = positiveMoney(FeeRate);
        const fine = Number(Fine);
        if (!land || !rate || !Number.isFinite(fine) || fine < 0 || fine >= 1e9 || Fine === '' || Fine === null) {
            return res.status(400).json({ message: 'Land_size and FeeRate must be greater than 0, Fine must be 0 or more' });
        }

        const conn = await sql.connect(config);
        const Payrate = await conn.request()
            .input('House_Size', sql.VarChar, House_Size)
            .input('Land_size', sql.Int, land)
            .input('FeeRate', sql.Money, rate)
            .input('Fine', sql.Money, Math.round(fine * 100) / 100)
            .query(`
                UPDATE PriceandSize
                SET Land_size = @Land_size, FeeRate = @FeeRate ,  Fine = @Fine
                WHERE House_Size = @House_Size
            `);

        if (Payrate.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'No record updated, possibly House_Size not found' });
        }

        res.status(200).json({ message: 'Update successfully' });

    } catch (error) {
        console.error('error message', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports.Fee = async (req, res) => {
    try {
        const conn = await sql.connect(config);
        const House_Size = req.query.House_Size;

        if (!House_Size) {
            return res.status(400).json({ message: 'House_Size is required' });
        }

        const result = await conn.request()
            .input('House_Size', sql.VarChar, String(House_Size))
            .query('SELECT * FROM PriceandSize WHERE House_Size = @House_Size');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'No data found for the given House_Size' });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to get data');
    }
};

module.exports.GetAllFee = async (req, res) => {
    try {
        const conn = await sql.connect(config);
        const result = await conn.request()
            .query('select * from PriceandSize');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to get ');
    }
};


// ใบเสร็จ: เจ้าของบิล หรือ admin เท่านั้น
module.exports.getReceipt = async (req, res) => {
    try {
        const payId = positiveInt(req.params.payId);
        if (!payId) {
            return res.status(400).json({ message: 'Invalid payId' });
        }

        var pool = await sql.connect(config);
        const result = await pool.request()
            .input('payId', sql.Int, payId)
            .query("SELECT * FROM ReceiptView WHERE Pay_ID = @payId");

        const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
        const rows = isAdmin ? result.recordset : result.recordset.filter(r => r.User_ID === req.user.User_ID);

        if (rows.length === 0) {
            return res.status(404).send('Not found');
        }

        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.GetIncome = async (req, res) => {
    try {
        const conn = await sql.connect(config);
        const result = await conn.request()
        .query(`SELECT
                DATENAME(MONTH, Receipt_Date) AS Month,
                SUM(Receipt_Total) AS TotalAmount
                FROM
                ReceiptView
                GROUP BY
                DATENAME(MONTH, Receipt_Date),
                MONTH(Receipt_Date)
                ORDER BY
                MONTH(Receipt_Date);
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to get ');
    }
};

module.exports.LastPaid = async (req, res) => {
    try {
        const { page, limit, offset } = paging(req.query, 5);

        const conn = await sql.connect(config);

        const result = await conn.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT *,
                DATEADD(HOUR, -7, Paid_Date) AS Adjusted_Paid_Date
                FROM Payment
                ORDER BY Paid_ID DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;
            `);

        const countResult = await conn.request()
            .query(`SELECT COUNT(*) AS total FROM Payment`);

        const total = countResult.recordset[0].total;
        const totalPages = Math.ceil(total / limit);

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

module.exports.SearchPaymentHistory = async (req, res) => {
    try {
        const month = req.query.month === undefined ? null : positiveInt(req.query.month);
        const year = req.query.year === undefined ? null : positiveInt(req.query.year);
        const userId = req.user.User_ID;

        if ((req.query.month !== undefined && (month === null || month > 12)) ||
            (req.query.year !== undefined && year === null)) {
            return res.status(400).json({ message: 'Invalid month or year' });
        }

        let pool = await sql.connect(config);

        const result = await pool.request()
            .input('month', sql.Int, month)
            .input('year', sql.Int, year)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT * FROM PaymentHistoryView
                WHERE (MONTH(Pay_Date) = @month OR @month IS NULL)
                AND (YEAR(Pay_Date) = @year OR @year IS NULL)
                AND User_ID = @userId
                ORDER BY Pay_ID DESC
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error searching payment history:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
