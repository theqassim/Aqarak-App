const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); 
const multer = require('multer');
const fs = require('fs'); 
const webPush = require('web-push');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// 🟢 إضافات الواتساب
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aqarak-secure-secret-key-2025';
const APP_URL = "https://aqarakeg.com"; 

// ⚠️ مفتاح API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSy_PUT_YOUR_KEY_HERE"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🧠 موديل الشات (للمحادثة)
const modelChat = genAI.getGenerativeModel({ model: "gemma-3-12b-it" }); 
const DEFAULT_SYSTEM_INSTRUCTION = `
أنت المساعد الذكي ودليل الاستخدام الرسمي لمنصة "عقارك".
مهمتك الوحيدة هي مساعدة المستخدمين في كيفية استخدام الموقع وشرح وظائفه بناءً على الدليل التالي بدقة.

⚠️ قواعد صارمة:
1. إذا سألك المستخدم عن أي شيء خارج نطاق "كيفية استخدام الموقع" (مثل أسئلة عامة، سياسة، دين، نكت، نصائح استثمارية)، اعتذر بلباقة وقل: "عذراً، أنا دليل استخدام لموقع عقارك الذكي فقط."
2. تحدث بلهجة مصرية ودودة ومحترفة.

📘 دليل استخدام موقع عقارك:

1️⃣ **التسجيل والدخول:**
- التسجيل برقم هاتف عليه واتساب (الكود بيوصل عليه).
- لإنشاء حساب: الاسم > اسم مستخدم (5+ حروف إنجليزي) > الرقم > الباسورد.
- نسيان الباسورد: اضغط "نسيت كلمة المرور" وهايجيلك كود ع الواتساب.

2️⃣ **تصفح الموقع:**
- الرئيسية فيها أحدث العقارات وشريط بحث ذكي.
- أزرار: "جميع العقارات"، "شراء"، "إيجار".
- زر "القائمة": فيه إعلاناتك، المفضلة، الخدمات، وتغيير الباسورد.
- زر "الخدمات": لشركاء التشطيب والنقل والكهرباء.

3️⃣ **اعرض عقارك (للبائعين):**
- دوس "اعرض عقارك" واملى البيانات.
- حدد الموقع ع الخريطة عشان الخدمات تظهر للمشتري.
- لو عندك فيديو، ابعتهولنا واتساب على 01008102237 واحنا هنضيفه.
- النشر بيتم في ثواني بعد المراجعة.

4️⃣ **تفاصيل العقار والتواصل:**
- صفحة العقار فيها كل التفاصيل (سعر، مساحة، تشطيب..) وزر "شاهد الفيديو".
- التواصل مع المالك مباشرة عن طريق زر "واتساب".
- تقدر تعمل "مشاركة"، "تفاوض"، أو تضيفه لـ "المفضلة".
- تحت العقار بنرشحلك 3 عقارات مشابهة.

5️⃣ **الدعم والميزات:**
- زر "الشكاوي" في الرئيسية لو واجهت مشكلة.
- ميزة "احجز عقارك": اطلب مواصفات معينة، وأول ما تتوفر هنبعتلك بيانات المالك فوراً.
- **ملحوظة:** خدمتنا مجانية 100% ولا نأخذ أي عمولة.
`;
// 👁️ موديل الرؤية (لفحص الصور والنص) - Flash سريع ورخيص ويدعم الصور
const modelVision = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

// ... إعدادات السيرفر ...
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PHONE = "01008102237"; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SALT_ROUNDS = 10;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_HMAC = process.env.PAYMOB_HMAC;
const PAYMOB_INTEGRATION_CARD = process.env.PAYMOB_INTEGRATION_CARD;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_INTEGRATION_WALLET = process.env.PAYMOB_INTEGRATION_WALLET;

const publicVapidKey = 'BABE4bntVm_6RWE3zuv305i65FfcTN8xd6C3d4jdEwML8d7yLwoVywbgvhS7U-q2KE3cmKqDbgvZ8rK97C3gKp4';
const privateVapidKey = 'cFJCSJoigPkZb-y4CxPsY9ffahOTxdlxAec3FVC3aKI';

webPush.setVapidDetails('mailto:aqarakproperty@gmail.com', publicVapidKey, privateVapidKey);

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// ============================================================
// 👤 إعدادات رفع صور البروفايل (Cloudinary + Multer)
// ============================================================

const storageProfiles = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aqarak_users',
        format: async () => 'webp', // تحويل تلقائي لـ webp للأداء
        public_id: (req, file) => `user-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }] // قص ذكي على الوجه
    } 
});

// تعريف المتغير لاستخدامه في الراوت
const uploadProfile = multer({ 
    storage: storageProfiles, 
    limits: { fileSize: 5 * 1024 * 1024 } // حد أقصى 5 ميجا
});


const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function pgQuery(sql, params = []) { return dbPool.query(sql, params); }
function safeInt(value) { return isNaN(parseInt(value)) ? 0 : parseInt(value); }// 🛠️ دالة تحويل الأرقام العربية إلى إنجليزية
function toEnglishDigits(str) {
    if (!str) return "0";
    return str.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^0-9.]/g, '');
}


// ==========================================================
// 🧠 1. نظام الواتساب (WhatsApp QR)
// ==========================================================

// إعداد عميل الواتساب مع إعدادات خاصة لسيرفر Render
const whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "aqarak-session" }), // حفظ الجلسة باسم محدد
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // ⚠️ مهم جداً: يمنع امتلاء الذاكرة المؤقتة ويحل مشكلة الانهيار
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // يقلل استهلاك الرامات
            '--disable-gpu'
        ]
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('📱 QR Code received. Scan it NOW:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ الواتساب متصل وجاهز!');
});

// التعامل مع فصل الاتصال وإعادة التشغيل تلقائياً
whatsappClient.on('disconnected', (reason) => {
    console.log('❌ تم فصل الواتساب:', reason);
    whatsappClient.initialize();
});

whatsappClient.initialize();
async function sendWhatsAppMessage(phone, message) {
    try {
        let formattedNumber = phone.replace(/\D/g, '');
        if (formattedNumber.startsWith('01')) formattedNumber = '2' + formattedNumber;
        const numberDetails = await whatsappClient.getNumberId(formattedNumber);
        if (numberDetails) {
            await whatsappClient.sendMessage(numberDetails._serialized, message);
            return true;
        } else {
            console.error(`❌ الرقم غير مسجل في واتساب: ${formattedNumber}`);
            return false;
        }
    } catch (error) {
        console.error("WhatsApp Send Error:", error);
        return false;
    }
}

setInterval(() => {
    fetch(`${APP_URL}/api/ping`).then(() => console.log('💓 Ping')).catch(e => {});
}, 5 * 60 * 1000);

const otpStore = {}; 

// ==========================================================
// 🧠 2. دوال المساعدة والذكاء الاصطناعي
// ==========================================================

async function deleteCloudinaryImages(imageUrls) {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) return;
    const publicIds = imageUrls.map(url => {
        try {
            const parts = url.split('/');
            const filename = parts.pop();
            const folder = parts.pop();
            const id = filename.split('.')[0];
            return `${folder}/${id}`; 
        } catch (e) { return null; }
    }).filter(id => id !== null);

    if (publicIds.length > 0) {
        try { await cloudinary.api.delete_resources(publicIds); } 
        catch (error) { console.error("Cloudinary Delete Error (Ignored):", error.message); }
    }
}

// ==========================================================
// ➕ إضافات جديدة: دوال المطابقة (Match Maker)
// ==========================================================

// 1. دالة تنظيف النصوص (عشان المقارنة تكون دقيقة)
function normalizeText(text) {
    if (!text) return "";
    return text.replace(/(أ|إ|آ)/g, 'ا').replace(/(ة)/g, 'ه').replace(/(ى)/g, 'ي').replace(/(ؤ|ئ)/g, 'ء').toLowerCase();
}

// 2. دالة المطابقة وإرسال الإشعارات (محدثة مع الكود السري)
async function checkAndNotifyMatches(propertyDetails, hiddenCode) {
    try {
        console.log("🔍 جاري البحث عن طلبات مطابقة للعقار الجديد...");
        const searchText = normalizeText(propertyDetails.title + " " + propertyDetails.description + " " + (propertyDetails.level || ''));
        
        // نجيب آخر 50 طلب شراء
        const requests = await pgQuery(`SELECT * FROM property_requests ORDER BY id DESC LIMIT 50`);
        
        let matchFound = false;

        for (const req of requests.rows) {
            const reqSpec = normalizeText(req.specifications);
            
            // شروط المطابقة: نفس النوع (شقة/فيلا) + كلمة مشتركة
            const isTypeMatch = (searchText.includes("شقه") && reqSpec.includes("شقه")) || 
                                (searchText.includes("فيلا") && reqSpec.includes("فيلا")) ||
                                (searchText.includes("محل") && reqSpec.includes("محل"));

            const reqWords = reqSpec.split(' ');
            let matchCount = 0;
            reqWords.forEach(w => {
                if (w.length > 3 && searchText.includes(w)) matchCount++;
            });

            if (isTypeMatch && matchCount >= 1) {
                matchFound = true;

                // 1. إشعار للمشتري (طالب العقار)
                const buyerMsg = `🎉 بشرى سارة يا ${req.name}!\n\nتم نشر عقار جديد قد يطابق طلبك: *${propertyDetails.title}*.\n💰 السعر: ${propertyDetails.price}\n\n🔗 التفاصيل: ${APP_URL}/property-details?id=${propertyDetails.id}\n\n📞 للتواصل مع المالك: ${propertyDetails.sellerPhone}`;
                await sendWhatsAppMessage(req.phone, buyerMsg);

                // 2. إشعار للبائع (ناشر العقار)
                const sellerMsg = `🚀 عقارك لقطة!\n\nيا هندسة، السيستم لقى مشتري كان طالب نفس مواصفات عقارك *(${propertyDetails.title})* وبعتناله تفاصيلك!\n\n👤 اسم المشتري المحتمل: ${req.name}\n📞 رقمه: ${req.phone}\n\nبالتوفيق في البيعة! 😉`;
                await sendWhatsAppMessage(propertyDetails.sellerPhone, sellerMsg);
                
                // 3. إشعار للأدمن على ديسكورد (بالتفاصيل الكاملة)
                await sendDiscordNotification("✅ 🔥 تطابق ناجح (Match Alert)", [
                    { name: "🏠 كود العقار", value: hiddenCode || "غير متوفر" },
                    { name: "👤 البائع", value: `${propertyDetails.sellerPhone}` },
                    { name: "👤 المشتري المهتم", value: `${req.name} - ${req.phone}` },
                    { name: "📝 مواصفات الطلب", value: req.specifications }
                ], 3066993); // لون أخضر

                console.log(`✅ ماتش! طلب رقم ${req.id} مع العقار الجديد.`);
            }
        }

        if (!matchFound) {
            console.log("ℹ️ لم يتم العثور على تطابق مباشر حالياً.");
        }

    } catch (e) {
        console.error("Matching Error:", e);
    }
}

async function sendDiscordNotification(title, fields, color = 3447003, imageUrl = null) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("ضع_رابط")) return;
    const embed = { title, color, fields, footer: { text: "Aqarak Bot 🏠" }, timestamp: new Date().toISOString() };
    if (imageUrl) embed.image = { url: imageUrl };
    try { await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) }); } catch (error) { console.error("Discord Error:", error.message); }
}

async function notifyAllUsers(title, body, url) {
    try {
        const result = await pgQuery('SELECT * FROM subscriptions');
        result.rows.forEach(sub => {
            webPush.sendNotification({ endpoint: sub.endpoint, keys: JSON.parse(sub.keys) }, JSON.stringify({ title, body, url, icon: '/logo.jpg' })).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) pgQuery('DELETE FROM subscriptions WHERE id = $1', [sub.id]);
            });
        });
    } catch (err) { console.error("Web Push Error:", err); }
}

// 🛠️ دالة لجلب الصورة من الرابط وتحويلها لـ Base64 للـ AI
async function urlToGenerativePart(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return {
            inlineData: {
                data: Buffer.from(arrayBuffer).toString("base64"),
                mimeType: "image/webp" // Cloudinary بيحولها webp حسب إعداداتنا
            },
        };
    } catch (error) {
        console.error("Error fetching image for AI:", error);
        return null;
    }
}

async function aiCheckProperty(title, description, price, imageUrls) {
    try {
        const imageParts = [];
        if (imageUrls && imageUrls.length > 0) {
            for (const url of imageUrls.slice(0, 4)) { // فحص حتى 4 صور لدقة أعلى
                const part = await urlToGenerativePart(url);
                if (part) imageParts.push(part);
            }
        }

        const prompt = `
أنت خبير عقاري ومراقب محتوى مصري. راجع البيانات والصور:
العنوان: ${title} | الوصف: ${description} | السعر: ${price}

المطلوب رد بصيغة JSON فقط:
{
  "status": "approved" أو "rejected" أو "pending",
  "reason": "سبب تقني لنا (للأدمن)",
  "user_message": "رسالة ودودة للمستخدم بالعامية المصرية تشرح له حالة إعلانه وماذا يفعل",
  "marketing_description": "وصف تسويقي جذاب بناءً على الصور",
  "detected_location": "اسم المنطقة"
}

⚠️ معايير الرسائل للمستخدم:
- Rejected: "يا فندم نعتذر، الإعلان مخالف لأنه (ذكر السبب زي: صور غير عقارية/ألفاظ غير لائقة)".
- Pending: "إعلانك وصل! بس محتاجين نراجعه يدوي عشان (ذكر السبب زي: الصور مش واضحة/السعر محتاج تأكيد/العنوان محتاج تفاصيل)".
- Approved: "مبروك! إعلانك اتنشر فوراً وبوصف احترافي".
`;
        const result = await modelVision.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Check Error:", error);
        return { status: "pending", reason: "AI Technical Error", marketing_description: description, detected_location: "" };
    }
}

// دالة توليد كود عشوائي للعقارات
function generateUniqueCode() {
    return 'AQ-' + Math.floor(100000 + Math.random() * 900000);
}

// ==========================================================
// 🧠 3. إعداد الجداول وقاعدة البيانات (محدثة)
// ==========================================================
async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, 
            name TEXT, 
            username TEXT UNIQUE, 
            phone TEXT NOT NULL UNIQUE, 
            password TEXT NOT NULL, 
            role TEXT DEFAULT 'user', 
            lifetime_posts INTEGER DEFAULT 0,
            is_banned BOOLEAN DEFAULT FALSE
        )`,
        
        `CREATE TABLE IF NOT EXISTS properties (
            id SERIAL PRIMARY KEY, title TEXT NOT NULL, price TEXT NOT NULL, "numericPrice" NUMERIC, 
            rooms INTEGER, bathrooms INTEGER, area INTEGER, description TEXT, 
            "imageUrl" TEXT, "imageUrls" TEXT, type TEXT NOT NULL, "hiddenCode" TEXT UNIQUE, 
            "sellerName" TEXT, "sellerPhone" TEXT, "publisherUsername" TEXT, 
            "isFeatured" BOOLEAN DEFAULT FALSE, "isLegal" BOOLEAN DEFAULT FALSE, "video_urls" TEXT[] DEFAULT '{}',
            "level" TEXT, "floors_count" INTEGER, "finishing_type" TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS seller_submissions (
            id SERIAL PRIMARY KEY, "sellerName" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL, 
            "propertyTitle" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "propertyPrice" TEXT NOT NULL, 
            "propertyArea" INTEGER, "propertyRooms" INTEGER, "propertyBathrooms" INTEGER, 
            "propertyDescription" TEXT, "imagePaths" TEXT, "submissionDate" TEXT, status TEXT DEFAULT 'pending',
            "propertyLevel" TEXT, "propertyFloors" INTEGER, "propertyFinishing" TEXT,
            "ai_review_note" TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS property_requests (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, specifications TEXT NOT NULL, "submissionDate" TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_phone TEXT NOT NULL, property_id INTEGER NOT NULL, UNIQUE(user_phone, property_id))`,
        `CREATE TABLE IF NOT EXISTS property_offers (id SERIAL PRIMARY KEY, property_id INTEGER, buyer_name TEXT, buyer_phone TEXT, offer_price TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, endpoint TEXT UNIQUE, keys TEXT)`,
        `CREATE TABLE IF NOT EXISTS bot_settings (id SERIAL PRIMARY KEY, setting_key TEXT UNIQUE, setting_value TEXT)`,
        
        // الجدول الجديد للشكاوي
        `CREATE TABLE IF NOT EXISTS complaints (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            user_name TEXT,
            user_phone TEXT,
            content TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT
        )`
    ];

    try { 
        for (const query of queries) await pgQuery(query); 
        
        // أمر تحديث لإضافة عمود الحظر للمستخدمين القدامى (Migration)
        await pgQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE`);
        
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING`, ['system_prompt', DEFAULT_SYSTEM_INSTRUCTION]);

        await pgQuery(`
            CREATE OR REPLACE FUNCTION increment_post_count() RETURNS TRIGGER AS $$
            BEGIN
                UPDATE users SET lifetime_posts = lifetime_posts + 1 WHERE phone = NEW."sellerPhone";
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await pgQuery(`DROP TRIGGER IF EXISTS trigger_post_count ON properties`);
        await pgQuery(`CREATE TRIGGER trigger_post_count AFTER INSERT ON properties FOR EACH ROW EXECUTE FUNCTION increment_post_count();`);

        console.log('✅ Tables, Triggers & Ban System synced.'); 
    } 
    catch (err) { console.error('❌ Table Sync Error:', err); }
}
createTables();

const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const storageSeller = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: 'aqarak_submissions', format: async () => 'webp', public_id: (req, file) => `seller-${Date.now()}-${Math.round(Math.random() * 1E9)}` } });
const uploadSeller = multer({ storage: storageSeller, limits: { fileSize: MAX_FILE_SIZE } });
const storageProperties = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: 'aqarak_properties', format: async () => 'webp', public_id: (req, file) => `property-${Date.now()}-${Math.round(Math.random() * 1E9)}` } });
const uploadProperties = multer({ storage: storageProperties, limits: { fileSize: MAX_FILE_SIZE } });
// ... (بعد إعدادات storageProperties الموجودة)

app.use(cors({ origin: true, credentials: true })); 
app.use(express.json());
app.use(cookieParser());

// 🌐 إعدادات الملفات الاستاتيكية والتوجيه (مهم لإصلاح مشكلة 404)
app.use(express.static(path.join(__dirname, 'public'), { 
    extensions: ['html'], 
    index: false 
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// ==========================================================
// 🧠 4. خوارزميات البحث الذكي
// ==========================================================
const EGYPT_LOCATIONS = {
    "قاهرة": ["القاهرة", "التجمع", "الشروق", "مدينتي", "الرحاب", "المستقبل", "العاصمة الادارية", "مصر الجديدة", "مدينة نصر", "المعادي", "زهراء المعادي", "المقطم", "القطامية", "الزيتون", "عين شمس", "المرج", "السلام", "العباسية", "وسط البلد", "الزمالك", "جاردن سيتي", "شبرا مصر", "حلوان", "المعصرة", "15 مايو", "بدر", "حدائق القبة", "الوايلي", "المنيل", "السيدة زينب", "الازبكية", "بولاق", "عابدين", "الموسكي", "الخليفة", "المطرية", "النزهة", "شيراتون", "الالف مسكن", "الحلمية", "منشأة ناصر", "طرة", "المعصرة", "التبين"],
    "جيزة": ["الجيزة", "6 أكتوبر", "الشيخ زايد", "حدائق الأهرام", "الدقي", "المهندسين", "الهرم", "فيصل", "العجوزة", "إمبابة", "الوراق", "بولاق الدكرور", "العمرانية", "المنيب", "البدرشين", "العياط", "الصف", "أطفيح", "كرداسة", "أوسيم", "الحوامدية", "حدائق اكتوبر", "ابو النمرس", "منشأة القناطر", "الواحات البحرية", "ميت عقبة", "بين السرايات", "الكيت كات", "أرض اللواء", "ناهيا", "صفط اللبن", "كفر طهرمس", "الطوابق", "المريوطية", "الرماية"],
    "اسكندرية": ["الاسكندرية", "سموحة", "ميامي", "سيدي بشر", "المنتزه", "العجمي", "الساحل الشمالي", "محرم بك", "الشاطبي", "كامب شيزار", "الإبراهيمية", "سبورتنج", "كليوباترا", "سيدي جابر", "رشدي", "جليم", "زيزينيا", "باكوس", "فلمنج", "الظاهرية", "العصافرة", "المندرة", "المعمورة", "أبوقير", "الهانوفيل", "البيطاش", "الكيلو 21", "كينج مريوط", "برج العرب", "العامرية", "الدخيلة", "المكس", "القباري", "كرموز", "غيط العنب", "كوم الدكة", "العطارين", "المنشية", "الجمرك", "الانفوشي", "راس التين", "المندرة", "ابيس"],
};

function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function normalizeText(text) {
    if (!text) return "";
    return text.replace(/(أ|إ|آ)/g, 'ا').replace(/(ة)/g, 'ه').replace(/(ى)/g, 'ي').replace(/(ؤ|ئ)/g, 'ء').toLowerCase();
}

function expandSearchKeywords(message) {
    const normalizedMsg = normalizeText(message);
    const userWords = normalizedMsg.split(/\s+/); 
    let expandedKeywords = [];
    for (const [gov, cities] of Object.entries(EGYPT_LOCATIONS)) {
        for (const word of userWords) {
            if (word.length < 3) continue;
            const normGov = normalizeText(gov);
            if (getLevenshteinDistance(word, normGov) <= 1 || normGov.includes(word)) { expandedKeywords.push(gov); }
            for (const city of cities) {
                const normCity = normalizeText(city);
                const tolerance = normCity.length > 5 ? 2 : 1; 
                if (getLevenshteinDistance(word, normCity) <= tolerance || normCity.includes(word)) {
                    expandedKeywords.push(gov);
                    expandedKeywords.push(city);
                }
            }
        }
    }
    return [...new Set(expandedKeywords)];
}

// ==========================================================
// 🧠 5. API الشات والتعليم
// ==========================================================
const chatHistories = {};
const TIMEOUT_MS = 15 * 60 * 1000; 
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of Object.entries(chatHistories)) {
        if (session.lastActive && (now - session.lastActive) > TIMEOUT_MS) delete chatHistories[id]; 
    }
}, 5 * 60 * 1000); 

app.post('/api/admin/update-prompt', async (req, res) => {
    const token = req.cookies.auth_token;
    try { 
        const decoded = jwt.verify(token, JWT_SECRET);
        if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); 
        const { newPrompt } = req.body;
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ('system_prompt', $1) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`, [newPrompt]);
        for (const id in chatHistories) delete chatHistories[id];
        res.json({ success: true, message: 'تم التحديث' });
    } catch(e) { return res.status(401).json({message: 'خطأ'}); }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const sessionId = req.cookies.auth_token || 'guest_' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        if (!message) return res.json({ reply: "" });

        let systemPrompt = DEFAULT_SYSTEM_INSTRUCTION;
        const settingsRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'system_prompt'");
        if (settingsRes.rows.length > 0) systemPrompt = settingsRes.rows[0].setting_value;

        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = { history: [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "تمام." }] }], lastActive: Date.now() };
        } else { chatHistories[sessionId].lastActive = Date.now(); }

        if (chatHistories[sessionId].awaitingPassword) {
            if (message.trim() === ADMIN_PASSWORD) {
                const newInstruction = chatHistories[sessionId].pendingInstruction;
                const updatedPrompt = systemPrompt + `\n* ${newInstruction}`;
                await pgQuery("INSERT INTO bot_settings (setting_key, setting_value) VALUES ('system_prompt', $1) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1", [updatedPrompt]);
                delete chatHistories[sessionId].awaitingPassword;
                delete chatHistories[sessionId].pendingInstruction;
                chatHistories[sessionId].history = [{ role: "user", parts: [{ text: updatedPrompt }] }, { role: "model", parts: [{ text: "تم حفظ التعليمات." }] }];
                return res.json({ reply: "✅ تمام يا هندسة، حفظت المعلومة!" });
            } else {
                delete chatHistories[sessionId].awaitingPassword;
                delete chatHistories[sessionId].pendingInstruction;
                return res.json({ reply: "❌ الباسورد غلط." });
            }
        }

        if (message.trim().startsWith("تعلم ") || message.trim().startsWith("learn ")) {
            const instruction = message.replace(/^(تعلم|learn)\s+/i, "").trim();
            if (instruction) {
                chatHistories[sessionId].awaitingPassword = true;
                chatHistories[sessionId].pendingInstruction = instruction;
                return res.json({ reply: "🔒 عشان أعتمد المعلومة، محتاج **باسورد الأدمن**:" });
            }
        }

        const phoneRegex = /(010|011|012|015)\d{8}/;
        const phoneMatch = message.match(phoneRegex);
        if (phoneMatch) {
            const recentHistory = chatHistories[sessionId].history.slice(2).slice(-6);
            let contextText = recentHistory.map(h => `**${h.role === 'user' ? '👤' : '🤖'}:** ${h.parts[0].text.substring(0, 100)}...`).join('\n');
            if (!contextText) contextText = "لا يوجد سياق.";
            await sendDiscordNotification("🎯 Lead Alert!", [{ name: "📞 الرقم", value: phoneMatch[0] }, { name: "💬 الرسالة", value: message }, { name: "📜 السياق", value: contextText }], 15158332);
        }

        let dbContext = "";
        let finalPrompt = message;
        let intendedLocation = false;
        const potentialKeywords = expandSearchKeywords(message);
        if (potentialKeywords.length > 0) intendedLocation = true;


        finalPrompt = message + dbContext;
        const chatSession = modelChat.startChat({ history: chatHistories[sessionId].history, generationConfig: { maxOutputTokens: 2000, temperature: 0.0 }, });
        const result = await chatSession.sendMessage(finalPrompt);
        let reply = result.response.text();
        reply = reply.replace(/```html/g, '').replace(/```/g, '').trim();
        chatHistories[sessionId].history.push({ role: "user", parts: [{ text: finalPrompt }] });
        chatHistories[sessionId].history.push({ role: "model", parts: [{ text: reply }] });
        res.json({ reply: reply });
    } catch (error) { console.error("Gemini Error:", error); res.status(500).json({ reply: "معلش يا هندسة، النت تقيل. جرب تاني!" }); }
});

// ==========================================================
// 🚀 6. نظام التوثيق والمصادقة (API)
// ==========================================================

app.post('/api/check-username', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ available: false });
    if (username.length < 5) return res.json({ available: false, message: 'invalid_length' });
    const validRegex = /^[a-z0-9_.]+$/; 
    if (!validRegex.test(username)) return res.json({ available: false, message: 'invalid_format' });
    try {
        const result = await pgQuery('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
        if (result.rows.length > 0) res.json({ available: false, message: 'taken' });
        else res.json({ available: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/send-otp', async (req, res) => {
    const { phone, type } = req.body; 
    if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
    try {
        const userCheck = await pgQuery('SELECT id FROM users WHERE phone = $1', [phone]);
        const userExists = userCheck.rows.length > 0;
        if (type === 'register' && userExists) return res.status(409).json({ success: false, message: 'هذا الرقم مسجل بالفعل' });
        if (type === 'reset' && !userExists) return res.status(404).json({ success: false, message: 'رقم غير مسجل' });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStore[phone] = { code: otp, expires: Date.now() + 10 * 60 * 1000 };
        const message = `🔐 كود التحقق الخاص بك في *عقارك* هو: *${otp}*`;
        const sent = await sendWhatsAppMessage(phone, message);
        if (sent) res.json({ success: true, message: 'تم إرسال الكود' });
        else res.status(500).json({ success: false, message: 'فشل إرسال الرسالة' });
    } catch (e) { res.status(500).json({ message: 'خطأ في السيرفر' }); }
});

app.post('/api/register', uploadProfile.single('profileImage'), async (req, res) => {
    // البيانات تأتي الآن داخل req.body والصورة في req.file
    const { name, phone, password, otp } = req.body;
    let { username } = req.body;
    username = username ? username.toLowerCase().trim() : '';
    
    // رابط الصورة (لو رفع صورة هناخد الرابط، لو لا هنسيبها null)
    const profilePicUrl = req.file ? req.file.path : null;

    if (!otpStore[phone] || otpStore[phone].code !== otp) {
        // حذف الصورة لو الكود غلط عشان منخزنش ملفات عالفاضي
        if (req.file) await deleteCloudinaryImages([req.file.path]); 
        return res.status(400).json({ message: 'كود التحقق غير صحيح' });
    }
    
    try {
        // التحقق من الحظر
        const banCheck = await pgQuery('SELECT is_banned FROM users WHERE phone = $1', [phone]);
        if (banCheck.rows.length > 0 && banCheck.rows[0].is_banned) {
            return res.status(403).json({ message: '⛔ هذا الرقم محظور.' });
        }

        if (username.length < 5) return res.status(400).json({ message: 'اسم المستخدم قصير' });
        
        const userCheck = await pgQuery('SELECT id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) return res.status(409).json({ message: 'اسم المستخدم محجوز' });

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        // ✅ الإضافة: تخزين profile_picture
        // (تأكد أنك قمت بإضافة العمود للداتابيز كما اتفقنا)
        await pgQuery(
            `INSERT INTO users (name, username, phone, password, role, profile_picture) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [name, username, phone, hashedPassword, 'user', profilePicUrl]
        );
        
        delete otpStore[phone];
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح' });

    } catch (error) { 
        console.error("Register Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' }); 
    }
});
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    
    // دخول الأدمن (تجاوز الفحص)
    if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ id: 1932024, phone: ADMIN_PHONE, role: 'admin', username: 'admin', name: 'المدير العام' }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite:'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.json({ success: true, role: 'admin', username: 'admin', name: 'المدير العام' });
    }

    try {
        const r = await pgQuery(`SELECT * FROM users WHERE phone=$1`, [phone]);
        if (!r.rows[0]) return res.status(404).json({ success: false, errorType: 'phone', message: 'رقم الهاتف غير مسجل' });
        
        // ⛔ التحقق من الحظر
        if (r.rows[0].is_banned) {
            return res.status(403).json({ success: false, message: '⛔ حسابك محظور من استخدام الموقع. تواصل مع الإدارة عبر واتساب.' });
        }

        if (!(await bcrypt.compare(password, r.rows[0].password))) return res.status(401).json({ success: false, errorType: 'password', message: 'كلمة المرور خطأ' });
        
        const user = r.rows[0];
        const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite:'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, role: user.role, username: user.username, name: user.name });

    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    if (!otpStore[phone] || otpStore[phone].code !== otp) return res.status(400).json({ message: 'الكود غير صحيح' });
    try {
        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pgQuery(`UPDATE users SET password = $1 WHERE phone = $2`, [hash, phone]);
        delete otpStore[phone];
        res.json({ success: true, message: 'تم تغيير كلمة المرور' });
    } catch (err) { res.status(500).json({ message: 'خطأ' }); }
});

// ✅ التعديل: التحقق من الحظر في كل مرة يفتح فيها الموقع
// تعديل API التحقق (Real-time Ban Check)
// تعديل API التحقق (يعالج مشكلة خروج الأدمن)
// ✅ التعديل: التحقق من الحظر في كل مرة يفتح فيها الموقع (Real-time Check)
// ✅ تعديل API التحقق (لحل مشكلة Undefined عند الحظر)
app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ isAuthenticated: false, role: 'guest' });
    
    try { 
        // نتجاوز التحقق من التوكن هنا لنقرأ البيانات حتى لو المستخدم محظور
        const decoded = jwt.decode(token); // استخدام decode بدلاً من verify مبدئياً لقراءة الـ ID
        if (!decoded || !decoded.id) return res.json({ isAuthenticated: false, role: 'guest' });

        // لو أدمن
        if (decoded.role === 'admin' && decoded.phone === ADMIN_PHONE) {
             return res.json({ isAuthenticated: true, role: 'admin', phone: decoded.phone, username: 'admin', name: 'المدير العام', balance: 999999, isPaymentActive: true, is_verified: true });
        }

        // جلب بيانات المستخدم
        const userRes = await pgQuery('SELECT role, phone, username, name, is_banned, wallet_balance, is_verified, profile_picture FROM users WHERE id = $1', [decoded.id]);
        
        if (userRes.rows.length === 0) return res.json({ isAuthenticated: false, role: 'guest' });
        const user = userRes.rows[0];

        // 🔥 هنا الإصلاح: إرسال البيانات مع حالة الحظر
        if (user.is_banned) {
            return res.status(403).json({ 
                isAuthenticated: false, 
                banned: true,
                username: user.username,
                phone: user.phone,
                name: user.name
            });
        }

        let isPaymentActive = false;
        const settingsRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'payment_active'");
        if (settingsRes.rows.length > 0) isPaymentActive = settingsRes.rows[0].setting_value === 'true';

        res.json({ 
            isAuthenticated: true, 
            role: user.role, 
            phone: user.phone, 
            username: user.username, 
            name: user.name,
            balance: parseFloat(user.wallet_balance || 0),
            is_verified: user.is_verified, 
            profile_picture: user.profile_picture,
            isPaymentActive: isPaymentActive
        }); 
    } 
    catch (err) { res.json({ isAuthenticated: false, role: 'guest' }); }
});
app.post('/api/logout', (req, res) => { res.clearCookie('auth_token'); res.json({ success: true }); });

// ==========================================================
// 🏠 Property & Admin APIs (مع فحص AI المطور والبيانات الجديدة)
// ==========================================================

// 🟢 استقبال طلب بيع (مؤمن + فحص AI ذكي + بيانات ديناميكية)
// 🟢 استقبال طلب بيع (النسخة المحدثة مع المطابقة ورأي AI)
// 🟢 استقبال طلب بيع (تم إصلاح مشكلة السعر 0)
// 🟢 استقبال طلب بيع (النسخة الاحترافية - Modal + AI + Match Maker)
// 🟢 استقبال طلب بيع (مع نظام الخصم من الرصيد)
app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ success: false, message: 'سجل دخول أولاً' });

    let realUser;
    try { 
        realUser = jwt.verify(token, JWT_SECRET); 
    } catch (err) { 
        return res.status(403).json({ success: false, message: 'جلسة غير صالحة' }); 
    }

    const sellerName = realUser.name || realUser.username || 'مستخدم عقارك';
    const sellerPhone = realUser.phone; 
    const publisherUsername = realUser.username; 

    // ✅ 1. تعريف المتغير هنا ليكون مرئياً في نهاية الدالة
    let isPaidSystem = false; 

    // --- 💰 منطق الدفع والخصم (المصحح) ---
    try {
        // ✅ قراءة المفتاح الصحيح المتوافق مع لوحة الأدمن
        const settingsRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'payment_active'");
        
        if (settingsRes.rows.length > 0) {
            // القيمة تخزن كنص 'true' أو 'false'
            isPaidSystem = settingsRes.rows[0].setting_value === 'true';
        }

        // لو النظام مدفوع، نخصم الرصيد
        if (isPaidSystem) {
            const COST_PER_AD = 1; // تكلفة الإعلان الواحد

            // التحقق من رصيد المستخدم
            const balanceRes = await pgQuery("SELECT wallet_balance FROM users WHERE phone = $1", [sellerPhone]);
            const currentBalance = parseFloat(balanceRes.rows[0]?.wallet_balance || 0);

            if (currentBalance < COST_PER_AD) {
                return res.status(402).json({ 
                    success: false, 
                    message: 'عفواً، رصيد نقاطك لا يكفي لنشر العقار. يرجى شحن رصيدك أولاً.',
                    needCharge: true 
                });
            }

            // خصم الرصيد
            await pgQuery("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE phone = $2", [COST_PER_AD, sellerPhone]);
            
            // تسجيل العملية
            await pgQuery(`INSERT INTO transactions (user_phone, amount, type, description, date) VALUES ($1, $2, 'withdraw', 'خصم تكلفة نشر عقار', $3)`, 
                [sellerPhone, COST_PER_AD, new Date().toISOString()]);
                
            console.log(`💰 تم خصم ${COST_PER_AD} نقطة من ${sellerPhone}`);
        }
    } catch (paymentError) {
        console.error("Payment Error:", paymentError);
        return res.status(500).json({ success: false, message: 'حدث خطأ في نظام الدفع' });
    }
    // --- نهاية منطق الدفع ---

    const { 
        propertyTitle, propertyType, propertyPrice, propertyArea, propertyDescription, 
        propertyRooms, propertyBathrooms, propertyLevel, propertyFloors, propertyFinishing,
        nearby_services, latitude, longitude 
    } = req.body;

    const latVal = latitude ? parseFloat(latitude) : null;
    const lngVal = longitude ? parseFloat(longitude) : null;
    const files = req.files || [];
    const paths = files.map(f => f.path).join(' | ');
    const code = generateUniqueCode();
    const englishPrice = toEnglishDigits(propertyPrice); 
    const numericPrice = parseFloat(englishPrice); 

    try {
        console.log("🤖 AI جاري فحص العقار وتحليل البيانات...");
        const imageUrls = files.map(f => f.path);
        
        const aiReview = await aiCheckProperty(propertyTitle, propertyDescription, englishPrice, imageUrls);

        let finalStatus = aiReview.status; 
        let isPublic = (finalStatus === 'approved');
        
        // ✅ 2. استخدام وصف المستخدم دائماً (إلغاء اقتراح AI)
        const finalDescription = propertyDescription;

        await pgQuery(`
            INSERT INTO seller_submissions 
            ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", 
             "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate", status,
             "propertyLevel", "propertyFloors", "propertyFinishing", "ai_review_note", 
             "nearby_services", "latitude", "longitude") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
            sellerName, sellerPhone, propertyTitle, propertyType, englishPrice,
            safeInt(propertyArea), safeInt(propertyRooms), safeInt(propertyBathrooms), 
            finalDescription, paths, new Date().toISOString(), finalStatus,
            propertyLevel || '', safeInt(propertyFloors), propertyFinishing || '',
            aiReview.user_message,
            nearby_services || '', latVal, lngVal
        ]);

        if (isPublic) {
            const pubRes = await pgQuery(`
                INSERT INTO properties 
                (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, 
                 "hiddenCode", "sellerName", "sellerPhone", "publisherUsername", "isFeatured", "isLegal", 
                 "level", "floors_count", "finishing_type", "nearby_services", "latitude", "longitude")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, false, false, $15, $16, $17, $18, $19, $20)
                RETURNING id
            `, [
                propertyTitle, englishPrice, numericPrice,
                safeInt(propertyRooms), safeInt(propertyBathrooms), safeInt(propertyArea), finalDescription,
                files.length > 0 ? files[0].path : 'logo.png', JSON.stringify(imageUrls), 
                propertyType, code, sellerName, sellerPhone, publisherUsername,
                propertyLevel || '', safeInt(propertyFloors), propertyFinishing || '',
                nearby_services || '', latVal, lngVal
            ]);

            // إشعار المطابقة (واتساب)
            checkAndNotifyMatches({
                id: pubRes.rows[0].id,
                title: propertyTitle,
                description: finalDescription,
                price: englishPrice,
                level: propertyLevel,
                sellerPhone: sellerPhone
            }, code);

            // Web Push لكل المستخدمين
            notifyAllUsers(`عقار جديد: ${propertyTitle}`, `تم نشر عقار ${propertyType} بسعر ${englishPrice}`, `/property-details?id=${pubRes.rows[0].id}`);

            // ✅ (تصحيح مكان الإشعار) نرسل "تم النشر" هنا فقط
            await createNotification(
                sellerPhone, 
                'تم النشر بنجاح ✅', 
                `تم نشر عقارك "${propertyTitle}" فوراً بنجاح ويظهر الآن للجميع.`
            );

        } else {
            // ✅ (إضافة) نرسل "قيد المراجعة" لو العقار لم ينشر فوراً
            await createNotification(
                sellerPhone, 
                'طلبك قيد المراجعة ⏳', 
                `تم استلام عقارك "${propertyTitle}" وسيقوم فريق المراجعة بفحصه في أقرب وقت.`
            );
        }

        // إشعار ديسكورد (ثابت)
        await sendDiscordNotification(`📢 عقار جديد (${finalStatus})`, [
            { name: "👤 المالك", value: sellerName },
            { name: "🤖 تقرير AI", value: aiReview.reason },
            { name: "💰 حالة الدفع", value: isPaidSystem ? "تم خصم نقطة واحدة" : "مجاني" }
        ], isPublic ? 3066993 : 16776960, files[0]?.path);

        await createNotification(
                sellerPhone, 
                'تم النشر بنجاح ✅', 
                `تم نشر عقارك "${propertyTitle}" فوراً بنجاح بعد اجتياز الفحص الآلي.`
            );

        await sendDiscordNotification(`📢 عقار جديد (${finalStatus})`, [
            { name: "👤 المالك", value: sellerName },
            { name: "🤖 تقرير AI", value: aiReview.reason },
            { name: "💰 حالة الدفع", value: isPaidSystem ? "تم خصم نقطة واحدة" : "مجاني" }
        ], isPublic ? 3066993 : 16776960, files[0]?.path);

        // ✅ 4. الرد النهائي الديناميكي (إصلاح رسالة الخصم)
        res.status(200).json({ 
            success: true, 
            status: finalStatus, 
            // العنوان يتغير حسب المجاني/المدفوع وحسب القبول/المراجعة
            title: isPublic 
                ? (isPaidSystem ? "تم النشر وتم خصم 1 نقطة 🎉" : "تم النشر بنجاح 🎉") 
                : (isPaidSystem ? "طلبك قيد المراجعة (تم خصم نقطة)" : "طلبك قيد المراجعة"),
            
            // الرسالة ثابتة من السيستم بدلاً من كلام AI
            message: isPublic 
                ? "تم نشر عقارك بنجاح ويظهر الآن لجميع المستخدمين." 
                : "تم استلام طلبك وسيقوم فريق المراجعة بفحصه في أقرب وقت.",
            
            marketing_desc: null, 
            location: aiReview.detected_location
        }); 

    } catch (err) { 
        console.error("Route Error:", err); 
        res.status(500).json({ success: false, message: 'حدث خطأ فني، جرب تاني' }); 
    }
});
app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => { 
    const files = req.files || []; 
    const data = req.body; 
    const urls = files.map(f => f.path);

    // تجهيز البيانات
    const latVal = data.latitude ? parseFloat(data.latitude) : null;
    const lngVal = data.longitude ? parseFloat(data.longitude) : null;

    const sql = `
        INSERT INTO properties (
            title, price, "numericPrice", rooms, bathrooms, area, description, 
            "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "publisherUsername", 
            "isFeatured", "isLegal", "video_urls",
            "level", "floors_count", "finishing_type", "latitude", "longitude"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, 
            $8, $9, $10, $11, $12, $13, $14, 
            $15, $16, $17,
            $18, $19, $20, $21, $22
        ) RETURNING id
    `;
    
    const params = [
        data.title, 
        data.price, 
        parseFloat((data.price || '0').replace(/[^0-9.]/g,'')), 
        safeInt(data.rooms), 
        safeInt(data.bathrooms), 
        safeInt(data.area), 
        data.description, 
        urls[0] || 'logo.png', // الصورة الرئيسية
        JSON.stringify(urls), 
        data.type, 
        data.hiddenCode, 
        "Admin", 
        ADMIN_EMAIL, 
        "admin", 
        false, 
        false, 
        '{}', // فيديو فارغ مبدئياً
        data.level || '', 
        safeInt(data.floors), 
        data.finishing || '',
        latVal, 
        lngVal
    ]; 

    try { 
        const result = await pgQuery(sql, params); 
        res.status(201).json({ success: true, message: 'تم نشر العقار بنجاح! 🎉', id: result.rows[0].id }); 
    } catch (err) { 
        console.error("Add Property Error:", err);
        res.status(400).json({ message: 'حدث خطأ أثناء النشر: ' + err.message }); 
    } 
});

app.put('/api/admin/toggle-badge/:id', async (req, res) => { const token = req.cookies.auth_token; try { const decoded = jwt.verify(token, JWT_SECRET); if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); } catch(e) { return res.status(401).json({message: 'سجل دخول أولاً'}); } try { await pgQuery(`UPDATE properties SET "${req.body.type}" = $1 WHERE id = $2`, [req.body.value, req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ message: 'Error' }); } });
app.post('/api/subscribe', async (req, res) => { try { await pgQuery(`INSERT INTO subscriptions (endpoint, keys) VALUES ($1, $2) ON CONFLICT (endpoint) DO NOTHING`, [req.body.endpoint, JSON.stringify(req.body.keys)]); res.status(201).json({}); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/make-offer', async (req, res) => { const { propertyId, buyerName, buyerPhone, offerPrice } = req.body; try { await pgQuery(`INSERT INTO property_offers (property_id, buyer_name, buyer_phone, offer_price, created_at) VALUES ($1, $2, $3, $4, $5)`, [propertyId, buyerName, buyerPhone, offerPrice, new Date().toISOString()]); const propRes = await pgQuery('SELECT title FROM properties WHERE id = $1', [propertyId]); await sendDiscordNotification("💰 عرض سعر جديد", [{ name: "🏠 العقار", value: propRes.rows[0]?.title || 'غير معروف' }, { name: "📉 العرض", value: `${offerPrice} ج.م` }, { name: "👤 المشتري", value: `${buyerName} - ${buyerPhone}` }], 16753920); res.status(200).json({ success: true }); } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } });

// نشر العقار من الأدمن (نقل البيانات الجديدة أيضاً)
app.post('/api/admin/publish-submission', async (req, res) => {
    const token = req.cookies.auth_token;
    // التحقق من الأدمن
    try { 
        const decoded = jwt.verify(token, JWT_SECRET); 
        if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); 
    } catch(e) { return res.status(401).json({message: 'سجل دخول أولاً'}); }

    const { submissionId, hiddenCode } = req.body;
    
    try {
        const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]);
        if (subRes.rows.length === 0) return res.status(404).json({ message: 'الطلب غير موجود' });
        const sub = subRes.rows[0];
        
        // جلب اسم المستخدم (للنشر)
        let publisherUsername = null;
        const userCheck = await pgQuery(`SELECT username FROM users WHERE phone = $1`, [sub.sellerPhone]);
        if (userCheck.rows.length > 0) publisherUsername = userCheck.rows[0].username;
        
        const imageUrls = (sub.imagePaths || '').split(' | ').filter(Boolean);
        
        // 1. نقل العقار لجدول Properties
        const sql = `
            INSERT INTO properties (
                title, price, "numericPrice", rooms, bathrooms, area, description, 
                "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", 
                "publisherUsername", "isFeatured", "isLegal", "video_urls",
                "level", "floors_count", "finishing_type", "nearby_services", "latitude", "longitude"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, 
                $14, false, false, '{}',
                $15, $16, $17, $18, $19, $20
            ) RETURNING id
        `;
        const params = [
            sub.propertyTitle, sub.propertyPrice, parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), 
            safeInt(sub.propertyRooms), safeInt(sub.propertyBathrooms), safeInt(sub.propertyArea), sub.propertyDescription, 
            imageUrls[0] || '', JSON.stringify(imageUrls), sub.propertyType, hiddenCode, sub.sellerName, sub.sellerPhone, 
            publisherUsername,
            sub.propertyLevel, safeInt(sub.propertyFloors), sub.propertyFinishing,
            sub.nearby_services || '', sub.latitude, sub.longitude
        ];
        
        const result = await pgQuery(sql, params);
        
        // 2. حذف الطلب من قائمة الانتظار
        await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]);

        // ✅ 3. (الإضافة الجديدة) إرسال إشعار لصاحب العقار
        await createNotification(
            sub.sellerPhone, 
            '🎉 مبروك! تم قبول عقارك', 
            `تمت مراجعة عقارك "${sub.propertyTitle}" والموافقة عليه. هو الآن منشور ويظهر للجميع.`
        );

        // 4. إشعار عام لكل المستخدمين (Web Push)
        notifyAllUsers(`عقار جديد!`, sub.propertyTitle, `/property-details?id=${result.rows[0].id}`);
        
        res.status(201).json({ success: true, id: result.rows[0].id });

    } catch (err) { 
        console.error("Publish Error:", err); 
        res.status(400).json({ message: 'Error' }); 
    }
});
app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => { 
    const { 
        title, price, rooms, bathrooms, area, description, type, hiddenCode, 
        existingImages, video_urls,
        level, floors, finishing, latitude, longitude // البيانات الجديدة
    } = req.body; 

    // معالجة الصور
    let oldUrls = []; 
    try { oldUrls = JSON.parse((Array.isArray(existingImages) ? existingImages[0] : existingImages) || '[]'); } catch(e) {} 
    const newUrls = req.files ? req.files.map(f => f.path) : []; 
    const allUrls = [...oldUrls, ...newUrls]; 
    const mainImg = allUrls.length > 0 ? allUrls[0] : 'logo.png';

    // معالجة الفيديو
    let videoUrlsArr = []; 
    try { videoUrlsArr = JSON.parse(video_urls || '[]'); } catch(e) {} 

    // معالجة الموقع
    const latVal = latitude ? parseFloat(latitude) : null;
    const lngVal = longitude ? parseFloat(longitude) : null;

    const sql = `
        UPDATE properties SET 
            title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, 
            "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11, "video_urls"=$12,
            "level"=$13, "floors_count"=$14, "finishing_type"=$15, "latitude"=$16, "longitude"=$17
        WHERE id=$18
    `; 
    
    const params = [
        title, 
        price, 
        parseFloat((price||'0').replace(/[^0-9.]/g,'')), 
        safeInt(rooms), 
        safeInt(bathrooms), 
        safeInt(area), 
        description, 
        mainImg, 
        JSON.stringify(allUrls), 
        type, 
        hiddenCode, 
        videoUrlsArr,
        level || '',
        safeInt(floors),
        finishing || '',
        latVal,
        lngVal,
        req.params.id
    ]; 

    try { 
        await pgQuery(sql, params); 
        res.status(200).json({ message: 'تم تحديث بيانات العقار بنجاح! ✅' }); 
    } catch (err) { 
        console.error("Update Error:", err);
        res.status(400).json({ message: `فشل التحديث: ${err.message}` }); 
    } 
});
app.post('/api/request-property', async (req, res) => { const { name, phone, email, specifications } = req.body; try { await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]); await sendDiscordNotification("📩 طلب عقار مخصص", [{ name: "👤 الاسم", value: name }, { name: "📝 المواصفات", value: specifications }], 15158332); res.status(200).json({ success: true }); } catch (err) { throw err; } });
app.get('/api/admin/seller-submissions', async (req, res) => { try { const r = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.get('/api/admin/property-requests', async (req, res) => { try { const r = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.delete('/api/admin/seller-submission/:id', async (req, res) => { try { const r = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]); if(r.rows[0]) await deleteCloudinaryImages((r.rows[0].imagePaths || '').split(' | ')); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { console.error("Delete Error:", err); res.status(500).json({ message: 'فشل الحذف' }); } });
app.delete('/api/admin/property-request/:id', async (req, res) => { try { await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });
// ==========================================================
// 🌟 10. نظام باقات التميز (Premium Plans) - جديد
// ==========================================================

// 1. رابط لإنشاء عمود تاريخ الانتهاء (شغله مرة واحدة)
app.get('/update-db-featured', async (req, res) => {
    try {
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "featured_expires_at" TEXT`);
        res.send('✅ تم تحديث قاعدة البيانات لإضافة تاريخ انتهاء التميز.');
    } catch (error) { res.status(500).send('❌ خطأ: ' + error.message); }
});

// 2. دالة تنظيف التميز المنتهي (بتشتغل تلقائي)
async function checkExpiredFeatured() {
    try {
        const now = new Date().toISOString();
        // إلغاء تميز أي عقار تاريخه انتهى
        await pgQuery(`UPDATE properties SET "isFeatured" = FALSE, "featured_expires_at" = NULL WHERE "isFeatured" = TRUE AND "featured_expires_at" < $1`, [now]);
    } catch (e) { console.error("Expiration Check Error:", e); }
}

// 3. 🟢 تعديل API جلب العقارات (عشان ينظف العقارات المنتهية قبل العرض)
// (استبدل الكود القديم اللي عندك بالكود ده)
app.get('/api/properties', async (req, res) => { 
    
    // 🔥 الخطوة الجديدة: فحص العقارات المنتهية أولاً
    await checkExpiredFeatured(); 

    // ✅ التعديل: إضافة JOIN مع جدول المستخدمين لجلب حالة التوثيق (is_verified)
    let sql = `
        SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p."imageUrl", p.type, p."isFeatured", p."isLegal", p."sellerPhone", u.is_verified 
        FROM properties p
        LEFT JOIN users u ON p."sellerPhone" = u.phone
    `; 
    
    const params = []; 
    let idx = 1; 
    const filters = []; 
    
    const { type, limit, offset, keyword, minPrice, maxPrice, rooms, sort } = req.query; 

    // ✅ التعديل: إضافة "p." قبل أسماء الأعمدة لتحديد أنها من جدول properties
    if (type) { filters.push(`p.type = $${idx++}`); params.push(type === 'buy' ? 'بيع' : 'إيجار'); } 
    if (keyword) { filters.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p."hiddenCode" ILIKE $${idx})`); params.push(`%${keyword}%`); idx++; } 
    if (minPrice) { filters.push(`p."numericPrice" >= $${idx++}`); params.push(Number(minPrice)); } 
    if (maxPrice) { filters.push(`p."numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); } 
    if (rooms) { if (rooms === '4+') { filters.push(`p.rooms >= $${idx++}`); params.push(4); } else { filters.push(`p.rooms = $${idx++}`); params.push(Number(rooms)); } } 
    
    if (filters.length > 0) sql += " WHERE " + filters.join(" AND "); 

    // الترتيب: المميز أولاً
    let orderBy = 'ORDER BY p."isFeatured" DESC, p.id DESC'; 
    
    if (sort === 'price_asc') orderBy = 'ORDER BY p."isFeatured" DESC, p."numericPrice" ASC'; 
    else if (sort === 'price_desc') orderBy = 'ORDER BY p."isFeatured" DESC, p."numericPrice" DESC'; 
    else if (sort === 'oldest') orderBy = 'ORDER BY p."isFeatured" DESC, p.id ASC'; 
    
    sql += ` ${orderBy}`; 

    if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); } 
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(parseInt(offset)); }

    try { const result = await pgQuery(sql, params); res.json(result.rows); } 
    catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching properties' }); } 
});
// ✅ تعديل API جلب تفاصيل العقار (لإضافة حالة التوثيق)
app.get('/api/property/:id', async (req, res) => {
    try {
        // بنعمل LEFT JOIN عشان نجيب is_verified من جدول users بناءً على رقم التليفون
        const sql = `
            SELECT p.*, u.is_verified, u.profile_picture 
            FROM properties p
            LEFT JOIN users u ON p."sellerPhone" = u.phone
            WHERE p.id = $1
        `;
        
        const r = await pgQuery(sql, [req.params.id]);
        
        if (r.rows[0]) {
            try { 
                r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); 
            } catch (e) { 
                r.rows[0].imageUrls = []; 
            }
            res.json(r.rows[0]);
        } else {
            res.status(404).json({ message: 'غير موجود' });
        }
    } catch (e) { 
        console.error("Property Fetch Error:", e);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});
app.get('/api/property-by-code/:code', async (req, res) => { try { const r = await pgQuery(`SELECT id, title, price, "hiddenCode" FROM properties WHERE UPPER("hiddenCode") LIKE UPPER($1)`, [`%${req.params.code}%`]); if(r.rows[0]) res.json(r.rows[0]); else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.delete('/api/property/:id', async (req, res) => { try { const resGet = await pgQuery(`SELECT "imageUrls" FROM properties WHERE id=$1`, [req.params.id]); if(resGet.rows[0]) await deleteCloudinaryImages(JSON.parse(resGet.rows[0].imageUrls)); await pgQuery(`DELETE FROM properties WHERE id=$1`, [req.params.id]); res.json({message: 'تم الحذف'}); } catch (e) { throw e; } });
app.post('/api/favorites', async (req, res) => { const token = req.cookies.auth_token; if (!token) return res.status(401).json({ message: 'يجب تسجيل الدخول' }); try { const decoded = jwt.verify(token, JWT_SECRET); await pgQuery(`INSERT INTO favorites (user_phone, property_id) VALUES ($1, $2)`, [decoded.phone, req.body.propertyId]); res.status(201).json({ success: true }); } catch (err) { if (err.code === '23505') return res.status(409).json({ message: 'موجودة بالفعل' }); res.status(500).json({ error: 'خطأ سيرفر' }); } });
app.delete('/api/favorites/:propertyId', async (req, res) => { const token = req.cookies.auth_token; if (!token) return res.status(401).json({ message: 'يجب تسجيل الدخول' }); try { const decoded = jwt.verify(token, JWT_SECRET); await pgQuery(`DELETE FROM favorites WHERE user_phone = $1 AND property_id = $2`, [decoded.phone, req.params.propertyId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: 'خطأ' }); } });
app.get('/api/favorites', async (req, res) => { const token = req.cookies.auth_token; if (!token) return res.status(401).json({ message: 'يجب تسجيل الدخول' }); try { const decoded = jwt.verify(token, JWT_SECRET); const sql = `SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p."imageUrl", p.type, f.id AS favorite_id FROM properties p JOIN favorites f ON p.id = f.property_id WHERE f.user_phone = $1 ORDER BY f.id DESC`; const result = await pgQuery(sql, [decoded.phone]); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); } });
app.get('/api/user/my-properties', async (req, res) => { const token = req.cookies.auth_token; if (!token) return res.status(401).json({ message: 'غير مصرح' }); try { const decoded = jwt.verify(token, JWT_SECRET); const publishedRes = await pgQuery(`SELECT id, title, price, type, "imageUrl", 'active' as status FROM properties WHERE "sellerPhone" = $1`, [decoded.phone]); const pendingRes = await pgQuery(`SELECT id, "propertyTitle" as title, "propertyPrice" as price, "propertyType" as type, 'pending' as status FROM seller_submissions WHERE "sellerPhone" = $1 AND status = 'pending'`, [decoded.phone]); const allProperties = [...publishedRes.rows, ...pendingRes.rows]; allProperties.sort((a, b) => b.id - a.id); res.json(allProperties); } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } });
app.get('/api/properties/similar/:id', async (req, res) => { try { const propId = req.params.id; const currentRes = await pgQuery('SELECT * FROM properties WHERE id = $1', [propId]); if (currentRes.rows.length === 0) return res.status(404).json({ message: 'العقار غير موجود' }); const current = currentRes.rows[0]; let locationKeyword = ''; const textToSearch = normalizeText(current.title + " " + current.description); for (const [gov, cities] of Object.entries(EGYPT_LOCATIONS)) { if (textToSearch.includes(normalizeText(gov))) { locationKeyword = gov; break; } for (const city of cities) { if (textToSearch.includes(normalizeText(city))) { locationKeyword = city; break; } } if (locationKeyword) break; } if (!locationKeyword) locationKeyword = current.title.split(' ')[0] || ''; const minPrice = Number(current.numericPrice) * 0.75; const maxPrice = Number(current.numericPrice) * 1.25; const sql = `SELECT id, title, price, rooms, bathrooms, area, "imageUrl", type, "isFeatured" FROM properties WHERE type = $1 AND id != $2 AND "numericPrice" BETWEEN $3 AND $4 AND (title ILIKE $5 OR description ILIKE $5) ORDER BY ABS(rooms - $6) + ABS(bathrooms - $7) ASC, ABS(area - $8) ASC LIMIT 4`; const params = [current.type, propId, minPrice, maxPrice, `%${locationKeyword}%`, safeInt(current.rooms), safeInt(current.bathrooms), safeInt(current.area)]; const result = await pgQuery(sql, params); if (result.rows.length === 0) { const fallbackSql = `SELECT id, title, price, rooms, bathrooms, area, "imageUrl", type, "isFeatured" FROM properties WHERE type = $1 AND id != $2 ORDER BY RANDOM() LIMIT 4`; const fallbackResult = await pgQuery(fallbackSql, [current.type, propId]); return res.json(fallbackResult.rows); } res.json(result.rows); } catch (error) { res.status(500).json({ message: 'Error' }); } });

// ==========================================================
// 📊 إحصائيات الأدمن (هام جداً للصفحة الرئيسية للأدمن)
// ==========================================================
app.get('/api/admin/counts', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });
        const pendingRes = await pgQuery(`SELECT COUNT(*) FROM seller_submissions WHERE status = 'pending'`);
        const requestsRes = await pgQuery(`SELECT COUNT(*) FROM property_requests`);
        res.json({
            pendingCount: parseInt(pendingRes.rows[0].count),
            requestsCount: parseInt(requestsRes.rows[0].count)
        });
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); }
});

app.get('/api/public/profile/:username', async (req, res) => { 
    const { username } = req.params; 
    try { 
        // جلب التوثيق والصورة
        const userRes = await pgQuery('SELECT name, phone, is_verified, profile_picture FROM users WHERE username = $1', [username.toLowerCase()]); 
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' }); 
        
        const user = userRes.rows[0]; 
        const propsRes = await pgQuery(`SELECT id, title, price, rooms, bathrooms, area, "imageUrl", type, "isFeatured" FROM properties WHERE "publisherUsername" = $1 OR "sellerPhone" = $2 ORDER BY id DESC`, [username.toLowerCase(), user.phone]); 
        
        res.json({ 
            name: user.name, 
            is_verified: user.is_verified, // ✅
            profile_picture: user.profile_picture, // ✅
            properties: propsRes.rows 
        }); 
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } 
});

// ==========================================================
// 🛠️ روابط تحديث وإصلاح الداتابيز (شغلها مرة واحدة)
// ==========================================================

// 1. رابط تحديث الأعمدة (شغله لإضافة الحقول الجديدة)
app.get('/update-db-details', async (req, res) => {
    try {
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "level" TEXT`);
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "floors_count" INTEGER`);
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "finishing_type" TEXT`);
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "propertyLevel" TEXT`);
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "propertyFloors" INTEGER`);
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "propertyFinishing" TEXT`);
        res.send('✅ تم تحديث قاعدة البيانات وإضافة الأعمدة الناقصة بنجاح.');
    } catch (error) { res.send('❌ حدث خطأ: ' + error.message); }
});

// 2. رابط إصلاح العداد التراكمي
app.get('/emergency-fix-columns', async (req, res) => {
    try {
        await pgQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_posts INTEGER DEFAULT 0`);
        await pgQuery(`UPDATE users u SET lifetime_posts = (SELECT COUNT(*) FROM properties p WHERE p."sellerPhone" = u.phone)`);
        res.send('✅ تم إصلاح عمود العداد التراكمي.');
    } catch (error) { res.status(500).send('❌ حدث خطأ: ' + error.message); }
});

// ✅ اختبار السيرفر (Ping)
app.get('/api/ping', (req, res) => { res.json({ status: "OK", message: "Server is running 🚀" }); });

// 🗑️ حذف العقار (للمالك فقط)
app.delete('/api/user/property/:id', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const propId = req.params.id;

        // 1. التأكد من الملكية
        const checkSql = `SELECT "sellerPhone", "imageUrls" FROM properties WHERE id = $1`;
        const checkRes = await pgQuery(checkSql, [propId]);

        if (checkRes.rows.length === 0) return res.status(404).json({ message: 'العقار غير موجود' });
        
        // التحقق: هل رقم الهاتف في التوكن يطابق رقم صاحب العقار؟
        if (checkRes.rows[0].sellerPhone !== decoded.phone && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'لا تملك صلاحية حذف هذا العقار' });
        }

        // 2. تنظيف الصور من Cloudinary (اختياري بس مستحسن)
        const images = JSON.parse(checkRes.rows[0].imageUrls || '[]');
        await deleteCloudinaryImages(images);

        // 3. الحذف من قاعدة البيانات
        await pgQuery(`DELETE FROM properties WHERE id = $1`, [propId]);
        // تنظيف الجداول المرتبطة
        await pgQuery(`DELETE FROM favorites WHERE property_id = $1`, [propId]);
        await pgQuery(`DELETE FROM property_offers WHERE property_id = $1`, [propId]);

        res.json({ success: true, message: 'تم حذف العقار بنجاح' });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// 🔄 تعديل العقار (مع خصم نقطة لو النظام مدفوع)
app.put('/api/user/property/:id', uploadProperties.array('newImages', 10), async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const propId = req.params.id;
        
        const { 
            title, price, description, area, rooms, bathrooms, 
            level, floors_count, finishing_type 
        } = req.body;

        const keptImages = JSON.parse(req.body.keptImages || '[]'); 
        const newFiles = req.files || [];
        const newImageUrls = newFiles.map(f => f.path);

        // التأكد من الملكية
        const checkRes = await pgQuery(`SELECT "sellerPhone", "sellerName" FROM properties WHERE id = $1`, [propId]);
        if (checkRes.rows.length === 0) return res.status(404).json({ message: 'غير موجود' });
        
        const property = checkRes.rows[0];
        if (property.sellerPhone !== decoded.phone && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'لا تملك صلاحية التعديل' });
        }

        // ============================================================
        // 💰 1. نظام الدفع والخصم (الجديد)
        // ============================================================
        let isPaidSystem = false;
        const settingsRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'payment_config'");
        if (settingsRes.rows.length > 0) {
            const config = JSON.parse(settingsRes.rows[0].setting_value);
            isPaidSystem = config.is_active;
        }

        // لو النظام مدفوع والمستخدم مش أدمن -> نخصم
        if (isPaidSystem && decoded.role !== 'admin') {
            const COST_PER_EDIT = 1; // تكلفة التعديل
            const balanceRes = await pgQuery("SELECT wallet_balance FROM users WHERE phone = $1", [decoded.phone]);
            const currentBalance = parseFloat(balanceRes.rows[0]?.wallet_balance || 0);

            if (currentBalance < COST_PER_EDIT) {
                // حذف الصور الجديدة التي تم رفعها لأن العملية فشلت
                if (newImageUrls.length > 0) await deleteCloudinaryImages(newImageUrls);
                
                return res.status(402).json({ 
                    success: false, 
                    message: 'عفواً، رصيدك لا يكفي لتعديل العقار. تكلفة التعديل 1 نقطة.',
                    needCharge: true 
                });
            }

            // خصم الرصيد وتسجيل المعاملة
            await pgQuery("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE phone = $2", [COST_PER_EDIT, decoded.phone]);
            await pgQuery(`INSERT INTO transactions (user_phone, amount, type, description, date) VALUES ($1, $2, 'withdraw', 'خصم تكلفة تعديل عقار', $3)`, 
                [decoded.phone, COST_PER_EDIT, new Date().toISOString()]);
        }
        // ============================================================

        // 🔧 2. إصلاح السعر والفحص (زي ما هو)
        const englishPrice = toEnglishDigits(price);
        const numericPrice = parseFloat(englishPrice);

        console.log("🤖 AI جاري فحص التعديلات...");
        const allImagesForCheck = [...keptImages, ...newImageUrls]; 
        const aiReview = await aiCheckProperty(title, description, englishPrice, allImagesForCheck);

        if (aiReview.status === 'rejected') {
            if (newFiles.length > 0) await deleteCloudinaryImages(newImageUrls);
            return res.status(400).json({ 
                success: false, status: 'rejected',
                title: 'عذراً، التعديلات مرفوضة', message: 'تحتوي التعديلات على مخالفة.', reason: aiReview.reason 
            });
        }

        // 3. التحديث في الداتابيز
        const finalImageUrls = [...keptImages, ...newImageUrls];
        const mainImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : 'logo.png';

        const sql = `
            UPDATE properties 
            SET title=$1, price=$2, "numericPrice"=$3, description=$4, area=$5, rooms=$6, bathrooms=$7, 
            "imageUrl"=$8, "imageUrls"=$9, "level"=$10, "floors_count"=$11, "finishing_type"=$12, "isFeatured"=FALSE 
            WHERE id=$13
        `;
        
        await pgQuery(sql, [
            title, englishPrice, numericPrice, description, safeInt(area), safeInt(rooms), safeInt(bathrooms),
            mainImageUrl, JSON.stringify(finalImageUrls), level || '', safeInt(floors_count), finishing_type || '', propId
        ]);

        res.json({ success: true, message: 'تم تحديث البيانات بنجاح ✅' });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});
// ==========================================================
// 🛡️ نظام الإدارة والشكاوي (Admin & Complaints)
// ==========================================================

// 1. تبديل حالة الحظر (Ban/Unban)
app.post('/api/admin/toggle-ban', async (req, res) => {
    const token = req.cookies.auth_token;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });
        
        const { phone, shouldBan } = req.body;
        // لا يمكن حظر الأدمن نفسه
        if (phone === ADMIN_PHONE) return res.status(400).json({ message: 'لا يمكن حظر الأدمن' });

        await pgQuery(`UPDATE users SET is_banned = $1 WHERE phone = $2`, [shouldBan, phone]);
        res.json({ success: true, message: shouldBan ? 'تم حظر المستخدم' : 'تم فك الحظر' });
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); }
});

// 3. جلب عدد الشكاوي (للأدمن)
app.get('/api/admin/complaints-count', async (req, res) => {
    try {
        const result = await pgQuery(`SELECT COUNT(*) FROM complaints WHERE status = 'pending'`);
        res.json({ count: result.rows[0].count });
    } catch (e) { res.json({ count: 0 }); }
});
// ==========================================================
// 🛡️ نظام الشكاوي (النسخة المصححة والنهائية)
// ==========================================================

app.post('/api/submit-complaint', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'يجب تسجيل الدخول لإرسال شكوى' });
    
    try {
        const user = jwt.verify(token, JWT_SECRET);
        const { content } = req.body;
        
        if (!content) return res.status(400).json({ message: 'محتوى الشكوى فارغ' });

        // 🛠️ خطوة التصليح الذاتي: التأكد من وجود الجدول قبل الإدخال
        await pgQuery(`CREATE TABLE IF NOT EXISTS complaints (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            user_name TEXT,
            user_phone TEXT,
            content TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT
        )`);

        // الإدخال
        await pgQuery(`INSERT INTO complaints (user_id, user_name, user_phone, content, created_at) VALUES ($1, $2, $3, $4, $5)`, 
            [user.id, user.name, user.phone, content, new Date().toISOString()]);

        // إشعار ديسكورد
        try {
            await sendDiscordNotification("📢 شكوى جديدة", [
                { name: "👤 صاحب الشكوى", value: `${user.name} (${user.phone})` },
                { name: "📝 نص الشكوى", value: content }
            ], 16711680); 
        } catch (discordErr) {
            console.error("Discord Error (Ignored):", discordErr.message);
        }

        res.json({ success: true, message: 'تم إرسال الشكوى بنجاح.' });

    } catch (error) { 
        // طباعة الخطأ بالتفصيل في التيرمينال
        console.error("❌ Complaint Error Details:", error); 
        
        // إرسال تفاصيل الخطأ للمتصفح لتراها (Debugging)
        res.status(500).json({ message: 'خطأ في السيرفر: ' + error.message }); 
    }
});
// 5. استبدال API إحصائيات المستخدمين القديم ليجلب حالة الحظر
app.get('/api/admin/users-stats', async (req, res) => {
    const token = req.cookies.auth_token;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });
        
        // جلب حالة الحظر is_banned
        const sql = `SELECT name, phone, username, lifetime_posts as property_count, is_banned FROM users WHERE lifetime_posts >= 0 ORDER BY lifetime_posts DESC`;
        const result = await pgQuery(sql);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); }
});

// 2. تحديث API جلب الشكاوي (ليطبع الخطأ في الترمينال)
app.get('/api/admin/complaints', async (req, res) => {
    const token = req.cookies.auth_token;
    try {
        // التأكد من صلاحية الأدمن
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });
        
        // جلب البيانات
        const result = await pgQuery(`SELECT * FROM complaints ORDER BY id DESC`);
        res.json(result.rows);
    } catch (e) { 
        console.error("❌ خطأ في جلب الشكاوي:", e.message); // طباعة السبب في الشاشة السوداء
        res.status(500).json([]); 
    }
});

// أضف هذا الرابط في نهاية الملف لتحديث الجدول يدوياً
app.get('/update-db-stage2', async (req, res) => {
    try {
        // إضافة عمود لطلب التمييز (Featured Request)
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "wants_featured" BOOLEAN DEFAULT FALSE`);
        res.send('✅ تم تحديث قاعدة البيانات للمرحلة الثانية (Feature Request).');
    } catch (error) { res.status(500).send('❌ خطأ: ' + error.message); }
});

// ==========================================================
// 🛠️ رابط إصلاح هيكل جدول الشكاوي (Rebuild)
// ==========================================================
app.get('/rebuild-complaints-table', async (req, res) => {
    try {
        // 1. حذف الجدول القديم (الذي يسبب المشاكل)
        await pgQuery(`DROP TABLE IF EXISTS complaints`);
        
        // 2. إنشاء الجدول الجديد بالأعمدة الصحيحة (user_id, etc.)
        await pgQuery(`
            CREATE TABLE complaints (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                user_name TEXT,
                user_phone TEXT,
                content TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT
            )
        `);
        
        res.send('✅ تم إعادة بناء جدول الشكاوي بنجاح! المشكلة اتحلت.');
    } catch (error) {
        res.status(500).send('❌ حدث خطأ أثناء الإصلاح: ' + error.message);
    }
});

// حذف شكوى (للأدمن فقط)
app.delete('/api/admin/complaint/:id', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const id = req.params.id;
        await pgQuery('DELETE FROM complaints WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'تم حذف الشكوى بنجاح ✅' });
    } catch (error) {
        console.error("Delete Complaint Error:", error);
        res.status(500).json({ message: 'فشل الحذف' });
    }
});

// ==========================================================
// 🛠️ 7. رابط تحديث الداتابيز (شغله مرة واحدة فقط)
// ==========================================================
// ==========================================================
// 🛠️ رابط تحديث اللوكيشن (شغله مرة واحدة لإنشاء الأعمدة)
// ==========================================================
app.get('/update-db-location', async (req, res) => {
    try {
        // إضافة أعمدة الموقع لجدول العقارات الأساسي
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`);
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`);
        
        // إضافة أعمدة الموقع لجدول طلبات البائعين
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`);
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`);

        res.send('✅ تم تحديث قاعدة البيانات وإضافة خانات الموقع (Latitude/Longitude) بنجاح!');
    } catch (error) {
        res.status(500).send('❌ حدث خطأ: ' + error.message);
    }
});

// ==========================================================
// 💰 8. نظام إعدادات الدفع والنقاط (جديد)
// ==========================================================

// ============================================================
// ⚙️ Admin Dashboard APIs (إعدادات الدفع والشحن اليدوي)
// ============================================================

// 1. GET Payment Settings (جلب الإعدادات الحالية عند فتح الصفحة)
app.get('/api/admin/payment-settings', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const priceRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'point_price'");
        const activeRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'payment_active'");

        res.json({
            point_price: priceRes.rows[0]?.setting_value || 1,
            is_active: activeRes.rows[0]?.setting_value === 'true' // تحويل النص لـ boolean
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ سيرفر' });
    }
});

// 2. POST Payment Settings (حفظ التعديلات من الأدمن)
app.post('/api/admin/payment-settings', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const { point_price, is_active } = req.body;

        // تحديث السعر
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ('point_price', $1) 
                       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`, [point_price]);

        // تحديث حالة التفعيل
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ('payment_active', $1) 
                       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`, [is_active]);

        res.json({ success: true, message: 'تم تحديث إعدادات الدفع بنجاح ✅' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ سيرفر' });
    }
});

// 3. POST Manual Charge (الشحن اليدوي لرقم معين)
app.post('/api/admin/manual-charge', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const { phone, amount } = req.body;
        
        // التحقق من وجود المستخدم
        const userRes = await pgQuery('SELECT id FROM users WHERE phone = $1', [phone]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'رقم الهاتف غير مسجل في الموقع ❌' });
        
        const userId = userRes.rows[0].id;

        // إضافة الرصيد للمستخدم
        await pgQuery('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, userId]);

        // تسجيل المعاملة في السجل (عشان تظهرله في كشف الحساب)
        await pgQuery(`INSERT INTO transactions (user_phone, amount, type, description, date) VALUES ($1, $2, 'deposit', 'مكافأة إدارية (شحن يدوي)', $3)`, 
            [phone, amount, new Date().toISOString()]);

        res.json({ success: true, message: `تم شحن ${amount} نقطة للرقم ${phone} بنجاح 🚀` });

    } catch (error) {
        console.error("Manual Charge Error:", error);
        res.status(500).json({ message: 'خطأ سيرفر' });
    }
});
// ==========================================================
// 🌟 10. نظام باقات التميز (Premium Plans)
// ==========================================================

// 1. رابط لإنشاء عمود تاريخ الانتهاء (شغله مرة واحدة)
app.get('/update-db-featured', async (req, res) => {
    try {
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "featured_expires_at" TEXT`);
        res.send('✅ تم تحديث قاعدة البيانات لإضافة تاريخ انتهاء التميز.');
    } catch (error) { res.status(500).send('❌ خطأ: ' + error.message); }
});

// 2. دالة تنظيف التميز المنتهي (Lazy Expiration)
async function checkExpiredFeatured() {
    try {
        const now = new Date().toISOString();
        // إلغاء تميز أي عقار تاريخه انتهى
        await pgQuery(`UPDATE properties SET "isFeatured" = FALSE, "featured_expires_at" = NULL WHERE "isFeatured" = TRUE AND "featured_expires_at" < $1`, [now]);
    } catch (e) { console.error("Expiration Check Error:", e); }
}

// 3. API تفعيل التميز
app.post('/api/user/feature-property', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { propertyId, planId } = req.body;

        // تعريف الباقات (الأيام مقابل النقاط)
        const plans = {
            1: { days: 14, cost: 20, label: "أسبوعين" },   // أسبوعين
            2: { days: 30, cost: 30, label: "شهر" },       // شهر
            3: { days: 42, cost: 45, label: "6 أسابيع" }   // 6 أسابيع
        };

        const selectedPlan = plans[planId];
        if (!selectedPlan) return res.status(400).json({ message: 'باقة غير صحيحة' });

        // التأكد من الملكية
        const propRes = await pgQuery('SELECT "sellerPhone", "title", "isFeatured" FROM properties WHERE id = $1', [propertyId]);
        if (propRes.rows.length === 0) return res.status(404).json({ message: 'العقار غير موجود' });
        
        if (propRes.rows[0].sellerPhone !== decoded.phone && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'لا تملك هذا العقار' });
        }

        // لو العقار مميز أصلاً، نرفض (أو ممكن نخليه يمدد، بس خلينا نرفض دلوقتي للتبسيط)
        if (propRes.rows[0].isFeatured) {
            return res.status(400).json({ message: 'هذا العقار مميز بالفعل!' });
        }

        // التحقق من الرصيد
        const userRes = await pgQuery('SELECT wallet_balance FROM users WHERE phone = $1', [decoded.phone]);
        const balance = parseFloat(userRes.rows[0].wallet_balance || 0);

        if (balance < selectedPlan.cost) {
            return res.status(402).json({ 
                success: false, 
                message: `رصيدك غير كافي (${balance} نقطة). تكلفة الباقة ${selectedPlan.cost} نقطة.`,
                needCharge: true 
            });
        }

        // حساب تاريخ الانتهاء
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + selectedPlan.days);
        
        // تنفيذ الخصم والتفعيل
        await pgQuery('BEGIN');
        
        // 1. خصم النقط
        await pgQuery('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE phone = $2', [selectedPlan.cost, decoded.phone]);
        
        // 2. تحديث العقار
        await pgQuery(`UPDATE properties SET "isFeatured" = TRUE, "featured_expires_at" = $1 WHERE id = $2`, [expiryDate.toISOString(), propertyId]);
        
        // 3. تسجيل المعاملة
        await pgQuery(`INSERT INTO transactions (user_phone, amount, type, description, date) VALUES ($1, $2, 'withdraw', $3, $4)`, 
            [decoded.phone, selectedPlan.cost, `ترقية عقار لمميز (${selectedPlan.label})`, new Date().toISOString()]);

        await pgQuery('COMMIT');

        // إشعار ديسكورد
        await sendDiscordNotification("🌟 عملية تمييز عقار ناجحة", [
            { name: "👤 المستخدم", value: decoded.phone },
            { name: "🏠 العقار", value: propRes.rows[0].title },
            { name: "⏳ الباقة", value: selectedPlan.label },
            { name: "💰 الخصم", value: `${selectedPlan.cost} نقطة` }
        ], 16776960);

        res.json({ success: true, message: `تم تمييز العقار لمدة ${selectedPlan.label} بنجاح! 🎉` });

    } catch (error) {
        await pgQuery('ROLLBACK');
        console.error("Feature Error:", error);
        res.status(500).json({ message: 'خطأ سيرفر' });
    }
});
// ============================================================
// 💳 1. API بدء عملية الشحن (Charge Request)
// ============================================================
app.post('/api/payment/charge', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { points, method, mobileNumber } = req.body; // method: 'card' or 'wallet'

        if (!points || points < 10) return res.status(400).json({ message: 'أقل عدد نقاط هو 10' });

        // 1. جلب سعر النقطة الحالي من الداتابيز
        const settingRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'point_price'");
        const pricePerPoint = parseFloat(settingRes.rows[0]?.setting_value || 1); // الافتراضي 1 جنيه
        
        const amountEGP = points * pricePerPoint; // المبلغ الإجمالي

        // 2. تحديد نوع وسيلة الدفع (Integration ID)
        let integrationId;
        if (method === 'wallet') {
            integrationId = process.env.PAYMOB_INTEGRATION_WALLET;
            if (!mobileNumber) return res.status(400).json({ message: 'رقم المحفظة مطلوب لفودافون كاش' });
        } else {
            integrationId = process.env.PAYMOB_INTEGRATION_CARD;
        }

        // 3. (Paymob Step 1) Authentication Request
        const authRes = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            "api_key": process.env.PAYMOB_API_KEY
        });
        const authToken = authRes.data.token;

        // 4. (Paymob Step 2) Order Registration
        const orderRes = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            "auth_token": authToken,
            "delivery_needed": "false",
            "amount_cents": amountEGP * 100, // المبلغ بالقروش
            "currency": "EGP",
            "items": []
        });
        const paymobOrderId = orderRes.data.id;

        // 💾 حفظ الطلب في الداتابيز عندنا (Pending)
        await pgQuery(
            `INSERT INTO payment_orders (user_id, paymob_order_id, amount_egp, points_amount, payment_method, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [decoded.id, paymobOrderId, amountEGP, points, method]
        );

        // 5. (Paymob Step 3) Payment Key Request
        // بنجيب بيانات المستخدم عشان Paymob بيطلبها (حتى لو وهمية)
        const userRes = await pgQuery('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const user = userRes.rows[0];

        const keyRes = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            "auth_token": authToken,
            "amount_cents": amountEGP * 100,
            "expiration": 3600, // صلاحية الدفع ساعة
            "order_id": paymobOrderId,
            "billing_data": {
                "apartment": "NA", "email": "user@aqarak.com", "floor": "NA", 
                "first_name": user.name || "Client", "street": "NA", "building": "NA", 
                "phone_number": mobileNumber || user.phone || "01000000000", 
                "shipping_method": "NA", "postal_code": "NA", "city": "Cairo", 
                "country": "EG", "last_name": "Aqarak", "state": "NA"
            },
            "currency": "EGP",
            "integration_id": integrationId
        });
        const paymentToken = keyRes.data.token;

        // 6. الرد حسب النوع
        if (method === 'wallet') {
            // لو محفظة: بنطلب رابط الدفع المباشر
            const walletPayRes = await axios.post('https://accept.paymob.com/api/acceptance/payments/pay', {
                "source": { "identifier": mobileNumber, "subtype": "WALLET" },
                "payment_token": paymentToken
            });
            // توجيه المستخدم لصفحة فودافون كاش
            return res.json({ success: true, redirectUrl: walletPayRes.data.redirect_url });
        } else {
            // لو فيزا: بنرجع رابط الـ Iframe
            return res.json({ 
                success: true, 
                iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}` 
            });
        }

    } catch (error) {
        console.error("Paymob Error:", error.response?.data || error.message);
        res.status(500).json({ message: 'فشل الاتصال ببوابة الدفع' });
    }
});

// ============================================================
// 🔄 2. API استقبال النتيجة (Callback)
// ============================================================
// ده الرابط اللي Paymob هترجع المستخدم عليه بعد الدفع
app.get('/api/payment/callback', async (req, res) => {
    try {
        const { success, id, order, hmac } = req.query;

        // لو العملية ناجحة (success=true)
        if (success === "true") {
            // 1. ندور على الطلب في الداتابيز عندنا برقم الأوردر
            const orderRes = await pgQuery(`SELECT * FROM payment_orders WHERE paymob_order_id = $1`, [order]);
            
            if (orderRes.rows.length > 0) {
                const pendingOrder = orderRes.rows[0];

                // 2. نتأكد إنه لسه pending عشان منضفش الرصيد مرتين
                if (pendingOrder.status === 'pending') {
                    
                    // أ. تحديث حالة الطلب لـ success
                    await pgQuery(`UPDATE payment_orders SET status = 'success' WHERE id = $1`, [pendingOrder.id]);

                    // ب. إضافة "النقاط" للمستخدم (مش الفلوس)
                    await pgQuery(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, 
                        [pendingOrder.points_amount, pendingOrder.user_id]);

                    // ج. تسجيل معاملة في السجل
                    const userPhoneRes = await pgQuery('SELECT phone FROM users WHERE id = $1', [pendingOrder.user_id]);
                    await pgQuery(
                        `INSERT INTO transactions (user_phone, amount, type, description, date) 
                         VALUES ($1, $2, 'deposit', $3, $4)`,
                        [
                            userPhoneRes.rows[0].phone, 
                            pendingOrder.points_amount, 
                            `شحن ${pendingOrder.points_amount} نقطة (${pendingOrder.payment_method})`,
                            new Date().toISOString()
                        ]
                    );
                    
                    // إشعار ديسكورد (اختياري)
                    await sendDiscordNotification("💰 عملية شحن ناجحة", [
                        { name: "المستخدم", value: userPhoneRes.rows[0].phone },
                        { name: "النقاط", value: `${pendingOrder.points_amount}` },
                        { name: "المبلغ", value: `${pendingOrder.amount_egp} EGP` }
                    ], 3066993);
                }
            }
            // توجيه لصفحة النجاح
            res.redirect('/user-dashboard.html?payment=success'); 
        } else {
            // توجيه لصفحة الفشل
            res.redirect('/user-dashboard.html?payment=failed');
        }

    } catch (error) {
        console.error("Callback Error:", error);
        res.redirect('/user-dashboard.html?payment=error');
    }
});


// ============================================================
// ⚙️ إعدادات النظام (Admin Settings)
// ============================================================

// 1. (للأدمن) حفظ إعدادات الدفع
app.post('/api/admin/settings/payment', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const { pointPrice, isActive } = req.body;

        // تحديث سعر النقطة
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ('point_price', $1) 
                       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`, [pointPrice]);

        // تحديث حالة الدفع (شغال ولا لا)
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ('payment_active', $1) 
                       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`, [isActive]);

        res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح ✅' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// 2. (للمستخدم) معرفة سعر النقطة الحالي
app.get('/api/config/payment-price', async (req, res) => {
    try {
        const priceRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'point_price'");
        const activeRes = await pgQuery("SELECT setting_value FROM bot_settings WHERE setting_key = 'payment_active'");
        
        const price = parseFloat(priceRes.rows[0]?.setting_value || 1); // الافتراضي 1
        const isActive = activeRes.rows[0]?.setting_value === 'true';

        res.json({ pointPrice: price, isPaymentActive: isActive });
    } catch (error) {
        res.json({ pointPrice: 1, isPaymentActive: false }); // قيم افتراضية لو حصل خطأ
    }
});
// ============================================================
// 🔔 نظام الإشعارات (Backend)
// ============================================================

// 1. دالة مساعدة لإنشاء إشعار (Helper Function)
async function createNotification(phone, title, message) {
    try {
        await pgQuery(
            `INSERT INTO user_notifications (user_phone, title, message) VALUES ($1, $2, $3)`, 
            [phone, title, message]
        );
    } catch (e) { console.error("Notification Error:", e); }
}

// 2. (للمستخدم) جلب الإشعارات الخاصة به
app.get('/api/user/notifications', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ notifications: [], unreadCount: 0 });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // جلب آخر 20 إشعار (الأحدث أولاً)
        const result = await pgQuery(
            `SELECT * FROM user_notifications WHERE user_phone = $1 ORDER BY id DESC LIMIT 20`, 
            [decoded.phone]
        );
        
        const unreadCount = result.rows.filter(n => !n.is_read).length;
        res.json({ notifications: result.rows, unreadCount });
    } catch (e) { res.json({ notifications: [], unreadCount: 0 }); }
});

// 3. (للمستخدم) تحديد الكل كمقروء
app.post('/api/user/notifications/read', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({});
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pgQuery(`UPDATE user_notifications SET is_read = TRUE WHERE user_phone = $1`, [decoded.phone]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({}); }
});

// 4. (للأدمن) إرسال إشعار جديد 📢
app.post('/api/admin/send-notification', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });

        const { targetPhone, title, message, isBroadcast } = req.body;

        if (!title || !message) return res.status(400).json({ message: 'البيانات ناقصة' });

        if (isBroadcast) {
            // إرسال للكل
            const usersRes = await pgQuery('SELECT phone FROM users');
            // نستخدم Promise.all عشان نبعت للكل بسرعة
            const promises = usersRes.rows.map(user => 
                createNotification(user.phone, title, message)
            );
            await Promise.all(promises);
            res.json({ success: true, message: `تم الإرسال لـ ${usersRes.rows.length} مستخدم` });
        } else {
            // إرسال لشخص محدد
            if (!targetPhone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
            await createNotification(targetPhone, title, message);
            res.json({ success: true, message: 'تم الإرسال للمستخدم بنجاح' });
        }

    } catch (error) {
        console.error("Admin Notif Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// ============================================================
// 📝 راوت تحديث البروفايل (الذي أنشأناه سابقاً)
// ============================================================

app.post('/api/user/update-profile', uploadProfile.single('profileImage'), async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'سجل دخول أولاً' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { newUsername } = req.body;
        const phone = decoded.phone;

        const userRes = await pgQuery('SELECT * FROM users WHERE phone = $1', [phone]);
        const currentUser = userRes.rows[0];

        let updateQuery = 'UPDATE users SET ';
        let updateValues = [];
        let paramCounter = 1;

        // --- إصلاح مسار الصورة ---
        if (req.file) {
            // لو Cloudinary بناخد path، لو Local بنحط / قبلها
            let finalPath = req.file.path;
            if (!finalPath.startsWith('http')) {
                finalPath = '/' + finalPath.replace(/\\/g, "/");
            }
            
            updateQuery += `profile_picture = $${paramCounter}, `;
            updateValues.push(finalPath);
            paramCounter++;
        }

        if (newUsername && newUsername !== currentUser.username) {
            if (currentUser.last_username_change) {
                const lastChange = new Date(currentUser.last_username_change);
                const diffDays = Math.ceil(Math.abs(new Date() - lastChange) / (1000 * 60 * 60 * 24));
                if (diffDays < 30) return res.status(400).json({ message: `انتظر ${30 - diffDays} يوم لتغيير الاسم.` });
            }
            const checkUser = await pgQuery('SELECT id FROM users WHERE username = $1', [newUsername]);
            if (checkUser.rows.length > 0) return res.status(400).json({ message: 'الاسم مستخدم بالفعل.' });

            updateQuery += `username = $${paramCounter}, last_username_change = NOW(), `;
            updateValues.push(newUsername);
            paramCounter++;
        }

        if (updateValues.length === 0) return res.json({ success: true, message: 'لم يتغير شيء' });

        updateQuery = updateQuery.slice(0, -2) + ` WHERE phone = $${paramCounter}`;
        updateValues.push(phone);

        await pgQuery(updateQuery, updateValues);
        res.json({ success: true, message: 'تم التحديث بنجاح ✅' });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});
// ==========================================
// 🛡️ نظام إدارة المستخدمين والتوثيق (Admin)
// ==========================================

// 1. البحث عن المستخدمين
app.get('/api/admin/users/search', async (req, res) => {
    const token = req.cookies.auth_token;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });

        const { query } = req.query; // الكلمة اللي بيبحث عنها
        let sql, params;

        if (query) {
            // بحث باليوزر نيم أو رقم الهاتف
            sql = `SELECT id, name, username, phone, is_verified, profile_picture, created_at 
                   FROM users 
                   WHERE username ILIKE $1 OR phone ILIKE $1 
                   ORDER BY created_at DESC LIMIT 20`;
            params = [`%${query}%`];
        } else {
            // لو مفيش بحث، هات آخر المسجلين
            sql = `SELECT id, name, username, phone, is_verified, profile_picture, created_at 
                   FROM users ORDER BY created_at DESC LIMIT 20`;
            params = [];
        }

        const result = await pgQuery(sql, params);
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// 2. تفعيل/إلغاء توثيق مستخدم
app.post('/api/admin/users/verify', async (req, res) => {
    const token = req.cookies.auth_token;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });

        const { userId, status } = req.body; // status: true (وثق) / false (الغاء)

        await pgQuery('UPDATE users SET is_verified = $1 WHERE id = $2', [status, userId]);
        
        res.json({ success: true, message: status ? 'تم توثيق الحساب ✅' : 'تم إزالة التوثيق ❌' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ' });
    }
});
// 🗑️ حذف الحساب نهائياً
// 🗑️ حذف الحساب نهائياً
app.post('/api/user/delete', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { password } = req.body;

        // 1. التحقق من المستخدم
        const userRes = await pgQuery('SELECT id, password, phone FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'مستخدم غير موجود' });
        
        const user = userRes.rows[0];

        // 2. التحقق من كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });

        // 3. 🧹 تنظيف البيانات المرتبطة (الترتيب مهم جداً!)
        
        // أ. حذف العقارات (مرتبطة برقم الهاتف)
        await pgQuery('DELETE FROM properties WHERE "sellerPhone" = $1', [user.phone]);
        
        // ب. حذف طلبات الدفع (Payment Orders) - ✅ هذا هو حل مشكلتك
        // نستخدم try-catch لتجاهل الخطأ لو الجدول مش موجود
        try { await pgQuery('DELETE FROM payment_orders WHERE user_id = $1', [user.id]); } catch(e) { console.log('No payments to delete or table missing'); }

        // ج. حذف الإشعارات
        try { await pgQuery('DELETE FROM notifications WHERE user_id = $1', [user.id]); } catch(e) { console.log('No notifications to delete'); }

        // د. حذف أي جداول أخرى قد تكون مرتبطة (مثل المحفظة أو المعاملات)
        try { await pgQuery('DELETE FROM wallet_transactions WHERE user_id = $1', [user.id]); } catch(e) {}

        // هـ. أخيراً: حذف المستخدم نفسه
        await pgQuery('DELETE FROM users WHERE id = $1', [user.id]);

        // 4. تسجيل الخروج والرد
        res.clearCookie('auth_token');
        res.json({ success: true, message: 'تم حذف الحساب وجميع البيانات المرتبطة بنجاح' });

    } catch (error) {
        console.error("Delete Account Error:", error);
        // التحقق لو الخطأ لسه موجود بسبب جدول تاني نسيناه
        if (error.code === '23503') {
            return res.status(400).json({ message: 'لا يمكن حذف الحساب لوجود بيانات مالية أو سجلات مرتبطة أخرى لم يتم مسحها.' });
        }
        res.status(500).json({ message: 'خطأ في السيرفر أثناء الحذف' });
    }
});
// ==========================================
// 🔔 نظام الإشعارات (Backend)
// ==========================================

// 1. جلب إشعارات المستخدم
app.get('/api/user/notifications', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ unreadCount: 0, notifications: [] });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // جلب آخر 20 إشعار
        const notifRes = await pgQuery(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', 
            [decoded.id]
        );
        
        // عد غير المقروءة
        const countRes = await pgQuery(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', 
            [decoded.id]
        );

        res.json({
            notifications: notifRes.rows,
            unreadCount: parseInt(countRes.rows[0].count)
        });

    } catch (error) {
        console.error("Notif Fetch Error:", error);
        res.json({ unreadCount: 0, notifications: [] });
    }
});

// 2. تحديث الإشعارات كمقروءة (عند فتح القائمة)
app.post('/api/user/notifications/read', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).send();

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pgQuery('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [decoded.id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Notif Read Error:", error);
        res.status(500).send();
    }
});

// 3. (اختياري) دالة لإرسال إشعار جديد (تستخدمها في الكود الداخلي)
// مثال: await sendNotification(userId, 'تم نشر عقارك', 'عقارك الجديد أصبح متاحاً الآن');
async function sendNotification(userId, title, message) {
    try {
        await pgQuery(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [userId, title, message]
        );
    } catch (e) { console.error("Send Notif Error:", e); }
}
// حذف إشعار محدد
app.delete('/api/user/notification/:id', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // التأكد أن الإشعار يخص المستخدم قبل الحذف
        await pgQuery('DELETE FROM user_notifications WHERE id = $1 AND user_phone = $2', [req.params.id, decoded.phone]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete Notif Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// ============================================================
// 🔐 تغيير كلمة المرور يدوياً (من داخل الحساب)
// ============================================================
app.post('/api/user/change-password-manual', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { currentPass, newPass } = req.body;

        if (!currentPass || !newPass) {
            return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
        }

        // 1. جلب بيانات المستخدم للتأكد من الباسورد القديم
        const userRes = await pgQuery('SELECT id, password FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'مستخدم غير موجود' });

        const user = userRes.rows[0];

        // 2. التحقق من صحة كلمة المرور الحالية
        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة ❌' });
        }

        // 3. تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(newPass, SALT_ROUNDS);

        // 4. التحديث في قاعدة البيانات
        await pgQuery('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح ✅' });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
    }
});
// ==========================================================
// 🤖 Smart AI Matcher for Requests
// ==========================================================
app.post('/api/check-request-matches', async (req, res) => {
    try {
        const { specifications } = req.body;
        if (!specifications) return res.json({ matches: [] });

        // 1. جلب آخر 50 عقار نشط (لتوفير التوكنز والسرعة)
        const propsRes = await pgQuery(`
            SELECT id, title, price, description, type, "imageUrl" 
            FROM properties 
            ORDER BY id DESC LIMIT 50
        `);

        if (propsRes.rows.length === 0) return res.json({ matches: [] });

        // 2. تجهيز البيانات للذكاء الاصطناعي
        // بنحول العقارات لنص مختصر عشان الموديل يفهمه بسرعة
        const propsList = propsRes.rows.map(p => 
            `ID:${p.id} | Title:${p.title} | Price:${p.price} | Desc:${p.description.substring(0, 100)}`
        ).join('\n');

        // 3. البرومبت الذكي
        const prompt = `
        You are a Real Estate Matcher.
        User Request: "${specifications}"
        
        Available Properties:
        ${propsList}

        Task: Return a JSON array of Property IDs that strongly match the User Request.
        Rules:
        - Match based on Location, Type (Apartment/Villa), and Price range.
        - If no strong match, return empty array [].
        - Return ONLY JSON: [12, 15]
        `;

        // 4. استدعاء Gemini (نستخدم موديل الشات لأنه أسرع للنصوص)
        const result = await modelChat.generateContent(prompt);
        const response = await result.response;
        let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        // محاولة استخراج المصفوفة
        const matchIds = JSON.parse(text);

        if (!Array.isArray(matchIds) || matchIds.length === 0) {
            return res.json({ matches: [] });
        }

        // 5. جلب تفاصيل العقارات المتطابقة من الداتا بيز لإرسالها للفرونت
        // الفلترة هنا للأمان للتأكد إن الـ IDs صحيحة
        const cleanIds = matchIds.filter(id => Number.isInteger(id));
        if(cleanIds.length === 0) return res.json({ matches: [] });

        const finalMatches = await pgQuery(`
            SELECT id, title, price, "imageUrl", type 
            FROM properties 
            WHERE id = ANY($1::int[])
        `, [cleanIds]);

        res.json({ matches: finalMatches.rows });

    } catch (error) {
        console.error("AI Matching Error:", error);
        // في حالة الخطأ، اسمح للمستخدم يكمل عادي كأن مفيش تشابه
        res.json({ matches: [] });
    }
});
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });