const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET is missing or too short (min 16 chars). Set it in .env');
}

module.exports.JWT_SECRET = JWT_SECRET;

// ตรวจสอบ JWT token แล้วใส่ payload ลง req.user
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

    if (!token) return res.status(401).json({ message: 'No Token' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded.user;
        next();
    });
};

// ตรวจสอบสิทธิ์ตาม role (ไม่สนตัวพิมพ์เล็ก/ใหญ่ เพราะข้อมูลมีทั้ง 'admin' และ 'Admin')
const checkRole = (role) => (req, res, next) => {
    const userRole = String(req.user?.role || '').toLowerCase();
    if (userRole !== String(role).toLowerCase()) {
        return res.status(403).json({ message: 'Permission denied' });
    }
    next();
};

module.exports.verifyToken = verifyToken;
module.exports.auth = verifyToken; // ชื่อเดิม เผื่อมีโค้ดอื่นเรียกใช้
module.exports.checkRole = checkRole;
// ใช้ตัวนี้กับ route ที่เป็นของ admin เท่านั้น
module.exports.adminOnly = [verifyToken, checkRole('admin')];
