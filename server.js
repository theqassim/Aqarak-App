const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

// 🚨 الإضافات الجديدة لـ Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// 🚨 متغيرات البيئة (Render Environment Variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aqarakproperty@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Aqarak@123";
const SALT_ROUNDS = 10;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "aqarakproperty@gmail.com";
const SENDER_PASSWORD = process.env.SENDER_PASSWORD || "httygvavpqopvcxs";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'Ydalxzpcaj';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '729741884569459';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'VzrH7_rMdnINCjZK4rg1O2AFiFI';

// 🚨 تهيئة Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    }
});

// 🚨 دالة مساعدة لحذف الصور من Cloudinary
async function deleteCloudinaryImages(imageUrls) {
    for (const url of imageUrls) {
        // Cloudinary URL يحتوي على public_id في نهاية المسار
        // يتم استخراج الـ public_id من رابط الـ URL
        const publicIdMatch = url.match(/\/(aqarak_[a-z]+\/.+)\.webp/);
        if (publicIdMatch && publicIdMatch[1]) {
            const publicId = publicIdMatch[1];
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log(`Deleted Cloudinary asset: ${publicId}`);
            } catch (err) {
                console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
            }
        }
    }
}


// ----------------- SQLite Setup (Remains the same) -----------------
const dbPath = path.join(__dirname, 'aqarak_test.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Could not connect to SQLite database:", err.message);
    } else {
        console.log(`Connected to the SQLite database: ${dbPath}`);
    }
});

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function createTables() {
    const createPropertiesTableSql = `
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price TEXT NOT NULL,
            numericPrice REAL,
            rooms INTEGER,
            bathrooms INTEGER,
            area INTEGER,
            description TEXT,
            imageUrl TEXT,
            imageUrls TEXT,
            type TEXT NOT NULL,
            hiddenCode TEXT UNIQUE
        )
    `;

    const createUsersTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    `;

    const createSellerSubmissionsTableSql = `
        CREATE TABLE IF NOT EXISTS seller_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sellerName TEXT NOT NULL,
            sellerPhone TEXT NOT NULL,
            propertyTitle TEXT NOT NULL,
            propertyType TEXT NOT NULL,
            propertyPrice TEXT NOT NULL,
            propertyArea INTEGER,
            propertyRooms INTEGER,
            propertyBathrooms INTEGER,
            propertyDescription TEXT,
            imagePaths TEXT,
            submissionDate TEXT,
            status TEXT DEFAULT 'pending' 
        )
    `;

    const createPropertyRequestsTableSql = `
        CREATE TABLE IF NOT EXISTS property_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            specifications TEXT NOT NULL,
            submissionDate TEXT
        )
    `;

    const createFavoritesTableSql = `
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            property_id INTEGER NOT NULL,
            UNIQUE(user_email, property_id)
        )
    `;

    try {
        await dbRun(createPropertiesTableSql);
        await dbRun(createUsersTableSql);
        await dbRun(createSellerSubmissionsTableSql);
        await dbRun(createPropertyRequestsTableSql);
        await dbRun(createFavoritesTableSql);
        console.log('Tables created or already exist on SQLite.');
    } catch (err) {
        console.error('ERROR creating tables:', err);
    }
}
createTables();

async function sendNotificationEmail(data, imagePaths, isRequest = false) {
    const subject = isRequest ? `إشعار: طلب عقار مخصص جديد من ${data.name}` : `إشعار: ${data.propertyTitle} - تم تقديم عقار جديد!`;
    
    let htmlContent;
    
    if (isRequest) {
        htmlContent = `
            <p><strong>تم استلام طلب عقار مخصص جديد:</strong></p>
            <ul>
                <li><strong>الاسم:</strong> ${data.name}</li>
                <li><strong>رقم الهاتف:</strong> ${data.phone}</li>
                <li><strong>البريد الإلكتروني:</strong> ${data.email || 'N/A'}</li>
            </ul>
            <p><strong>المواصفات المطلوبة:</strong></p>
            <p>${data.specifications}</p>
        `;
    } else {
        htmlContent = `
            <p><strong>تم استلام طلب جديد لعرض عقار:</strong></p>
            <ul>
                <li><strong>اسم البائع:</strong> ${data.sellerName}</li>
                <li><strong>رقم الهاتف:</strong> ${data.sellerPhone}</li>
                <li><strong>عنوان العقار:</strong> ${data.propertyTitle}</li>
                <li><strong>نوع العرض:</strong> ${data.propertyType}</li>
                <li><strong>السعر:</strong> ${data.propertyPrice} جنيه</li>
                <li><strong>المساحة:</strong> ${data.propertyArea} م²</li>
                <li><strong>الغرف/الحمامات:</strong> ${data.propertyRooms} غرف / ${data.propertyBathrooms} حمامات</li>
            </ul>
            <p><strong>الوصف:</strong> ${data.propertyDescription}</p>
            <p><strong>مسارات الصور:</strong> ${imagePaths.split(' | ').map(p => `<a href="${p}">صورة</a>`).join(', ')}</p>
        `;
    }

    const mailOptions = {
        from: `"Aqarak Submission" <${SENDER_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Notification Email sent.");
    } catch (error) {
        console.error("NODEMAILER ERROR:", error);
    }
}


app.use(cors());
app.use(express.json());
// 🚨 تم إزالة express.static لملفات الصور المرفوعة (لأنها الآن في Cloudinary)
// app.use(express.static(path.join(__dirname, 'public'))); 


// 🚨 منطق التخزين السحابي لطلبات البائعين
const storageSeller = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aqarak_submissions',
        format: async (req, file) => 'webp', 
        public_id: (req, file) => `seller-${Date.now()}`,
    },
});
const uploadSeller = multer({ storage: storageSeller });

// 🚨 منطق التخزين السحابي لعقارات الأدمن
const storageProperties = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aqarak_properties', 
        format: async (req, file) => 'webp',
        public_id: (req, file) => `property-${Date.now()}`,
    },
});
const uploadProperties = multer({ storage: storageProperties });


// ----------------- API Endpoints -----------------

// 🚨 المسار الجديد: نشر عقار من بيانات موجودة (نشر فوري)
app.post('/api/admin/publish-submission', async (req, res) => {
    const { submissionId, hiddenCode } = req.body;

    if (!submissionId || !hiddenCode) {
        return res.status(400).json({ message: 'رقم الطلب والكود السري مطلوبان للنشر.' });
    }

    try {
        // 1. جلب بيانات الطلب
        const submissionSql = `SELECT * FROM seller_submissions WHERE id = ? AND status = 'pending'`;
        const submission = await dbGet(submissionSql, [submissionId]);

        if (!submission) {
            return res.status(404).json({ message: 'لم يتم العثور على الطلب أو تم التعامل معه مسبقاً.' });
        }

        // 2. تجهيز البيانات للنشر في جدول properties
        const imageUrls = (submission.imagePaths || '').split(' | ').filter(p => p.trim() !== '');
        if (imageUrls.length === 0) {
            return res.status(400).json({ message: 'لا توجد صور مرفقة في الطلب للنشر.' });
        }
        
        const mainImageUrl = imageUrls[0];
        const imageUrlsJson = JSON.stringify(imageUrls);
        const numericPrice = parseFloat(submission.propertyPrice.replace(/[^0-9.]/g, ''));

        const publishSql = `
            INSERT INTO properties (
                title, price, numericPrice, rooms, bathrooms, area, description, 
                imageUrl, imageUrls, type, hiddenCode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            submission.propertyTitle, submission.propertyPrice, numericPrice, 
            submission.propertyRooms || 0, submission.propertyBathrooms || 0, submission.propertyArea || 0, 
            submission.propertyDescription, mainImageUrl, imageUrlsJson, 
            submission.propertyType, hiddenCode
        ];

        // 3. النشر في جدول properties
        await dbRun(publishSql, params);

        // 4. حذف الطلب الأصلي من جدول seller_submissions
        const deleteSql = `DELETE FROM seller_submissions WHERE id = ?`;
        await dbRun(deleteSql, [submissionId]);

        res.status(201).json({ 
            success: true, 
            message: `تم نشر العقار بنجاح! والكود السري: ${hiddenCode}`
        });

    } catch (err) {
        console.error('Error publishing submission:', err.message);
        const errorMessage = err.message && err.message.includes('SQLITE_CONSTRAINT: UNIQUE') ?
            'خطأ في قاعدة البيانات: الكود السري مسجل بالفعل.' : 'خطأ في قاعدة البيانات، يرجى مراجعة الكود السري.';
        return res.status(500).json({ message: errorMessage });
    }
});


app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const files = req.files || [];
    const data = req.body;

    if (!data.title || !data.price || !data.type || !data.hiddenCode) {
        return res.status(400).json({ message: 'الرجاء ملء جميع الحقول الأساسية.' });
    }

    if (files.length === 0) {
        return res.status(400).json({ message: 'الرجاء إرفاق صورة واحدة على الأقل للعقار.' });
    }

    // 🚨 هنا نستخدم file.path الذي هو رابط Cloudinary URL
    const imageUrls = files.map(file => file.path); 
    const mainImageUrl = imageUrls[0];
    const imageUrlsJson = JSON.stringify(imageUrls);
    const numericPrice = parseFloat(data.price.replace(/[^0-9.]/g, ''));

    const sql = `
        INSERT INTO properties (
            title, price, numericPrice, rooms, bathrooms, area, description,
            imageUrl, imageUrls, type, hiddenCode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.title, data.price, numericPrice,
        data.rooms || 0, data.bathrooms || 0, data.area || 0,
        data.description, mainImageUrl, imageUrlsJson,
        data.type, data.hiddenCode
    ];

    try {
        const result = await dbRun(sql, params);
        res.status(201).json({
            success: true,
            message: `تم نشر العقار بنجاح! ID: ${result.lastID}`,
            id: result.lastID
        });
    } catch (err) {
        console.error('Error inserting property:', err.message);
        // 🚨 لا نحتاج لـ fs.unlink لأن الملفات في Cloudinary
        const errorMessage = err.message && err.message.includes('SQLITE_CONSTRAINT: UNIQUE') ?
            'خطأ في قاعدة البيانات: الكود السري مسجل بالفعل.' : 'خطأ في قاعدة البيانات، يرجى مراجعة الكود السري.';
        return res.status(500).json({ message: errorMessage });
    }
});

app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const data = req.body;
    const files = req.files || [];

    if (!data.propertyTitle || !data.sellerName || !data.sellerPhone) {
        // 🚨 لا نحتاج لـ fs.unlink لملفات Cloudinary في حالة الخطأ
        return res.status(400).json({ message: 'الرجاء ملء الحقول المطلوبة (العنوان والاسم ورقم الهاتف).' });
    }

    // 🚨 نستخدم file.path لتخزين رابط Cloudinary
    const imagePaths = files.map(file => file.path).join(' | ');
    const submissionDate = new Date().toISOString(); 

    const sql = `
        INSERT INTO seller_submissions (
            sellerName, sellerPhone, propertyTitle, propertyType, propertyPrice,
            propertyArea, propertyRooms, propertyBathrooms, propertyDescription,
            imagePaths, submissionDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        data.sellerName, data.sellerPhone, data.propertyTitle, data.propertyType,
        data.propertyPrice, data.propertyArea || 0, data.propertyRooms || 0,
        data.propertyBathrooms || 0, data.propertyDescription,
        imagePaths, submissionDate
    ];

    try {
        await dbRun(sql, params);
        await sendNotificationEmail(data, imagePaths, false);
        
        res.status(200).json({ success: true, message: 'تم استلام طلبك بنجاح للمراجعة.' });
    } catch (error) {
        console.error("SUBMISSION ERROR:", error);
        res.status(500).json({ message: 'فشل التخزين الداخلي للبيانات.' });
    }
});

app.post('/api/request-property', async (req, res) => {
    const { name, phone, email, specifications } = req.body;

    if (!name || !phone || !specifications) {
        return res.status(400).json({ message: 'الرجاء ملء الحقول المطلوبة (الاسم والهاتف والمواصفات).' });
    }

    const submissionDate = new Date().toISOString();
    
    const sql = `
        INSERT INTO property_requests (name, phone, email, specifications, submissionDate)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await dbRun(sql, [name, phone, email, specifications, submissionDate]);
        await sendNotificationEmail(req.body, null, true);
        res.status(200).json({ success: true, message: 'تم استلام طلب عقارك المخصص بنجاح.' });
    } catch (error) {
        console.error("REQUEST PROPERTY ERROR:", error);
        res.status(500).json({ message: 'فشل في تسجيل الطلب.' });
    }
});


app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'يرجى ملء جميع الحقول' });

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        
        await dbRun(sql, [name, email, hashedPassword, 'user']);
        
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح!' });
    } catch (error) {
        if (error.message && error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
            return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
        }
        res.status(500).json({ message: 'خطأ في السيرفر عند التسجيل' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ success: true, role: 'admin' });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    
    try {
        const user = await dbGet(sql, [email]);
        
        if (!user) return res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
        }
    } catch (err) {
        return res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

app.put('/api/user/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'يرجى ملء جميع الحقول.' });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;

    try {
        const user = await dbGet(sql, [email]);

        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود.' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة.' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const updateSql = `UPDATE users SET password = ? WHERE id = ?`;

        await dbRun(updateSql, [newHashedPassword, user.id]);

        res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح!' });
    } catch (err) {
        console.error('Error changing password:', err);
        return res.status(500).json({ message: 'فشل في تحديث كلمة المرور.' });
    }
});

app.delete('/api/user/delete-account', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'الإيميل مطلوب لحذف الحساب.' });
    }

    const deleteSql = `DELETE FROM users WHERE email = ?`;

    try {
        const result = await dbRun(deleteSql, [email]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'لم يتم العثور على المستخدم.' });
        }
        res.json({ success: true, message: 'تم حذف الحساب بنجاح.' });
    } catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({ message: 'فشل في حذف الحساب.' });
    }
});

app.post('/api/favorites', async (req, res) => {
    const { userEmail, propertyId } = req.body;
    if (!userEmail || !propertyId) {
        return res.status(400).json({ message: 'بيانات المستخدم والعقار مطلوبة.' });
    }
    const sql = `INSERT INTO favorites (user_email, property_id) VALUES (?, ?)`;
    try {
        await dbRun(sql, [userEmail, propertyId]);
        res.status(201).json({ success: true, message: 'تمت الإضافة إلى المفضلة.' });
    } catch (err) {
        if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
            return res.status(409).json({ message: 'العقار موجود بالفعل في المفضلة.' });
        }
        return res.status(500).json({ message: 'فشل الإضافة إلى المفضلة.' });
    }
});

app.delete('/api/favorites/:propertyId', async (req, res) => {
    const propertyId = req.params.propertyId;
    const userEmail = req.query.userEmail;

    if (!userEmail) {
        return res.status(400).json({ message: 'الإيميل مطلوب للحذف.' });
    }

    const sql = `DELETE FROM favorites WHERE user_email = ? AND property_id = ?`;
    try {
        const result = await dbRun(sql, [userEmail, propertyId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'العقار غير موجود في المفضلة.' });
        }
        res.json({ success: true, message: 'تمت الإزالة من المفضلة.' });
    } catch (err) {
        return res.status(500).json({ message: 'فشل الحذف من المفضلة.' });
    }
});

app.get('/api/favorites', async (req, res) => {
    const userEmail = req.query.userEmail;
    if (!userEmail) {
        return res.status(400).json({ message: 'الإيميل مطلوب لجلب المفضلة.' });
    }
    
    const sql = `
        SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p.imageUrl, p.type, f.id AS favorite_id 
        FROM properties p
        JOIN favorites f ON p.id = f.property_id
        WHERE f.user_email = ?
        ORDER BY f.id DESC
    `;

    try {
        const rows = await dbAll(sql, [userEmail]);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.get('/api/admin/seller-submissions', async (req, res) => {
    const sql = "SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY submissionDate DESC";
    try {
        const rows = await dbAll(sql);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.get('/api/admin/property-requests', async (req, res) => {
    const sql = "SELECT * FROM property_requests ORDER BY submissionDate DESC";
    try {
        const rows = await dbAll(sql);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.delete('/api/admin/property-request/:id', async (req, res) => {
    const sql = `DELETE FROM property_requests WHERE id = ?`;
    try {
        const result = await dbRun(sql, [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'لم يتم العثور على الطلب.' });
        }
        res.json({ message: 'تم حذف طلب العقار بنجاح.' });
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.delete('/api/admin/seller-submission/:id', async (req, res) => {
    const submissionId = req.params.id;
    const sqlSelect = `SELECT imagePaths FROM seller_submissions WHERE id = ?`;

    try {
        const row = await dbGet(sqlSelect, [submissionId]);
        if (!row) return res.status(404).json({ message: 'لم يتم العثور على الطلب.' });

        let imageUrls = (row.imagePaths || '').split(' | ').filter(p => p.trim() !== '');
        
        // 🚨 حذف الصور من Cloudinary بدلاً من نظام الملفات المحلي
        await deleteCloudinaryImages(imageUrls);

        const deleteSql = `DELETE FROM seller_submissions WHERE id = ?`;
        await dbRun(deleteSql, [submissionId]);
        
        res.json({ message: 'تم حذف طلب عرض العقار بنجاح.' });
    } catch (err) {
        console.error('Delete Seller Submission Error:', err);
        return res.status(500).json({ message: 'فشل في عملية الحذف من قاعدة البيانات.' });
    }
});

app.get('/api/properties', async (req, res) => {
    let sql = "SELECT id, title, price, rooms, bathrooms, area, imageUrl, type FROM properties";
    const params = [];
    const filters = [];

    const { type, limit, keyword, minPrice, maxPrice, rooms } = req.query;

    if (type) {
        if (type === 'buy') filters.push("type = ?");
        else if (type === 'rent') filters.push("type = ?");
        params.push(type === 'buy' ? 'بيع' : 'إيجار');
    }
    
    if (keyword) {
        filters.push("(title LIKE ? OR description LIKE ? OR hiddenCode LIKE ?)"); 
        params.push(`%${keyword}%`);
        params.push(`%${keyword}%`);
        params.push(`%${keyword}%`);
    }

    if (minPrice) { filters.push("numericPrice >= ?"); params.push(Number(minPrice)); }
    if (maxPrice) { filters.push("numericPrice <= ?"); params.push(Number(maxPrice)); }

    if (rooms) {
        if (rooms === '4+') { filters.push("rooms >= ?"); params.push(4); } 
        else { filters.push("rooms = ?"); params.push(Number(rooms)); }
    }

    if (filters.length > 0) sql += " WHERE " + filters.join(" AND ");
    
    sql += " ORDER BY id DESC";

    if (limit) { sql += " LIMIT ?"; params.push(parseInt(limit, 10)); }

    try {
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const propertyId = req.params.id;
    const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages } = req.body;
    
    let existingImageUrls = JSON.parse(existingImages || '[]');
    const newImageUrls = req.files ? req.files.map(file => file.path) : []; // 🚨 file.path من Cloudinary
    
    const allImageUrls = [...existingImageUrls, ...newImageUrls];
    const mainImageUrl = allImageUrls[0];
    const imageUrlsJson = JSON.stringify(allImageUrls);
    const numericPrice = parseFloat(price.replace(/,/g, ''));

    if (!title || !price || !type || !hiddenCode) {
        return res.status(400).json({ message: 'خطأ: الحقول الأساسية مطلوبة' });
    }

    const sql = `
        UPDATE properties SET
        title = ?, price = ?, numericPrice = ?, rooms = ?, bathrooms = ?, area = ?, 
        description = ?, imageUrl = ?, imageUrls = ?, type = ?, hiddenCode = ?
        WHERE id = ?
    `;

    const params = [
        title, price, numericPrice, rooms, bathrooms, area, description,
        mainImageUrl, imageUrlsJson, type, hiddenCode,
        propertyId
    ];

    try {
        const result = await dbRun(sql, params);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'لم يتم العثور على العقار لتحديثه' });
        }
        res.status(200).json({ message: 'تم تحديث العقار بنجاح!' });
    } catch (err) {
        console.error('Error updating record:', err.message);
        return res.status(500).json({ message: 'خطأ في السيرفر عند التحديث' });
    }
});

app.get('/api/property-by-code/:code', async (req, res) => {
    const code = req.params.code.trim();
    const codeWithWildcard = '%' + code + '%';
    
    const sql = "SELECT id, title, price, hiddenCode FROM properties WHERE UPPER(hiddenCode) LIKE UPPER(?)";

    try {
        const row = await dbGet(sql, [codeWithWildcard]);
        
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ "message": "لم يتم العثور على عقار بهذا الكود" });
        }
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.get('/api/property/:id', async (req, res) => {
    const sql = "SELECT * FROM properties WHERE id = ?";
    
    try {
        const row = await dbGet(sql, [req.params.id]);
        
        if (row) {
            // 🚨 يتم قراءة روابط Cloudinary المخزنة
            if (row.imageUrls) {
                row.imageUrls = JSON.parse(row.imageUrls);
            } else {
                row.imageUrls = [];
            }
            res.json(row);
        } else {
            res.status(404).json({ "message": "Property not found" });
        }
    } catch (err) {
        return res.status(500).json({ "error": err.message });
    }
});

app.delete('/api/property/:id', async (req, res) => {
    const sqlSelect = `SELECT imageUrls FROM properties WHERE id = ?`;
    
    try {
        const row = await dbGet(sqlSelect, [req.params.id]);

        if (!row) return res.status(404).json({ message: 'لم يتم العثور على العقار.' });

        let imageUrls = [];
        if (row.imageUrls) {
            try {
                imageUrls = JSON.parse(row.imageUrls);
            } catch (e) {
                console.error("Failed to parse imageUrls from SQLite:", e.message);
            }
        }
        
        // 🚨 حذف الصور من Cloudinary
        await deleteCloudinaryImages(imageUrls);

        const deleteSql = `DELETE FROM properties WHERE id = ?`;
        const deleteResult = await dbRun(deleteSql, [req.params.id]);
        
        if (deleteResult.changes === 0) {
              return res.status(404).json({ message: 'لم يتم العثور على العقار للحذف.' });
        }
        
        res.json({ message: 'تم حذف العقار بنجاح.' });
    } catch (err) {
        console.error('Delete Error:', err);
        return res.status(500).json({ message: 'فشل في عملية الحذف من قاعدة البيانات.' });
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ status: "OK", server_time: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});