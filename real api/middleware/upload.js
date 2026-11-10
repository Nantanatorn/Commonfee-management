const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
    // ใช้ path เทียบกับไฟล์นี้ ไม่ขึ้นกับว่ารัน node จากโฟลเดอร์ไหน (controller ยังเก็บชื่อเป็น public/xxx เหมือนเดิม)
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public')),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

// รับเฉพาะไฟล์รูปภาพ ขนาดไม่เกิน 5MB
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.mimetype.startsWith('image/') && ALLOWED_EXT.includes(ext)) {
            return cb(null, true);
        }
        cb(new Error('INVALID_FILE_TYPE'));
    }
});

// แปลง error ของ multer ให้ตอบ 400 แทน 500
const handleUpload = (field) => (req, res, next) => {
    upload.single(field)(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large (max 5MB)' });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }
        return res.status(400).json({ message: 'Upload failed' });
    });
};

// ---------- สลิปการชำระเงิน ----------
// เก็บนอกโฟลเดอร์ public (ไม่เปิดให้เข้าถึงโดยตรง) ดูได้ผ่าน GET /slip/:payId เมื่อ login เท่านั้น
const SLIP_DIR = path.join(__dirname, '..', 'private', 'slips');

const slipStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(SLIP_DIR, { recursive: true }, (err) => cb(err, SLIP_DIR));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `slip-${Number(req.params.payId) || 0}-${Date.now()}${ext}`);
    }
});

const slipUpload = multer({
    storage: slipStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.mimetype.startsWith('image/') && ALLOWED_EXT.includes(ext)) {
            return cb(null, true);
        }
        cb(new Error('INVALID_FILE_TYPE'));
    }
});

const handleSlipUpload = (field) => (req, res, next) => {
    slipUpload.single(field)(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'ไฟล์ใหญ่เกินไป (ไม่เกิน 5MB)' });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ message: 'แนบได้เฉพาะไฟล์รูปภาพ (jpg, png, webp, gif)' });
        }
        return res.status(400).json({ message: 'อัปโหลดไฟล์ไม่สำเร็จ' });
    });
};

module.exports = { handleUpload, handleSlipUpload, SLIP_DIR };
