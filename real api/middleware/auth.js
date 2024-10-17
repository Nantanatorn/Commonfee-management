const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key'; // เปลี่ยนเป็นคีย์จริงของคุณ

// Middleware สำหรับตรวจสอบ JWT token
exports.auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'
    
    if (token == null) return res.status(401).json({message:'no Token '}); // ไม่มี token

    jwt.verify(token, 'jwtsecret', (err, decoded) => {
        if (err) {
            return res.status(403).json({message:'invaild token'});
        }  // Token ไม่ถูกต้อง
        console.log('Decoded JWT:', decoded); 
        req.user = decoded.user;
        console.log('Authenticated User:', req.user);
        next(); 
    });
};
// Middleware for role-based access control
exports.checkRole = (role) => {
    return (req, res, next) => {
        console.log('Expected Role:', role); // Debugging
        console.log('User Role:', req.user.role); // Debugging

        if (req.user.role !== role) {
            console.log('User does not have the required role');
            return res.status(403).json({ message: 'This is for admin only' });
        }
        next();
    };
};