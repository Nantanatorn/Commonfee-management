// helper สำหรับ validate ค่าที่รับจาก client

// แปลง page/limit ให้เป็นค่าที่ปลอดภัย (page >= 1, 1 <= limit <= max)
exports.paging = (query, defaultLimit = 10, maxLimit = 100) => {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;
    return { page, limit, offset: (page - 1) * limit };
};

// คืนค่า integer บวก หรือ null ถ้าไม่ใช่
exports.positiveInt = (value) => {
    if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
    const n = Number(value);
    return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null;
};

// คืนค่าตัวเลขที่ > 0 และจำกัดจำนวนเต็ม/ทศนิยมไม่เกิน 2 ตำแหน่ง หรือ null
exports.positiveMoney = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 && n < 1e9 ? Math.round(n * 100) / 100 : null;
};
