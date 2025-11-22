const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); 
const multer = require('multer');
const fs = require('fs');

// استيراد مكتبات الصور
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------
// 1. إعدادات البيئة والمتغيرات
// -----------------------------------------------------

// بيانات دخول الأدمن
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aqarakproperty@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Aqarak@123";
const SALT_ROUNDS = 10;

// مفاتيح Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// 🛑 فحص أمان: التأكد من وجود مفاتيح Cloudinary قبل البدء
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("❌ CRITICAL ERROR: Cloudinary keys are missing in Environment Variables!");
    console.error("Please check Render settings for: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
    // ملاحظة: لن نوقف السيرفر (process.exit) لكي يظل يعمل، لكن رفع الصور سيفشل إذا لم تُصلح المفاتيح
}

// تهيئة Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// -----------------------------------------------------
// 2. إعداد قاعدة البيانات (PostgreSQL)
// -----------------------------------------------------

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// اختبار الاتصال عند تشغيل السيرفر
dbPool.connect()
    .then(client => {
        console.log("✅ Successfully connected to PostgreSQL!");
        client.release();
    })
    .catch(err => {
        console.error("❌ FATAL ERROR: Could not connect to PostgreSQL pool.");
        console.error(err.message);
    });

// دالة مساعدة لتنفيذ الاستعلامات
function pgQuery(sql, params = []) {
    return dbPool.query(sql, params);
}

// -----------------------------------------------------
// 3. إعدادات Multer (رفع الملفات)
// -----------------------------------------------------

// تخزين لصور طلبات البائعين
const storageSeller = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aqarak_submissions',
        format: async () => 'webp', 
        public_id: (req, file) => `seller-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    },
});
const uploadSeller = multer({ storage: storageSeller });

// تخزين لصور عقارات الموقع
const storageProperties = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aqarak_properties', 
        format: async () => 'webp',
        public_id: (req, file) => `property-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    },
});
const uploadProperties = multer({ storage: storageProperties });

// دالة لحذف الصور من Cloudinary عند الحذف
async function deleteCloudinaryImages(imageUrls) {
    if (!imageUrls || !Array.isArray(imageUrls)) return;
    for (const url of imageUrls) {
        const publicIdMatch = url.match(/\/(aqarak_[a-z]+\/.+)\.webp/);
        if (publicIdMatch && publicIdMatch[1]) {
            try {
                await cloudinary.uploader.destroy(publicIdMatch[1]);
            } catch (err) {
                console.error(`Failed to delete Cloudinary asset:`, err.message);
            }
        }
    }
}

// إنشاء الجداول تلقائياً إذا لم تكن موجودة
async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS properties (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price TEXT NOT NULL, "numericPrice" NUMERIC, rooms INTEGER, bathrooms INTEGER, area INTEGER, description TEXT, "imageUrl" TEXT, "imageUrls" TEXT, type TEXT NOT NULL, "hiddenCode" TEXT UNIQUE)`,
        `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'user')`,
        `CREATE TABLE IF NOT EXISTS seller_submissions (id SERIAL PRIMARY KEY, "sellerName" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL, "propertyTitle" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "propertyPrice" TEXT NOT NULL, "propertyArea" INTEGER, "propertyRooms" INTEGER, "propertyBathrooms" INTEGER, "propertyDescription" TEXT, "imagePaths" TEXT, "submissionDate" TEXT, status TEXT DEFAULT 'pending')`,
        `CREATE TABLE IF NOT EXISTS property_requests (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, specifications TEXT NOT NULL, "submissionDate" TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, property_id INTEGER NOT NULL, UNIQUE(user_email, property_id))`
    ];

    try {
        for (const query of queries) await pgQuery(query);
        console.log('✅ Tables checked/created successfully.');
    } catch (err) {
        console.error('❌ ERROR creating tables:', err);
    }
}
createTables();

// تفعيل Middleware
app.use(cors());
app.use(express.json());

// -----------------------------------------------------
// 4. مسارات API (Routes)
// -----------------------------------------------------

// --- مسارات الإدارة (Admin) ---

// نشر طلب بائع إلى الموقع الرسمي
app.post('/api/admin/publish-submission', async (req, res) => {
    const { submissionId, hiddenCode } = req.body;
    if (!submissionId || !hiddenCode) return res.status(400).json({ message: 'بيانات ناقصة' });

    try {
        const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]);
        const sub = subRes.rows[0];
        if (!sub) return res.status(404).json({ message: 'الطلب غير موجود' });

        const imageUrls = (sub.imagePaths || '').split(' | ').filter(p => p.trim() !== '');
        if (!imageUrls.length) return res.status(400).json({ message: 'لا توجد صور' });

        const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
        const params = [sub.propertyTitle, sub.propertyPrice, parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), sub.propertyRooms, sub.propertyBathrooms, sub.propertyArea, sub.propertyDescription, imageUrls[0], JSON.stringify(imageUrls), sub.propertyType, hiddenCode];
        
        const result = await pgQuery(sql, params);
        await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]);

        res.status(201).json({ success: true, message: 'تم النشر بنجاح', id: result.rows[0].id });
    } catch (err) {
        throw err; // سيرسله لمعالج الأخطاء في الأسفل
    }
});

// إضافة عقار جديد مباشرة (Admin)
app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const files = req.files || [];
    const data = req.body;
    if (!data.title || !data.hiddenCode) return res.status(400).json({ message: 'بيانات ناقصة' });
    if (!files.length) return res.status(400).json({ message: 'يجب رفع صورة واحدة على الأقل' });

    const urls = files.map(f => f.path);
    const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
    const params = [data.title, data.price, parseFloat((data.price || '0').replace(/[^0-9.]/g, '')), data.rooms || 0, data.bathrooms || 0, data.area || 0, data.description, urls[0], JSON.stringify(urls), data.type, data.hiddenCode];

    try {
        const result = await pgQuery(sql, params);
        res.status(201).json({ success: true, message: 'تم النشر', id: result.rows[0].id });
    } catch (err) {
        throw err;
    }
});

// تحديث بيانات عقار (Admin) - **هنا تم حل مشكلة التكرار**
app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const propertyId = req.params.id;
    const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages } = req.body;

    // 🔥 الحماية من التكرار: إذا وصلت مصفوفة نأخذ أول عنصر فقط
    let rawImages = existingImages;
    if (Array.isArray(rawImages)) {
        rawImages = rawImages[0];
    }
    
    let oldUrls = [];
    try { 
        oldUrls = JSON.parse(rawImages || '[]'); 
    } catch(e) {
        console.error("Error parsing existingImages:", e.message);
    }

    const newUrls = req.files ? req.files.map(f => f.path) : [];
    const allUrls = [...oldUrls, ...newUrls];
    const mainUrl = allUrls.length ? allUrls[0] : null;

    const sql = `UPDATE properties SET title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11 WHERE id=$12`;
    const params = [title, price, parseFloat((price||'0').replace(/,/g,'')), rooms, bathrooms, area, description, mainUrl, JSON.stringify(allUrls), type, hiddenCode, propertyId];

    try {
        const result = await pgQuery(sql, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'العقار غير موجود' });
        res.status(200).json({ message: 'تم التحديث بنجاح' });
    } catch (err) {
        throw err;
    }
});

// جلب طلبات البائعين (Admin)
app.get('/api/admin/seller-submissions', async (req, res) => {
    try {
        const result = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC");
        res.json(result.rows);
    } catch (err) { throw err; }
});

// جلب الطلبات المخصصة (Admin)
app.get('/api/admin/property-requests', async (req, res) => {
    try {
        const result = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC");
        res.json(result.rows);
    } catch (err) { throw err; }
});

// حذف طلب بائع (Admin)
app.delete('/api/admin/seller-submission/:id', async (req, res) => {
    try {
        const rowResult = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]);
        if (rowResult.rows[0]) {
            const urls = (rowResult.rows[0].imagePaths || '').split(' | ').filter(Boolean);
            await deleteCloudinaryImages(urls);
            await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]);
            res.json({ message: 'تم الحذف' });
        } else {
            res.status(404).json({ message: 'غير موجود' });
        }
    } catch (err) { throw err; }
});

// حذف طلب مخصص (Admin)
app.delete('/api/admin/property-request/:id', async (req, res) => {
    try {
        await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch (err) { throw err; }
});

// --- مسارات عامة (Public) ---

// تقديم عقار (من صفحة "بع عقارك")
app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const data = req.body;
    const files = req.files || [];
    if (!data.sellerName || !data.sellerPhone) return res.status(400).json({ message: 'الاسم والهاتف مطلوبان' });

    const paths = files.map(f => f.path).join(' | ');
    const sql = `INSERT INTO seller_submissions ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
    const params = [data.sellerName, data.sellerPhone, data.propertyTitle, data.propertyType, data.propertyPrice, data.propertyArea || 0, data.propertyRooms || 0, data.propertyBathrooms || 0, data.propertyDescription, paths, new Date().toISOString()];

    try {
        await pgQuery(sql, params);
        res.status(200).json({ success: true, message: 'تم الاستلام' });
    } catch (err) { throw err; }
});

// طلب عقار مخصص
app.post('/api/request-property', async (req, res) => {
    const { name, phone, email, specifications } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'بيانات ناقصة' });

    try {
        await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]);
        res.status(200).json({ success: true, message: 'تم الاستلام' });
    } catch (err) { throw err; }
});

// جلب العقارات (مع فلترة)
app.get('/api/properties', async (req, res) => {
    let sql = "SELECT id, title, price, rooms, bathrooms, area, \"imageUrl\", type FROM properties";
    const params = [];
    let idx = 1;
    const filters = [];
    const { type, limit, keyword, minPrice, maxPrice, rooms } = req.query;

    if (type) {
        filters.push(`type = $${idx++}`);
        params.push(type === 'buy' ? 'بيع' : 'إيجار');
    }
    if (keyword) {
        filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR "hiddenCode" ILIKE $${idx})`);
        params.push(`%${keyword}%`);
        idx++;
    }
    if (minPrice) { filters.push(`"numericPrice" >= $${idx++}`); params.push(Number(minPrice)); }
    if (maxPrice) { filters.push(`"numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); }
    if (rooms) {
        if (rooms === '4+') { filters.push(`rooms >= $${idx++}`); params.push(4); } 
        else { filters.push(`rooms = $${idx++}`); params.push(Number(rooms)); }
    }

    if (filters.length > 0) sql += " WHERE " + filters.join(" AND ");
    sql += " ORDER BY id DESC";
    if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); }

    try {
        const result = await pgQuery(sql, params);
        res.json(result.rows);
    } catch (err) { throw err; }
});

// جلب عقار محدد بالـ ID
app.get('/api/property/:id', async (req, res) => {
    try {
        const r = await pgQuery(`SELECT * FROM properties WHERE id=$1`, [req.params.id]);
        if(r.rows[0]) {
            try { r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); } catch(e){ r.rows[0].imageUrls=[]; }
            res.json(r.rows[0]);
        } else res.status(404).json({message: 'غير موجود'});
    } catch(e) { throw e; }
});

// جلب عقار بالكود السري
app.get('/api/property-by-code/:code', async (req, res) => {
    try {
        const r = await pgQuery(`SELECT id, title, price, "hiddenCode" FROM properties WHERE UPPER("hiddenCode") LIKE UPPER($1)`, [`%${req.params.code}%`]);
        if(r.rows[0]) res.json(r.rows[0]); else res.status(404).json({message: 'غير موجود'});
    } catch(e) { throw e; }
});

// حذف عقار
app.delete('/api/property/:id', async (req, res) => {
    try {
        const resGet = await pgQuery(`SELECT "imageUrls" FROM properties WHERE id=$1`, [req.params.id]);
        if(resGet.rows[0]) {
            try { await deleteCloudinaryImages(JSON.parse(resGet.rows[0].imageUrls)); } catch(e){}
            await pgQuery(`DELETE FROM properties WHERE id=$1`, [req.params.id]);
            res.json({message: 'تم الحذف'});
        } else {
            res.status(404).json({message: 'غير موجود'});
        }
    } catch (e) { throw e; }
});

// --- مسارات المصادقة (Auth) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return res.json({success:true, role:'admin'});
    
    try {
        const r = await pgQuery(`SELECT * FROM users WHERE email=$1`, [email]);
        if(!r.rows[0]) return res.status(401).json({message:'بيانات خاطئة'});
        if(await bcrypt.compare(password, r.rows[0].password)) res.json({success:true, role:r.rows[0].role});
        else res.status(401).json({message:'بيانات خاطئة'});
    } catch (e) { throw e; }
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'يرجى ملء جميع الحقول' });
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await pgQuery(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`, [name, email, hashedPassword, 'user']);
        res.status(201).json({ success: true, message: 'تم التسجيل' });
    } catch (error) {
        if (error.message.includes('unique constraint')) return res.status(400).json({ message: 'الإيميل مسجل مسبقاً' });
        throw error;
    }
});

// --- خدمة الملفات الثابتة والـ Ping ---
app.get('/api/ping', (req, res) => res.json({status: "OK"}));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));


// -----------------------------------------------------
// 5. معالج الأخطاء الشامل (The Super Logger)
// -----------------------------------------------------
app.use((err, req, res, next) => {
    console.log("🔥 ERROR CAUGHT IN HANDLER:");
    console.error(err); // يطبع الخطأ بالتفصيل في الكونسول

    if (res.headersSent) return next(err);

    // أخطاء مكتبة رفع الصور
    if (err instanceof multer.MulterError) {
        return res.status(500).json({ 
            success: false, 
            message: `فشل رفع الصور: ${err.code}`, 
            error: err.message 
        });
    }

    // استخراج رسالة الخطأ بأمان
    const msg = err.message || "خطأ غير معروف في السيرفر";
    
    res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي في السيرفر، يرجى المحاولة لاحقاً.',
        error: msg 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});