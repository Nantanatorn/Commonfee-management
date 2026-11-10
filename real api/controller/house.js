const config = require("../config");
const sql = require("mssql");

const ALLOWED_SIZES = ['S', 'M', 'L'];

module.exports.Addhouse = async (req, res) => {
    const defaultStatus = 'Empty';

    try {
        const { House_number, House_Size } = req.body || {};

        if (typeof House_number !== 'string' || !House_number.trim() || House_number.trim().length > 10) {
            return res.status(400).json({ message: 'House_number is required (max 10 characters)' });
        }
        if (!ALLOWED_SIZES.includes(House_Size)) {
            return res.status(400).json({ message: `House_Size must be one of ${ALLOWED_SIZES.join(', ')}` });
        }

        const conn = await sql.connect(config);

        const exists = await conn.request()
            .input('House_number', sql.NVarChar, House_number.trim())
            .query('SELECT 1 AS found FROM House WHERE RTRIM(House_number) = @House_number');
        if (exists.recordset.length > 0) {
            return res.status(400).json({ message: 'House already exists.' });
        }

        await conn.request()
            .input('House_number', sql.NVarChar, House_number.trim())
            .input('House_Size', sql.NVarChar, House_Size)
            .input('House_status', sql.NVarChar, defaultStatus)
            .query('INSERT INTO House (House_number, House_Size, House_status) VALUES (@House_number, @House_Size, @House_status)');

        res.status(201).json({ message: 'House added successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Fail to add house');
    }
};

module.exports.GetEmptyHouse = async (req, res) => {
    try {
        const conn = await sql.connect(config);
        const result = await conn.request()
            .query("SELECT * FROM House WHERE House_status = 'Empty' ORDER BY House_No ASC;");

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail');
    }
};

module.exports.GetHouseWithResident = async (req, res) => {
    try {
        const conn = await sql.connect(config);

        // แสดงเฉพาะลูกบ้านที่ยังอาศัยอยู่ (ย้ายออกแล้วไม่นับ) และบิลล่าสุดของแต่ละคนเพียงแถวเดียว (เดิม LEFT JOIN ทุกบิลทำให้แถวซ้ำ)
        const result = await conn.request()
            .query(`SELECT dbo.Resident.R_ID,
                dbo.Resident.R_Lastname,
                dbo.Resident.R_Firstname,
                dbo.Resident.status,
                dbo.UserAccount.phone,
                dbo.House.House_number,
                dbo.House.House_No,
                LastPay.Pay_Status,
                LastPay.Pay_ID
                FROM dbo.Resident
                INNER JOIN dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID
                INNER JOIN dbo.House ON dbo.Resident.House_number = dbo.House.House_number
                OUTER APPLY (
                    SELECT TOP 1 p.Pay_Status, p.Pay_ID
                    FROM dbo.PayCommonfee p
                    WHERE p.R_ID = dbo.Resident.R_ID
                    ORDER BY p.Pay_ID DESC
                ) AS LastPay
                WHERE RTRIM(dbo.Resident.status) = 'Living'
                ORDER BY LastPay.Pay_ID DESC;`);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fail');
    }
};
