/*
 * สร้างข้อมูลสมมติ (mock) สำหรับสาธิตระบบ -- หมู่บ้านตัวอย่าง 20 หลัง
 *
 * ⚠️ สคริปต์นี้ "ลบข้อมูลเดิมทั้งหมด" (บิล ใบเสร็จ คำร้อง ข่าว ลูกบ้าน บัญชีลูกบ้าน บ้าน) แล้วสร้างใหม่
 *    เก็บเฉพาะบัญชี admin และ villagemanager (เปลี่ยนชื่อ/อีเมล/เบอร์เป็นข้อมูลสมมติ และตั้งรหัสผ่านเป็น 1234; username เดิมคงไว้)
 *    ถ้ายังไม่มี admin (เช่นฐานข้อมูลใหม่จาก sql/schema.sql) จะสร้างให้: username admin / รหัสผ่าน 1234
 *    สำรองฐานข้อมูลก่อนรันเสมอ
 *
 * วิธีรัน (ที่โฟลเดอร์ "real api"):   node sql/seed-mock.js --yes
 *
 * ข้อมูลที่ได้
 *  - บ้าน 20 หลัง (42/1 - 42/20): S 8 หลัง, M 8 หลัง, L 4 หลัง
 *  - ลูกบ้านที่อาศัยอยู่ 16 หลัง, บ้านว่าง 4 หลัง (42/5, 42/11, 42/14, 42/20), ลูกบ้านที่ย้ายออกแล้ว 1 คน (42/3)
 *  - บิล 4 เดือนล่าสุด มีทั้ง Paid / Pending / Overdue (+ค่าปรับ) พร้อมประวัติชำระและใบเสร็จ
 *  - คำร้อง 10 รายการ ข่าวประกาศ 5 รายการ
 *  - อีเมลทั้งหมดเป็น @example.com (โดเมนสำหรับตัวอย่าง ส่งอีเมลจริงไปไม่ถึงใคร)
 *  - ทุกบัญชี (ลูกบ้านและ admin) ใช้รหัสผ่าน  1234  ชื่อผู้ใช้ลูกบ้านเช่น somchai.j, somying.r (ดู LIVING_USERNAMES)
 *    boonlert.r คือลูกบ้านที่ย้ายออกแล้ว (ยังล็อกอินดูประวัติเก่าได้)
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const sql = require('mssql');
const config = require('../config');

if (!process.argv.includes('--yes')) {
    console.error('สคริปต์นี้จะลบข้อมูลเดิมทั้งหมดในฐานข้อมูล ถ้าแน่ใจให้รันใหม่ด้วย:  node sql/seed-mock.js --yes');
    process.exit(1);
}

const MOCK_PASSWORD = '1234';   // ระบบจำลอง: ทุกบัญชีใช้รหัสผ่านเดียวกัน (ห้ามใช้แบบนี้กับระบบจริง)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1234';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ---------- ข้อมูลตั้งต้น ----------
const HOUSE_COUNT = 20;
const sizeOf = (n) => (n <= 8 ? 'S' : n <= 16 ? 'M' : 'L');
const EMPTY_HOUSES = [5, 11, 14, 20];

// [ชื่อ, นามสกุล, บ้าน, วันเข้าอยู่ (ปี-เดือน-วัน หรือ 'M-n' = n เดือนก่อนต้นเดือนนี้)]
const LIVING = [
    ['สมชาย', 'ใจดี', 1, '2025-03-10'],
    ['สมหญิง', 'รักสงบ', 2, '2025-04-02'],
    ['ประเสริฐ', 'มั่นคง', 3, 'M-1'],          // เจ้าของใหม่ของบ้านที่คนเก่าย้ายออก
    ['วิไล', 'สุขสันต์', 4, '2025-05-20'],
    ['ธนากร', 'เจริญผล', 6, '2025-06-15'],
    ['กาญจนา', 'พึ่งบุญ', 7, '2025-07-01'],
    ['อนุชา', 'แก้วมณี', 8, '2025-08-12'],
    ['ปิยะดา', 'ศรีทอง', 9, '2025-09-05'],
    ['สุรชัย', 'บุญมา', 10, '2025-10-18'],
    ['นภาพร', 'ทองดี', 12, '2025-11-22'],
    ['วีระ', 'สายชล', 13, '2026-01-08'],
    ['รัตนา', 'พงษ์ไทย', 15, '2026-02-14'],
    ['ชัยวัฒน์', 'เพชรรัตน์', 16, '2026-03-03'],
    ['มาลี', 'จันทร์เพ็ญ', 17, '2026-04-25'],
    ['ณัฐพล', 'วงศ์สกุล', 18, 'M-3'],
    ['อรทัย', 'สว่างวงศ์', 19, 'M-2'],
];
const MOVED = ['บุญเลิศ', 'รุ่งเรือง', 3, '2025-02-01']; // ย้ายออกก่อนเดือน M-1

// ชื่อผู้ใช้ (ใช้ตัวพิมพ์เล็ก รูปแบบ ชื่อ.อักษรแรกของนามสกุล) ตามลำดับของ LIVING
const LIVING_USERNAMES = [
    'somchai.j', 'somying.r', 'prasert.m', 'wilai.s', 'thanakorn.c', 'kanchana.p', 'anucha.k', 'piyada.s',
    'surachai.b', 'napaporn.t', 'weera.s', 'rattana.p', 'chaiwat.p', 'malee.c', 'nattapon.w', 'orathai.s',
];
const MOVED_USERNAME = 'boonlert.r';

const PETITIONS = [
    // [index ลูกบ้าน (0-15), ประเภท, หัวข้อ, รายละเอียด, วันก่อนวันนี้, สถานะ]
    [0, 'Repair', 'ไฟส่วนกลางหน้าซอยดับ', 'โคมไฟเสาที่ 3 หน้าซอย 42/1 ไม่ติดมาหลายวัน ทางเดินมืดมาก', 80, 'Finish'],
    [3, 'Repair', 'ท่อน้ำรั่วหน้าบ้าน', 'มีน้ำซึมออกจากท่อใต้ถนนหน้าบ้าน ทำให้พื้นเปียกตลอดเวลา', 65, 'Finish'],
    [5, 'Normal', 'สอบถามการขอสำเนาใบเสร็จ', 'ต้องการสำเนาใบเสร็จค่าส่วนกลางย้อนหลัง 6 เดือน ใช้ประกอบการยื่นเอกสาร', 58, 'Finish'],
    [8, 'Repair', 'ถนนชำรุดเป็นหลุม', 'ถนนช่วงหน้าสโมสรเป็นหลุมลึก ขับรถผ่านลำบากและเสี่ยงอันตราย', 44, 'Finish'],
    [2, 'Normal', 'ขอใช้พื้นที่ส่วนกลางจัดงาน', 'ขอใช้ลานอเนกประสงค์จัดงานวันเกิดบุตร วันเสาร์ที่ 15 ช่วงบ่าย', 33, 'Finish'],
    [10, 'Repair', 'ประตูรั้วหมู่บ้านปิดไม่สนิท', 'ประตูทางเข้าหลักปิดไม่สนิท รปภ. แจ้งว่ามอเตอร์เสีย', 21, 'Ongoing'],
    [12, 'Normal', 'สุนัขจรจัดในซอย', 'พบสุนัขจรจัดหลายตัวเดินในซอยช่วงกลางคืน ขอให้ประสานหน่วยงานที่เกี่ยวข้อง', 14, 'Ongoing'],
    [6, 'Repair', 'ท่อระบายน้ำอุดตัน', 'ฝนตกแล้วน้ำท่วมขังหน้าบ้านนานหลายชั่วโมง น่าจะมีท่อระบายน้ำอุดตัน', 9, 'Ongoing'],
    [14, 'Normal', 'เสียงดังรบกวนช่วงดึก', 'มีเสียงดังจากการต่อเติมบ้านช่วงหลัง 3 ทุ่ม ขอให้ช่วยแจ้งเตือน', 5, 'Ongoing'],
    [9, 'Normal', 'ขอป้ายห้ามจอดรถ', 'มีรถบุคคลภายนอกมาจอดขวางหน้าบ้านบ่อยครั้ง ขอติดตั้งป้ายห้ามจอด', 2, 'Ongoing'],
];

const ANNOUNCEMENTS = [
    // [หัวข้อ, รายละเอียด, วันก่อนวันนี้, สถานะ, ไฟล์ภาพ, สีพื้น]
    ['ปิดสระว่ายน้ำเพื่อล้างทำความสะอาด', 'สระว่ายน้ำส่วนกลางจะปิดปรับปรุงและล้างทำความสะอาดวันที่ 20-22 ของเดือนนี้ ขออภัยในความไม่สะดวก', 3, 'Show', 'mock-announce-pool.svg', '#0ea5e9'],
    ['ประชุมใหญ่ลูกบ้านประจำปี', 'เชิญลูกบ้านทุกท่านเข้าร่วมประชุมใหญ่ประจำปี ณ สโมสรหมู่บ้าน เวลา 10.00 น. เพื่อรับทราบผลการดำเนินงานและงบประมาณ', 12, 'Show', 'mock-announce-meeting.svg', '#6366f1'],
    ['ปิดถนนซอย 2 เพื่อซ่อมผิวจราจร', 'วันที่ 5-6 จะมีการซ่อมผิวจราจรบริเวณซอย 2 ขอให้ลูกบ้านจอดรถภายในบ้านหรือบริเวณลานจอดส่วนกลางระหว่างนี้', 30, 'Show', 'mock-announce-road.svg', '#f59e0b'],
    ['กำหนดชำระค่าส่วนกลางประจำเดือน', 'ขอเรียนให้ลูกบ้านชำระค่าส่วนกลางภายในวันที่ 10 ของทุกเดือน หากเกินกำหนดจะมีค่าปรับตามข้อบังคับหมู่บ้าน', 45, 'Show', 'mock-announce-fee.svg', '#10b981'],
    ['ประกาศเก่า: งดใช้ฟิตเนสชั่วคราว', 'ฟิตเนสส่วนกลางงดให้บริการชั่วคราวเนื่องจากซ่อมอุปกรณ์ (ประกาศนี้ซ่อนแล้ว)', 90, 'Hide', 'mock-announce-fitness.svg', '#94a3b8'],
];

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };
const monthStart = (today, offset) => ymd(new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1 + offset, 1)));

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" fill="#e2e8f0"/>
  <circle cx="60" cy="46" r="22" fill="#94a3b8"/>
  <path d="M16 120c0-24 19-42 44-42s44 18 44 42z" fill="#94a3b8"/>
</svg>
`;
const bannerSvg = (title, color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="600" height="300">
  <rect width="600" height="300" fill="${color}"/>
  <circle cx="500" cy="60" r="120" fill="#ffffff" opacity="0.12"/>
  <circle cx="90" cy="270" r="140" fill="#ffffff" opacity="0.10"/>
  <text x="300" y="165" text-anchor="middle" font-family="'Noto Sans Thai', 'Sarabun', sans-serif" font-size="30" font-weight="bold" fill="#ffffff">${title}</text>
</svg>
`;

(async () => {
    const pool = await sql.connect(config);
    const today = (await pool.request().query('SELECT CONVERT(VARCHAR(10), GETDATE(), 23) AS d')).recordset[0].d;
    const hash = await bcrypt.hash(MOCK_PASSWORD, 10);

    // รูปสมมติ (เก็บใน public ให้ API เสิร์ฟได้)
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'default-avatar.svg'), avatarSvg);
    for (const a of ANNOUNCEMENTS) {
        fs.writeFileSync(path.join(PUBLIC_DIR, a[4]), bannerSvg(a[0], a[5]));
    }

    const entryDate = (v) => (v.startsWith('M-') ? monthStart(today, -Number(v.slice(2))) : v);

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
        const run = (text, params = {}) => {
            const r = new sql.Request(tx);
            for (const [k, v] of Object.entries(params)) r.input(k, v.type, v.value);
            return r.query(text);
        };
        const P = (type, value) => ({ type, value });

        // ---- 1) ล้างข้อมูลเดิม (ตามลำดับ FK) ----
        for (const t of ['Receipt', 'Payment', 'PayCommonfee', 'Petition', 'Announcement', 'Resident']) {
            await run(`DELETE FROM ${t}`);
        }
        await run(`DELETE FROM UserAccount WHERE LOWER(role) <> 'admin'`);
        await run(`DELETE FROM House WHERE House_No > ${HOUSE_COUNT}`);
        for (const t of ['Receipt', 'Payment', 'PayCommonfee', 'Petition', 'Announcement', 'Resident']) {
            await run(`DBCC CHECKIDENT ('${t}', RESEED, 0) WITH NO_INFOMSGS`);
        }

        // ---- 2) บ้าน 20 หลัง ----
        // ฐานข้อมูลใหม่ (จาก sql/schema.sql) ยังไม่มีบ้าน -> เพิ่มให้; ถ้ามีอยู่แล้วให้ปรับขนาด/สถานะ
        for (let n = 1; n <= HOUSE_COUNT; n++) {
            await run(`IF EXISTS (SELECT 1 FROM House WHERE House_No = @n)
                            UPDATE House SET House_Size = @size, House_status = 'Empty' WHERE House_No = @n
                        ELSE
                            INSERT INTO House (House_number, House_Size, House_status) VALUES (@hn, @size, 'Empty')`,
                { size: P(sql.VarChar, sizeOf(n)), n: P(sql.Int, n), hn: P(sql.NChar, `42/${n}`) });
        }
        // กันกรณี House_No ไม่ครบ 1-20 (ไม่ควรเกิด)
        const houses = (await run(`SELECT House_No, RTRIM(House_number) AS hn FROM House ORDER BY House_No`)).recordset;
        if (houses.length !== HOUSE_COUNT) throw new Error(`คาดว่ามีบ้าน ${HOUSE_COUNT} หลัง แต่พบ ${houses.length}`);
        const houseNo = (n) => houses.find((h) => h.House_No === n).hn;

        // ---- 3) admin: ถ้ายังไม่มี ให้สร้าง; ถ้ามีแล้วเปลี่ยนเป็นข้อมูลสมมติ (คง username/password เดิม) ----
        const adminCount = (await run(`SELECT COUNT(*) AS n FROM UserAccount WHERE LOWER(role) = 'admin'`)).recordset[0].n;
        if (adminCount === 0) {
            const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            const a = await run(`INSERT INTO UserAccount (User_Firstname, User_Lastname, username, email, password, phone, role, IDcard)
                                 VALUES (N'ผู้จัดการ', N'หมู่บ้านตัวอย่าง 1', @un, N'admin1@example.com', @pw, N'0800000901', N'admin', N'9900000000001');
                                 SELECT CAST(SCOPE_IDENTITY() AS INT) AS User_ID;`, {
                un: P(sql.NVarChar, ADMIN_USERNAME), pw: P(sql.NVarChar, adminHash),
            });
            await run(`INSERT INTO villagemanager (manager_name, User_ID) VALUES (N'Admin', @uid)`, { uid: P(sql.Int, a.recordset[0].User_ID) });
            console.log(`สร้างบัญชี admin ใหม่: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
        }
        const admins = (await run(`SELECT User_ID FROM UserAccount WHERE LOWER(role) = 'admin' ORDER BY User_ID`)).recordset;
        for (let i = 0; i < admins.length; i++) {
            await run(`UPDATE UserAccount
                       SET User_Firstname = @f, User_Lastname = @l, email = @e, phone = @p, IDcard = @id, User_image = @img, password = @pw
                       WHERE User_ID = @uid`, {
                pw: P(sql.NVarChar, hash),
                f: P(sql.NVarChar, 'ผู้จัดการ'), l: P(sql.NVarChar, `หมู่บ้านตัวอย่าง ${i + 1}`),
                e: P(sql.NVarChar, `admin${i + 1}@example.com`), p: P(sql.NVarChar, `080000090${i + 1}`),
                id: P(sql.NVarChar, `99000000000${pad(i + 1)}`), img: P(sql.NVarChar, 'public/default-avatar.svg'),
                uid: P(sql.Int, admins[i].User_ID),
            });
        }
        const manager = (await run(`SELECT TOP 1 manager_ID FROM villagemanager ORDER BY manager_ID`)).recordset[0];
        if (!manager) throw new Error('ไม่พบ villagemanager');

        // ---- 4) ลูกบ้าน (คนที่ย้ายออก + คนที่อาศัยอยู่) ----
        const people = [{ first: MOVED[0], last: MOVED[1], house: MOVED[2], entry: MOVED[3], status: 'Moved', moved: true },
            ...LIVING.map((p) => ({ first: p[0], last: p[1], house: p[2], entry: entryDate(p[3]), status: 'Living', moved: false }))];

        let livingSeq = 0;
        for (let i = 0; i < people.length; i++) {
            const p = people[i];
            const k = pad(i + 1);
            const code = p.moved ? MOVED_USERNAME : LIVING_USERNAMES[livingSeq++];
            if (!code) throw new Error('ชื่อผู้ใช้ไม่พอสำหรับลูกบ้านทุกคน');
            const u = await run(`INSERT INTO UserAccount (User_Firstname, User_Lastname, username, email, password, phone, role, IDcard, User_image)
                                 VALUES (@f, @l, @un, @e, @pw, @ph, 'Resident', @id, 'public/default-avatar.svg');
                                 SELECT CAST(SCOPE_IDENTITY() AS INT) AS User_ID;`, {
                f: P(sql.NVarChar, p.first), l: P(sql.NVarChar, p.last), un: P(sql.NVarChar, code),
                e: P(sql.NVarChar, `${code}@example.com`), pw: P(sql.NVarChar, hash),
                ph: P(sql.NVarChar, `08000001${k}`), id: P(sql.NVarChar, `11000000000${k}`),
            });
            p.userId = u.recordset[0].User_ID;
            const r = await run(`INSERT INTO Resident (User_ID, R_Firstname, R_Lastname, EntryDate, House_number, status)
                                 OUTPUT INSERTED.R_ID
                                 VALUES (@uid, @f, @l, CONVERT(DATETIME, @d, 126), @hn, @st)`, {
                uid: P(sql.Int, p.userId), f: P(sql.NVarChar, p.first), l: P(sql.NVarChar, p.last),
                d: P(sql.VarChar, p.entry + 'T09:00:00'), hn: P(sql.NChar, houseNo(p.house)), st: P(sql.Char, p.status),
            });
            p.rid = r.recordset[0].R_ID;
        }
        const living = people.filter((p) => !p.moved);
        for (const p of living) {
            await run(`UPDATE House SET House_status = 'Full' WHERE House_No = @n`, { n: P(sql.Int, p.house) });
        }
        if (EMPTY_HOUSES.some((n) => living.some((p) => p.house === n))) throw new Error('บ้านว่างมีลูกบ้านอาศัยอยู่');

        // ---- 5) บิล 4 เดือนล่าสุด + ประวัติชำระ + ใบเสร็จ ----
        const months = [-3, -2, -1, 0].map((o) => monthStart(today, o));
        let billCount = 0, paidCount = 0, pendingCount = 0, overdueCount = 0;

        for (let m = 0; m < months.length; m++) {
            const billDate = months[m];
            for (let i = 0; i < people.length; i++) {
                const p = people[i];
                const livingIdx = living.indexOf(p); // -1 = ย้ายออกแล้ว
                // ออกบิลเฉพาะช่วงที่อาศัยอยู่
                if (p.entry > addDays(billDate, 9)) continue;
                if (p.moved && m >= 2) continue; // ย้ายออกก่อนเดือน M-1

                let status = 'Paid', paidAfter = 1 + ((i * 3) % 8), fine = 0;
                if (!p.moved) {
                    if (m === 2) {            // เดือนที่แล้ว
                        if ([2, 7, 13].includes(livingIdx)) status = 'Overdue';
                        else if (livingIdx === 5) { paidAfter = 16; fine = 50; }
                    } else if (m === 3) {     // เดือนนี้
                        if ([1, 8].includes(livingIdx)) status = 'Pending';
                        else if (livingIdx % 3 !== 0) status = 'Overdue';
                        else paidAfter = 1 + ((i * 2) % 7);
                    } else if (m < 2 && [4, 9].includes(livingIdx)) { paidAfter = 14; fine = 50; }
                }
                // บิลเดือนนี้ที่ยังไม่เกินกำหนด (วันที่ 11) ไม่มีค่าปรับ; บิลเดือนก่อนที่ค้างเกินกำหนดมีค่าปรับ 50
                if (status === 'Overdue' && addDays(billDate, 10) < today) fine = 50;
                // วันที่ชำระต้องไม่เกินวันนี้
                let paidDate = addDays(billDate, paidAfter);
                if (status === 'Paid' && paidDate > today) paidDate = today;

                const bill = await run(`INSERT INTO PayCommonfee (R_ID, manager_ID, Pay_Date, Pay_Status, Pay_Fine)
                                        VALUES (@rid, @mgr, CAST(@d AS DATE), @st, @fine);
                                        SELECT CAST(SCOPE_IDENTITY() AS INT) AS Pay_ID;`, {
                    rid: P(sql.Int, p.rid), mgr: P(sql.Int, manager.manager_ID), d: P(sql.VarChar, billDate),
                    st: P(sql.NVarChar, status), fine: P(sql.Money, fine),
                });
                const payId = bill.recordset[0].Pay_ID;
                billCount++;
                if (status === 'Overdue') overdueCount++;
                if (status === 'Pending') pendingCount++;
                if (status !== 'Paid') continue;
                paidCount++;

                // ยอดเงินคำนวณโดย trigger FeePayment ตอน INSERT (ขนาดที่ดิน x อัตรา)
                const amt = (await run(`SELECT Pay_Amount FROM PayCommonfee WHERE Pay_ID = @id`, { id: P(sql.Int, payId) })).recordset[0].Pay_Amount;
                const pay = await run(`INSERT INTO Payment (R_ID, R_Firstname, R_Lastname, Pay_ID, Paid_Date, Paid_Amount, Paid_Fine)
                                       OUTPUT INSERTED.Paid_ID
                                       VALUES (@rid, @f, @l, @pid, CONVERT(DATETIME, @d, 126), @amt, @fine)`, {
                    rid: P(sql.Int, p.rid), f: P(sql.NVarChar, p.first), l: P(sql.NVarChar, p.last), pid: P(sql.Int, payId),
                    d: P(sql.VarChar, paidDate + 'T10:30:00'), amt: P(sql.Money, amt), fine: P(sql.Money, fine),
                });
                await run(`INSERT INTO Receipt (Paid_ID, R_ID, R_Firstname, R_Lastname, House_number, Receipt_Date, Receipt_Total)
                           VALUES (@paid, @rid, @f, @l, @hn, CONVERT(DATETIME, @d, 126), @total)`, {
                    paid: P(sql.Int, pay.recordset[0].Paid_ID), rid: P(sql.Int, p.rid), f: P(sql.NVarChar, p.first),
                    l: P(sql.NVarChar, p.last), hn: P(sql.NChar, houseNo(p.house)),
                    d: P(sql.VarChar, paidDate + 'T10:30:00'), total: P(sql.Money, Number(amt) + fine),
                });
            }
        }

        // ---- 6) คำร้อง (trigger Pettition เติม R_ID / House_number ให้) ----
        for (const [idx, type, title, detail, daysAgo, status] of PETITIONS) {
            await run(`INSERT INTO Petition (petition_Title, petition_detail, petition_status, petition_Type, petition_Date, User_ID)
                       VALUES (@t, @d, @s, @ty, CAST(@date AS DATE), @uid)`, {
                t: P(sql.NVarChar, title), d: P(sql.NVarChar, detail), s: P(sql.Char, status), ty: P(sql.NChar, type),
                date: P(sql.VarChar, addDays(today, -daysAgo)), uid: P(sql.Int, living[idx].userId),
            });
        }

        // ---- 7) ข่าวประกาศ ----
        for (const [title, detail, daysAgo, status, image] of ANNOUNCEMENTS) {
            await run(`INSERT INTO Announcement (manager_ID, Announce_Date, Announce_image, Announce_Title, Announce_Detail, Announce_Status)
                       VALUES (@mgr, CONVERT(DATETIME, @d, 126), @img, @t, @det, @st)`, {
                mgr: P(sql.Int, manager.manager_ID), d: P(sql.VarChar, addDays(today, -daysAgo) + 'T09:00:00'),
                img: P(sql.NVarChar, `public/${image}`), t: P(sql.NVarChar, title), det: P(sql.NVarChar, detail),
                st: P(sql.NChar, status),
            });
        }

        await tx.commit();
        console.log(`เสร็จแล้ว (วันที่อ้างอิง ${today})`);
        console.log(`  บ้าน ${HOUSE_COUNT} หลัง | ลูกบ้านอาศัยอยู่ ${living.length} | ย้ายออก 1`);
        console.log(`  บิล ${billCount} (Paid ${paidCount}, Pending ${pendingCount}, Overdue ${overdueCount})`);
        console.log(`  คำร้อง ${PETITIONS.length} | ข่าว ${ANNOUNCEMENTS.length}`);
        console.log(`  ลูกบ้านล็อกอิน: ${LIVING_USERNAMES[0]} ... (ดูรายชื่อใน LIVING_USERNAMES) / รหัสผ่าน ${MOCK_PASSWORD}`);
    } catch (err) {
        await tx.rollback();
        console.error('ผิดพลาด -- ย้อนกลับทั้งหมดแล้ว ไม่มีข้อมูลถูกเปลี่ยน:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.close();
    }
})().catch((e) => { console.error(e.message); process.exit(1); });
