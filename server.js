const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); 
const multer = require('multer');
const fs = require('fs');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------
// 1. إعدادات البيئة
// -----------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aqarakproperty@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Aqarak@123";
const SALT_ROUNDS = 10;

// 🛑 ضع رابط الويب هوك هنا مباشرة
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1442988734365831183/zNYS7qewKwW3Y6plEd_rt2FepU5Nh6rVZS6nQDo9PBqvjROc1msPZ3kqyvohx86h1cLW";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("❌ CRITICAL ERROR: Cloudinary keys are missing!");
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// -----------------------------------------------------
// 2. قاعدة البيانات
// -----------------------------------------------------

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

dbPool.connect().then(client => {
    console.log("✅ Connected to PostgreSQL!");
    client.release();
}).catch(err => console.error("❌ DB Error:", err.message));

function pgQuery(sql, params = []) {
    return dbPool.query(sql, params);
}

function safeInt(value) {
    const MAX_INT = 2147483647; 
    const num = parseInt(value);
    if (isNaN(num)) return 0;
    return num > MAX_INT ? MAX_INT : num;
}

// 🔔 دالة إرسال إشعار إلى ديسكورد (تم نقلها للخارج لتكون عامة)
async function sendDiscordNotification(title, fields, color = 3447003, imageUrl = null) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("ضع_رابط")) {
        console.log("⚠️ Discord Webhook URL is missing.");
        return;
    }

    const embed = {
        title: title,
        color: color,
        fields: fields,
        footer: { text: "Aqarak Bot 🏠" },
        timestamp: new Date().toISOString()
    };

    if (imageUrl) embed.image = { url: imageUrl };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
        console.log("✅ Discord notification sent!");
    } catch (error) {
        console.error("❌ Failed to send Discord notification:", error.message);
    }
}

// إنشاء الجداول
async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS properties (
            id SERIAL PRIMARY KEY, title TEXT NOT NULL, price TEXT NOT NULL, "numericPrice" NUMERIC, 
            rooms INTEGER, bathrooms INTEGER, area INTEGER, description TEXT, "imageUrl" TEXT, "imageUrls" TEXT, 
            type TEXT NOT NULL, "hiddenCode" TEXT UNIQUE, 
            "sellerName" TEXT, "sellerPhone" TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'user')`,
        `CREATE TABLE IF NOT EXISTS seller_submissions (id SERIAL PRIMARY KEY, "sellerName" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL, "propertyTitle" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "propertyPrice" TEXT NOT NULL, "propertyArea" INTEGER, "propertyRooms" INTEGER, "propertyBathrooms" INTEGER, "propertyDescription" TEXT, "imagePaths" TEXT, "submissionDate" TEXT, status TEXT DEFAULT 'pending')`,
        `CREATE TABLE IF NOT EXISTS property_requests (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, specifications TEXT NOT NULL, "submissionDate" TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, property_id INTEGER NOT NULL, UNIQUE(user_email, property_id))`
    ];

    try {
        for (const query of queries) await pgQuery(query);
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "sellerName" TEXT`);
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "sellerPhone" TEXT`);
        console.log('✅ Tables synced.');
    } catch (err) {
        console.error('❌ Table Sync Error:', err);
    }
}
createTables();

// -----------------------------------------------------
// 3. إعدادات الرفع
// -----------------------------------------------------
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storageSeller = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'aqarak_submissions', format: async () => 'webp', public_id: (req, file) => `seller-${Date.now()}-${Math.round(Math.random() * 1E9)}` },
});
const uploadSeller = multer({ storage: storageSeller, limits: { fileSize: MAX_FILE_SIZE } });

const storageProperties = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'aqarak_properties', format: async () => 'webp', public_id: (req, file) => `property-${Date.now()}-${Math.round(Math.random() * 1E9)}` },
});
const uploadProperties = multer({ storage: storageProperties, limits: { fileSize: MAX_FILE_SIZE } });

async function deleteCloudinaryImages(imageUrls) {
    if (!imageUrls || !Array.isArray(imageUrls)) return;
    for (const url of imageUrls) {
        const match = url.match(/\/(aqarak_[a-z]+\/.+)\.webp/);
        if (match) try { await cloudinary.uploader.destroy(match[1]); } catch (e) {}
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// -----------------------------------------------------
// 4. مسارات API
// -----------------------------------------------------

// نشر الطلب (Admin)
app.post('/api/admin/publish-submission', async (req, res) => {
    const { submissionId, hiddenCode } = req.body;
    if (!submissionId || !hiddenCode) return res.status(400).json({ message: 'بيانات ناقصة' });

    try {
        const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]);
        const sub = subRes.rows[0];
        
        if (!sub) return res.status(404).json({ message: 'الطلب غير موجود' });

        const imageUrls = (sub.imagePaths || '').split(' | ').filter(Boolean);
        if (!imageUrls.length) return res.status(400).json({ message: 'لا توجد صور' });

        const sql = `INSERT INTO properties (
            title, price, "numericPrice", rooms, bathrooms, area, description, 
            "imageUrl", "imageUrls", type, "hiddenCode", 
            "sellerName", "sellerPhone"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`;
        
        const params = [
            sub.propertyTitle, sub.propertyPrice, 
            parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), 
            safeInt(sub.propertyRooms), safeInt(sub.propertyBathrooms), safeInt(sub.propertyArea), 
            sub.propertyDescription, imageUrls[0], JSON.stringify(imageUrls), 
            sub.propertyType, hiddenCode, sub.sellerName, sub.sellerPhone
        ];
        
        const result = await pgQuery(sql, params);
        await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]);

        res.status(201).json({ success: true, message: 'تم النشر بنجاح', id: result.rows[0].id });

    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ message: `الكود السري "${hiddenCode}" مستخدم بالفعل.` });
        throw err; 
    }
});

// إضافة عقار (Admin)
app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const files = req.files || [];
    const data = req.body;
    const cleanHiddenCode = data.hiddenCode ? data.hiddenCode.trim() : '';

    if (!data.title || !cleanHiddenCode) return res.status(400).json({ message: 'بيانات ناقصة' });
    if (!files.length) return res.status(400).json({ message: 'يجب رفع صورة' });

    const urls = files.map(f => f.path);
    
    const sql = `INSERT INTO properties (
        title, price, "numericPrice", rooms, bathrooms, area, description, 
        "imageUrl", "imageUrls", type, "hiddenCode",
        "sellerName", "sellerPhone"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`;
    
    const params = [
        data.title, data.price, parseFloat((data.price || '0').replace(/[^0-9.]/g, '')), 
        safeInt(data.rooms), safeInt(data.bathrooms), safeInt(data.area), 
        data.description, urls[0], JSON.stringify(urls), data.type, cleanHiddenCode,
        "الإدارة (يدوي)", ADMIN_EMAIL      
    ];

    try {
        const result = await pgQuery(sql, params);
        res.status(201).json({ success: true, message: 'تم النشر', id: result.rows[0].id });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ message: `الكود السري مستخدم بالفعل.` });
        throw err; 
    }
});

// تحديث عقار (Admin)
app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const propertyId = req.params.id;
    const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages } = req.body;
    const cleanHiddenCode = hiddenCode ? hiddenCode.trim() : '';

    let rawImages = existingImages;
    if (Array.isArray(rawImages)) rawImages = rawImages[0];
    let oldUrls = [];
    try { oldUrls = JSON.parse(rawImages || '[]'); } catch(e) {}

    const newUrls = req.files ? req.files.map(f => f.path) : [];
    const allUrls = [...oldUrls, ...newUrls];
    const mainUrl = allUrls.length ? allUrls[0] : null;

    const sql = `UPDATE properties SET title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11 WHERE id=$12`;
    const params = [title, price, parseFloat((price||'0').replace(/,/g,'')), safeInt(rooms), safeInt(bathrooms), safeInt(area), description, mainUrl, JSON.stringify(allUrls), type, cleanHiddenCode, propertyId];

    try {
        const result = await pgQuery(sql, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'غير موجود' });
        res.status(200).json({ message: 'تم التحديث' });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ message: `الكود السري مستخدم بالفعل.` });
        throw err; 
    }
});

// طلبات بيع (Public) - مع إشعار ديسكورد
app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const data = req.body;
    const files = req.files || [];
    if (!data.sellerName || !data.sellerPhone) return res.status(400).json({ message: 'بيانات ناقصة' });

    const paths = files.map(f => f.path).join(' | ');
    const mainImage = files.length > 0 ? files[0].path : null;

    const sql = `INSERT INTO seller_submissions ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
    
    const params = [
        data.sellerName, data.sellerPhone, data.propertyTitle, data.propertyType, 
        data.propertyPrice, safeInt(data.propertyArea), safeInt(data.propertyRooms), 
        safeInt(data.propertyBathrooms), data.propertyDescription, paths, new Date().toISOString()
    ];

    try {
        await pgQuery(sql, params);
        
        // ✅ إرسال الإشعار (الدالة الآن معرفة بالخارج)
        await sendDiscordNotification(
            "📢 طلب عرض عقار جديد!",
            [
                { name: "👤 المالك", value: data.sellerName, inline: true },
                { name: "📞 الهاتف", value: data.sellerPhone, inline: true },
                { name: "🏠 العنوان", value: data.propertyTitle },
                { name: "💰 السعر", value: `${data.propertyPrice} ج.م`, inline: true }
            ],
            3066993, // أخضر
            mainImage
        );

        res.status(200).json({ success: true, message: 'تم الاستلام' });
    } catch (err) { throw err; }
});

// طلب شراء (Public) - مع إشعار ديسكورد
app.post('/api/request-property', async (req, res) => {
    const { name, phone, email, specifications } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'بيانات ناقصة' });
    try {
        await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]);
        
        // ✅ إرسال الإشعار
        await sendDiscordNotification(
            "📩 طلب عقار مخصص جديد",
            [
                { name: "👤 الاسم", value: name, inline: true },
                { name: "📞 الهاتف", value: phone, inline: true },
                { name: "📝 المواصفات", value: specifications }
            ],
            15158332 // أحمر
        );
        
        res.status(200).json({ success: true, message: 'تم الاستلام' });
    } catch (err) { throw err; }
});

// --- مسارات القراءة والحذف ---
app.get('/api/admin/seller-submissions', async (req, res) => { try { const r = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.get('/api/admin/property-requests', async (req, res) => { try { const r = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.delete('/api/admin/seller-submission/:id', async (req, res) => { try { const r = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]); if (r.rows[0]) { const urls = (r.rows[0].imagePaths || '').split(' | ').filter(Boolean); await deleteCloudinaryImages(urls); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } else res.status(404).json({ message: 'غير موجود' }); } catch (err) { throw err; } });
app.delete('/api/admin/property-request/:id', async (req, res) => { try { await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });
app.get('/api/properties', async (req, res) => { let sql = "SELECT id, title, price, rooms, bathrooms, area, \"imageUrl\", type FROM properties"; const params = []; let idx = 1; const filters = []; const { type, limit, keyword, minPrice, maxPrice, rooms, sort } = req.query; if (type) { filters.push(`type = $${idx++}`); params.push(type === 'buy' ? 'بيع' : 'إيجار'); } if (keyword) { filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR "hiddenCode" ILIKE $${idx})`); params.push(`%${keyword}%`); idx++; } if (minPrice) { filters.push(`"numericPrice" >= $${idx++}`); params.push(Number(minPrice)); } if (maxPrice) { filters.push(`"numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); } if (rooms) { if (rooms === '4+') { filters.push(`rooms >= $${idx++}`); params.push(4); } else { filters.push(`rooms = $${idx++}`); params.push(Number(rooms)); } } if (filters.length > 0) sql += " WHERE " + filters.join(" AND "); let orderBy = "ORDER BY id DESC"; if (sort === 'price_asc') orderBy = 'ORDER BY "numericPrice" ASC'; else if (sort === 'price_desc') orderBy = 'ORDER BY "numericPrice" DESC'; else if (sort === 'oldest') orderBy = 'ORDER BY id ASC'; sql += ` ${orderBy}`; if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); } try { const result = await pgQuery(sql, params); res.json(result.rows); } catch (err) { throw err; } });
app.get('/api/property/:id', async (req, res) => { try { const r = await pgQuery(`SELECT * FROM properties WHERE id=$1`, [req.params.id]); if(r.rows[0]) { try { r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); } catch(e){ r.rows[0].imageUrls=[]; } res.json(r.rows[0]); } else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.get('/api/property-by-code/:code', async (req, res) => { try { const r = await pgQuery(`SELECT id, title, price, "hiddenCode" FROM properties WHERE UPPER("hiddenCode") LIKE UPPER($1)`, [`%${req.params.code}%`]); if(r.rows[0]) res.json(r.rows[0]); else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.delete('/api/property/:id', async (req, res) => { try { const resGet = await pgQuery(`SELECT "imageUrls" FROM properties WHERE id=$1`, [req.params.id]); if(resGet.rows[0]) { try { await deleteCloudinaryImages(JSON.parse(resGet.rows[0].imageUrls)); } catch(e){} await pgQuery(`DELETE FROM properties WHERE id=$1`, [req.params.id]); res.json({message: 'تم الحذف'}); } else res.status(404).json({message: 'غير موجود'}); } catch (e) { throw e; } });
app.post('/api/favorites', async (req, res) => { const { userEmail, propertyId } = req.body; if (!userEmail || !propertyId) return res.status(400).json({ message: 'بيانات ناقصة' }); try { await pgQuery(`INSERT INTO favorites (user_email, property_id) VALUES ($1, $2)`, [userEmail, propertyId]); res.status(201).json({ success: true }); } catch (err) { if (err.code === '23505') return res.status(409).json({ message: 'موجودة' }); throw err; } });
app.delete('/api/favorites/:propertyId', async (req, res) => { const { userEmail } = req.query; if (!userEmail) return res.status(400).json({ message: 'الإيميل مطلوب' }); try { const result = await pgQuery(`DELETE FROM favorites WHERE user_email = $1 AND property_id = $2`, [userEmail, req.params.propertyId]); res.json({ success: true }); } catch (err) { throw err; } });
app.get('/api/favorites', async (req, res) => { const { userEmail } = req.query; if (!userEmail) return res.status(400).json({ message: 'الإيميل مطلوب' }); const sql = `SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p."imageUrl", p.type, f.id AS favorite_id FROM properties p JOIN favorites f ON p.id = f.property_id WHERE f.user_email = $1 ORDER BY f.id DESC`; try { const result = await pgQuery(sql, [userEmail]); res.json(result.rows); } catch (err) { throw err; } });
app.post('/api/login', async (req, res) => { const { email, password } = req.body; if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return res.json({success:true, role:'admin'}); try { const r = await pgQuery(`SELECT * FROM users WHERE email=$1`, [email]); if(!r.rows[0]) return res.status(401).json({message:'بيانات خاطئة'}); if(await bcrypt.compare(password, r.rows[0].password)) res.json({success:true, role:r.rows[0].role}); else res.status(401).json({message:'بيانات خاطئة'}); } catch (e) { throw e; } });
app.post('/api/register', async (req, res) => { const { name, email, password } = req.body; if (!name || !email || !password) return res.status(400).json({ message: 'بيانات ناقصة' }); try { const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); await pgQuery(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`, [name, email, hashedPassword, 'user']); res.status(201).json({ success: true, message: 'تم التسجيل' }); } catch (error) { if (error.message.includes('unique constraint')) return res.status(400).json({ message: 'مسجل مسبقاً' }); throw error; } });
app.put('/api/user/change-password', async (req, res) => { const { email, currentPassword, newPassword } = req.body; if (!email || !currentPassword || !newPassword) return res.status(400).json({ message: 'بيانات ناقصة' }); try { const r = await pgQuery(`SELECT * FROM users WHERE email=$1`, [email]); if (!r.rows[0]) return res.status(404).json({ message: 'غير موجود' }); if (!(await bcrypt.compare(currentPassword, r.rows[0].password))) return res.status(401).json({ message: 'كلمة المرور خطأ' }); const hash = await bcrypt.hash(newPassword, SALT_ROUNDS); await pgQuery(`UPDATE users SET password = $1 WHERE id = $2`, [hash, r.rows[0].id]); res.json({ success: true, message: 'تم التغيير' }); } catch (err) { throw err; } });
app.delete('/api/user/delete-account', async (req, res) => { const { email } = req.body; if (!email) return res.status(400).json({ message: 'الإيميل مطلوب' }); try { const r = await pgQuery(`DELETE FROM users WHERE email = $1`, [email]); if (r.rowCount === 0) return res.status(404).json({ message: 'غير موجود' }); res.json({ success: true, message: 'تم الحذف' }); } catch (err) { throw err; } });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'home.html')); });
app.get('/api/ping', (req, res) => res.json({status: "OK"}));

app.use((err, req, res, next) => {
    console.log("🔥 ERROR CAUGHT:"); console.error(err);
    if (res.headersSent) return next(err);
    if (err instanceof multer.MulterError) return res.status(500).json({ success: false, message: `فشل الرفع: ${err.code}` });
    res.status(500).json({ success: false, message: 'خطأ داخلي', error: err.message });
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });