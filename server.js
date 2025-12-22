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
const modelChat = genAI.getGenerativeModel({ model: "gemma-3-27b-it" }); 
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

const publicVapidKey = 'BABE4bntVm_6RWE3zuv305i65FfcTN8xd6C3d4jdEwML8d7yLwoVywbgvhS7U-q2KE3cmKqDbgvZ8rK97C3gKp4';
const privateVapidKey = 'cFJCSJoigPkZb-y4CxPsY9ffahOTxdlxAec3FVC3aKI';

webPush.setVapidDetails('mailto:aqarakproperty@gmail.com', publicVapidKey, privateVapidKey);

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
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

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "aqarak-session" }),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('📱 QR Code received. Scan it NOW:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ الواتساب متصل وجاهز!');
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

// 🧠 دالة الفحص الذكي (نص + صور + منطق عقاري)
async function aiCheckProperty(title, description, price, imageUrls) {
    try {
        const imageParts = [];
        if (imageUrls && imageUrls.length > 0) {
            for (const url of imageUrls.slice(0, 3)) {
                const part = await urlToGenerativePart(url);
                if (part) imageParts.push(part);
            }
        }

        // 🟢 تم تحديث الـ Prompt هنا
        const prompt = `
        أنت مراقب جودة صارم لموقع عقارات مصري.
        مهمتك: مراجعة بيانات وصور عقار وتحديد هل هو صالح للنشر فوراً أم لا.

        🚨 قواعد منطقية هامة جداً (Business Logic):
        1. **العمارة الكاملة / الأرض / المخزن / المحل:**
           - طبيعي جداً أن يكون عدد الغرف = 0 وعدد الحمامات = 0.
           - لا ترفض الإعلان بسبب نقص هذه البيانات في هذه الفئات.
           - ركز على الوصف والمنطقية.
        
        2. **الشقق والفيلات:**
           - يجب وجود غرف وحمامات.

        ⛔ قواعد الرفض القاطع (Status: rejected):
        1. الصور تحتوي على عري، عنف، محتوى سياسي، أو أشخاص بشكل واضح (سيلفي).
        2. الصور ليست لعقارات (مثلاً صور سيارات، ملابس، شاشة سوداء).
        3. النص او العنوان يحتوي على كلمات بذيئة، شتائم، أو محتوى غير أخلاقي بأي لهجة عربية.
        4. السعر غير منطقي تماماً (مثلاً شقة بـ 5 جنيه أو 0 جنيه) إلا لو للإيجار اليومي.
        5. الإعلان ليس لبيع/إيجار عقار.

        بيانات العقار:
        - العنوان: ${title}
        - الوصف: ${description}
        - السعر: ${price}
        
        ${imageParts.length > 0 ? "- مرفق معه صور للعقار." : "- لا يوجد صور مرفقة."}

        المطلوب: رد بصيغة JSON فقط كالتالي بدون أي علامات Markdown:
        { "status": "approved" أو "rejected", "reason": "سبب الرفض باختصار بالعربية" }
        `;

        const result = await modelVision.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Check Error:", error);
        return { status: "pending", reason: "AI Error or Timeout" };
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

async function searchPropertiesInDB(query) {
    const keywords = expandSearchKeywords(query);
    if (keywords.length === 0) return null;
    const conditions = keywords.map((_, i) => `(title ILIKE $${i+1} OR description ILIKE $${i+1})`).join(' OR ');
    const params = keywords.map(k => `%${k}%`);
    try {
        const result = await pgQuery(`SELECT id, title, price, type, rooms, bathrooms, area, description FROM properties WHERE ${conditions} LIMIT 10`, params);
        let propertiesData = [];
        if (result.rows.length > 0) {
            propertiesData = result.rows.map(p => ({ id: p.id, title: p.title, price: p.price, type: p.type, rooms: p.rooms, bathrooms: p.bathrooms, area: p.area }));
        }
        return { count: propertiesData.length, data: JSON.stringify(propertiesData) };
    } catch (e) { return null; }
}

async function searchPropertiesInDBGeneral() {
    try {
        const result = await pgQuery(`SELECT title, description FROM properties ORDER BY id DESC LIMIT 1000`);
        if (result.rows.length === 0) return { total: 0, report: "لا توجد عقارات حالياً." };
        let cityCounts = {};
        let totalCount = result.rows.length;
        let classifiedCount = 0;
        result.rows.forEach(prop => {
            const text = normalizeText(prop.title + " " + prop.description);
            let matched = false;
            for (const [gov, cities] of Object.entries(EGYPT_LOCATIONS)) {
                for (const city of cities) {
                    if (text.includes(normalizeText(city))) {
                        if (!cityCounts[city]) cityCounts[city] = 0;
                        cityCounts[city]++;
                        matched = true;
                        break; 
                    }
                }
                if (matched) break;
            }
            if (!matched) {
                for (const gov of Object.keys(EGYPT_LOCATIONS)) {
                    if (text.includes(normalizeText(gov))) {
                        if (!cityCounts[gov]) cityCounts[gov] = 0;
                        cityCounts[gov]++;
                        matched = true;
                        break;
                    }
                }
            }
            if (matched) classifiedCount++;
        });
        if (totalCount > classifiedCount) cityCounts["مناطق أخرى"] = totalCount - classifiedCount;
        const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5);
        let reportParts = top5.map(([city, count]) => `${count} في ${city}`);
        if (sorted.length > 5) reportParts.push("ومناطق أخرى");
        return { total: totalCount, report: reportParts.join("، ") };
    } catch (e) { return { total: 0, report: "خطأ." }; }
}

const DEFAULT_SYSTEM_INSTRUCTION = `
أنت "مساعد عقارك" الذكي 🏠.
تتحدث باللهجة المصرية الودودة.
⛔ قواعد صارمة:
1. الالتزام بالبيانات.
2. البحث العام: اعرض أعداد فقط.
3. البحث المخصص: اعرض كروت.
`;

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

        if (intendedLocation) {
            const searchResult = await searchPropertiesInDB(message);
            if (searchResult && searchResult.count > 0) {
                dbContext = `\n[SPECIFIC_DATA: وجدت (${searchResult.count}) عقارات: ${searchResult.data}. اشرح واعرض الكروت.]`;
            } else { dbContext = `\n[SPECIFIC_DATA: بحثت عن المكان ولم أجد (العدد 0). اعتذر.]`; }
        } else if (message.includes("متاح") || message.includes("عقارات") || message.includes("شقق") || message.includes("ايه") || message.includes("وريني") || message.includes("شوف") || message.includes("قاعدة") || message.includes("بيانات") || message.includes("تحديث") || message.includes("جديد")) {
            const generalStats = await searchPropertiesInDBGeneral();
            if (generalStats.total > 0) {
                dbContext = `\n[GENERAL_STATS: إحصائيات المتاح: "${generalStats.report}".
                ⚠️ **تنبيه صارم:** المستخدم يسأل بشكل عام. اعرض عليه ملخص الأعداد هذا فقط.
                🛑 **ممنوع نهائياً** عرض أي كروت أو تفاصيل في هذا الرد.
                اسأله عن المدينة التي يريد تفاصيلها.]`;
            } else { dbContext = `\n[GENERAL_STATS: لا توجد عقارات حالياً. اعتذر.]`; }
        }

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

app.post('/api/register', async (req, res) => {
    const { name, phone, password, otp } = req.body;
    let { username } = req.body;
    username = username ? username.toLowerCase().trim() : '';

    if (!otpStore[phone] || otpStore[phone].code !== otp || Date.now() > otpStore[phone].expires) {
        return res.status(400).json({ message: 'كود التحقق غير صحيح أو منتهي الصلاحية' });
    }
    
    try {
        // فحص هل الرقم محظور سابقاً؟
        const banCheck = await pgQuery('SELECT is_banned FROM users WHERE phone = $1', [phone]);
        if (banCheck.rows.length > 0 && banCheck.rows[0].is_banned) {
            delete otpStore[phone];
            return res.status(403).json({ message: '⛔ هذا الرقم محظور من استخدام موقع عقارك بسبب مخالفة الشروط.' });
        }

        if (username.length < 5) return res.status(400).json({ message: 'اسم المستخدم قصير (يجب أن يكون 5 حروف على الأقل)' });
        
        const userCheck = await pgQuery('SELECT id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) return res.status(409).json({ message: 'اسم المستخدم محجوز، اختر اسماً آخر' });

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await pgQuery(`INSERT INTO users (name, username, phone, password, role) VALUES ($1, $2, $3, $4, $5)`, 
            [name, username, phone, hashedPassword, 'user']);
        
        delete otpStore[phone];
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح' });

    } catch (error) { 
        if(error.code === '23505') return res.status(409).json({ message: 'البيانات (الهاتف أو اسم المستخدم) مسجلة بالفعل' });
        console.error("Register Error:", error);
        res.status(500).json({ message: 'خطأ في السيرفر' }); 
    }
});
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    
    // دخول الأدمن (تجاوز الفحص)
    if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ id: 0, phone: ADMIN_PHONE, role: 'admin', username: 'admin', name: 'المدير العام' }, JWT_SECRET, { expiresIn: '7d' });
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
app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ isAuthenticated: false, role: 'guest' });
    
    try { 
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 🟢 استثناء للأدمن (عشان هو مش موجود في جدول المستخدمين)
        if (decoded.role === 'admin' || decoded.id === 0) {
             return res.json({ 
                 isAuthenticated: true, 
                 role: 'admin', 
                 phone: decoded.phone, 
                 username: 'admin', 
                 name: 'المدير العام' 
             });
        }

        // 🔥 فحص المستخدمين العاديين من الداتابيز (عشان البان)
        const userRes = await pgQuery('SELECT role, phone, username, name FROM users WHERE id = $1', [decoded.id]);
        
        if (userRes.rows.length === 0) {
            return res.json({ isAuthenticated: false, role: 'guest' });
        }

        const user = userRes.rows[0];

        // لو واخد بان، نطرده
        if (user.role === 'banned') {
            return res.json({ isAuthenticated: true, role: 'banned', forceLogout: true });
        }

        res.json({ isAuthenticated: true, role: user.role, phone: user.phone, username: user.username, name: user.name }); 
    } 
    catch (err) { res.json({ isAuthenticated: false, role: 'guest' }); }
});
app.put('/api/user/change-password', async (req, res) => {
    const { phone, currentPassword, newPassword } = req.body;
    try {
        const r = await pgQuery(`SELECT * FROM users WHERE phone=$1`, [phone]);
        if (!r.rows[0] || !(await bcrypt.compare(currentPassword, r.rows[0].password))) return res.status(401).json({ success: false, message: 'كلمة المرور الحالية خطأ' });
        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pgQuery(`UPDATE users SET password = $1 WHERE id = $2`, [hash, r.rows[0].id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: 'خطأ سيرفر' }); }
});

app.post('/api/logout', (req, res) => { res.clearCookie('auth_token'); res.json({ success: true }); });

// ==========================================================
// 🏠 Property & Admin APIs (مع فحص AI المطور والبيانات الجديدة)
// ==========================================================

// 🟢 استقبال طلب بيع (مؤمن + فحص AI ذكي + بيانات ديناميكية)
// 🟢 استقبال طلب بيع (النسخة المحدثة مع المطابقة ورأي AI)
// 🟢 استقبال طلب بيع (تم إصلاح مشكلة السعر 0)
app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'سجل دخول أولاً' });

    let realUser;
    try { realUser = jwt.verify(token, JWT_SECRET); } catch (err) { return res.status(403).json({ message: 'جلسة غير صالحة' }); }

    const sellerName = realUser.name || realUser.username || 'مستخدم عقارك';
    const sellerPhone = realUser.phone; 
    const publisherUsername = realUser.username; 

    const { 
        propertyTitle, propertyType, propertyPrice, propertyArea, propertyDescription, 
        propertyRooms, propertyBathrooms, 
        propertyLevel, propertyFloors, propertyFinishing,
        nearby_services // 🆕 استلام الخدمات
    } = req.body;

    const files = req.files || [];
    const paths = files.map(f => f.path).join(' | ');
    const code = generateUniqueCode();
    const englishPrice = toEnglishDigits(propertyPrice); 
    const numericPrice = parseFloat(englishPrice); 

    try {
        console.log("🤖 جاري فحص العقار...");
        const imageUrls = files.map(f => f.path);
        const aiReview = await aiCheckProperty(propertyTitle, propertyDescription, englishPrice, imageUrls);

        let finalStatus = 'pending';
        let isPublic = false;

        if (aiReview.status === 'approved') {
            finalStatus = 'approved'; 
            isPublic = true;          
        }

        // 3. الحفظ في الأرشيف (تم إضافة nearby_services)
        await pgQuery(`
            INSERT INTO seller_submissions 
            ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", 
             "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate", status,
             "propertyLevel", "propertyFloors", "propertyFinishing", "ai_review_note", "nearby_services") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
            sellerName, sellerPhone, propertyTitle, propertyType, englishPrice,
            safeInt(propertyArea), safeInt(propertyRooms), safeInt(propertyBathrooms), 
            propertyDescription, paths, new Date().toISOString(), finalStatus,
            propertyLevel || '', safeInt(propertyFloors), propertyFinishing || '',
            aiReview.reason || 'No automated note',
            nearby_services || '' // 🆕 تخزين الخدمات
        ]);

        // 4. النشر الفوري (تم إضافة nearby_services)
        if (isPublic) {
            const pubRes = await pgQuery(`
                INSERT INTO properties 
                (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, 
                 "hiddenCode", "sellerName", "sellerPhone", "publisherUsername", "isFeatured", "isLegal", "video_urls",
                 "level", "floors_count", "finishing_type", "nearby_services")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, false, false, '{}', $15, $16, $17, $18)
                RETURNING id
            `, [
                propertyTitle, englishPrice, numericPrice,
                safeInt(propertyRooms), safeInt(propertyBathrooms), safeInt(propertyArea), propertyDescription,
                files.length > 0 ? files[0].path : 'logo.png', JSON.stringify(files.map(f => f.path)), 
                propertyType, code, sellerName, sellerPhone, publisherUsername,
                propertyLevel || '', safeInt(propertyFloors), propertyFinishing || '',
                nearby_services || '' // 🆕 نشر الخدمات
            ]);
            
            checkAndNotifyMatches({
                id: pubRes.rows[0].id,
                title: propertyTitle,
                description: propertyDescription,
                price: englishPrice,
                level: propertyLevel,
                sellerPhone: sellerPhone
            });
        }

        await sendDiscordNotification(`📢 طلب عقار جديد (${aiReview.status === 'approved' ? '✅ تم النشر' : '⚠️ تحت المراجعة'})`, [
            { name: "👤 المالك", value: sellerName },
            { name: "🏠 العقار", value: propertyTitle },
            { name: "💰 السعر", value: englishPrice },
            { name: "🤖 تقرير AI", value: aiReview.reason }
        ], aiReview.status === 'approved' ? 3066993 : 15158332, files[0]?.path);

        res.status(200).json({ 
            success: true, 
            status: finalStatus,
            message: aiReview.status === 'approved' ? 'تمت الموافقة والنشر فوراً! 🎉' : 'تم استلام الطلب.',
            aiReason: aiReview.reason 
        }); 

    } catch (err) { console.error(err); res.status(500).json({ message: 'خطأ' }); }
});
app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => { 
    const files = req.files || []; const data = req.body; const urls = files.map(f => f.path);
    const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "publisherUsername", "isFeatured", "isLegal") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`; 
    const params = [data.title, data.price, parseFloat(data.price.replace(/[^0-9.]/g,'')), safeInt(data.rooms), safeInt(data.bathrooms), safeInt(data.area), data.description, urls[0], JSON.stringify(urls), data.type, data.hiddenCode, "Admin", ADMIN_EMAIL, "admin", false, false]; 
    try { const result = await pgQuery(sql, params); res.status(201).json({ success: true, id: result.rows[0].id }); } catch (err) { res.status(400).json({ message: 'Error' }); } 
});

app.put('/api/admin/toggle-badge/:id', async (req, res) => { const token = req.cookies.auth_token; try { const decoded = jwt.verify(token, JWT_SECRET); if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); } catch(e) { return res.status(401).json({message: 'سجل دخول أولاً'}); } try { await pgQuery(`UPDATE properties SET "${req.body.type}" = $1 WHERE id = $2`, [req.body.value, req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ message: 'Error' }); } });
app.post('/api/subscribe', async (req, res) => { try { await pgQuery(`INSERT INTO subscriptions (endpoint, keys) VALUES ($1, $2) ON CONFLICT (endpoint) DO NOTHING`, [req.body.endpoint, JSON.stringify(req.body.keys)]); res.status(201).json({}); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/make-offer', async (req, res) => { const { propertyId, buyerName, buyerPhone, offerPrice } = req.body; try { await pgQuery(`INSERT INTO property_offers (property_id, buyer_name, buyer_phone, offer_price, created_at) VALUES ($1, $2, $3, $4, $5)`, [propertyId, buyerName, buyerPhone, offerPrice, new Date().toISOString()]); const propRes = await pgQuery('SELECT title FROM properties WHERE id = $1', [propertyId]); await sendDiscordNotification("💰 عرض سعر جديد", [{ name: "🏠 العقار", value: propRes.rows[0]?.title || 'غير معروف' }, { name: "📉 العرض", value: `${offerPrice} ج.م` }, { name: "👤 المشتري", value: `${buyerName} - ${buyerPhone}` }], 16753920); res.status(200).json({ success: true }); } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } });

// نشر العقار من الأدمن (نقل البيانات الجديدة أيضاً)
app.post('/api/admin/publish-submission', async (req, res) => {
    const { submissionId, hiddenCode } = req.body;
    try {
        const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]);
        if (subRes.rows.length === 0) return res.status(404).json({ message: 'الطلب غير موجود' });
        const sub = subRes.rows[0];
        
        let publisherUsername = null;
        const userCheck = await pgQuery(`SELECT username FROM users WHERE phone = $1`, [sub.sellerPhone]);
        if (userCheck.rows.length > 0) publisherUsername = userCheck.rows[0].username;
        
        const imageUrls = (sub.imagePaths || '').split(' | ').filter(Boolean);
        
        const sql = `
            INSERT INTO properties (
                title, price, "numericPrice", rooms, bathrooms, area, description, 
                "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", 
                "publisherUsername", "isFeatured", "isLegal", "video_urls",
                "level", "floors_count", "finishing_type", "nearby_services"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, 
                $14, false, false, '{}',
                $15, $16, $17, $18
            ) RETURNING id
        `;
        const params = [
            sub.propertyTitle, sub.propertyPrice, parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), 
            safeInt(sub.propertyRooms), safeInt(sub.propertyBathrooms), safeInt(sub.propertyArea), sub.propertyDescription, 
            imageUrls[0] || '', JSON.stringify(imageUrls), sub.propertyType, hiddenCode, sub.sellerName, sub.sellerPhone, 
            publisherUsername,
            sub.propertyLevel, safeInt(sub.propertyFloors), sub.propertyFinishing,
            sub.nearby_services || '' // 🆕 نقل الخدمات
        ];
        
        const result = await pgQuery(sql, params);
        await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]);
        notifyAllUsers(`عقار جديد!`, sub.propertyTitle, `/property-details?id=${result.rows[0].id}`);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) { console.error("Publish Error:", err); res.status(400).json({ message: 'Error' }); }
});
app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => { const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages, video_urls } = req.body; let oldUrls = []; try { oldUrls = JSON.parse((Array.isArray(existingImages) ? existingImages[0] : existingImages) || '[]'); } catch(e) {} const newUrls = req.files ? req.files.map(f => f.path) : []; const allUrls = [...oldUrls, ...newUrls]; let videoUrlsArr = []; try { videoUrlsArr = JSON.parse(video_urls || '[]'); } catch(e) {} const sql = `UPDATE properties SET title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11, "video_urls"=$12 WHERE id=$13`; const params = [title, price, parseFloat((price||'0').replace(/,/g,'')), safeInt(rooms), safeInt(bathrooms), safeInt(area), description, allUrls[0], JSON.stringify(allUrls), type, hiddenCode, videoUrlsArr, req.params.id]; try { await pgQuery(sql, params); res.status(200).json({ message: 'تم التحديث' }); } catch (err) { res.status(400).json({ message: `خطأ` }); } });
app.post('/api/request-property', async (req, res) => { const { name, phone, email, specifications } = req.body; try { await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]); await sendDiscordNotification("📩 طلب عقار مخصص", [{ name: "👤 الاسم", value: name }, { name: "📝 المواصفات", value: specifications }], 15158332); res.status(200).json({ success: true }); } catch (err) { throw err; } });
app.get('/api/admin/seller-submissions', async (req, res) => { try { const r = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.get('/api/admin/property-requests', async (req, res) => { try { const r = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.delete('/api/admin/seller-submission/:id', async (req, res) => { try { const r = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]); if(r.rows[0]) await deleteCloudinaryImages((r.rows[0].imagePaths || '').split(' | ')); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { console.error("Delete Error:", err); res.status(500).json({ message: 'فشل الحذف' }); } });
app.delete('/api/admin/property-request/:id', async (req, res) => { try { await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });
app.get('/api/properties', async (req, res) => { 
    let sql = "SELECT id, title, price, rooms, bathrooms, area, \"imageUrl\", type, \"isFeatured\", \"isLegal\", \"sellerPhone\" FROM properties"; 
    const params = []; 
    let idx = 1; 
    const filters = []; 
    
    // استقبال الـ Offset (عشان زرار عرض المزيد)
    const { type, limit, offset, keyword, minPrice, maxPrice, rooms, sort } = req.query; 

    if (type) { filters.push(`type = $${idx++}`); params.push(type === 'buy' ? 'بيع' : 'إيجار'); } 
    if (keyword) { filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR "hiddenCode" ILIKE $${idx})`); params.push(`%${keyword}%`); idx++; } 
    if (minPrice) { filters.push(`"numericPrice" >= $${idx++}`); params.push(Number(minPrice)); } 
    if (maxPrice) { filters.push(`"numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); } 
    if (rooms) { if (rooms === '4+') { filters.push(`rooms >= $${idx++}`); params.push(4); } else { filters.push(`rooms = $${idx++}`); params.push(Number(rooms)); } } 
    
    if (filters.length > 0) sql += " WHERE " + filters.join(" AND "); 

    // 🌟 التعديل هنا: الترتيب الافتراضي يظهر العقارات المميزة (Featured) أولاً
    let orderBy = 'ORDER BY "isFeatured" DESC, id DESC'; 
    
    if (sort === 'price_asc') orderBy = 'ORDER BY "isFeatured" DESC, "numericPrice" ASC'; 
    else if (sort === 'price_desc') orderBy = 'ORDER BY "isFeatured" DESC, "numericPrice" DESC'; 
    else if (sort === 'oldest') orderBy = 'ORDER BY "isFeatured" DESC, id ASC'; 
    
    sql += ` ${orderBy}`; 

    if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); } 
    
    // 🌟 دعم الـ Offset (تخطي العقارات اللي ظهرت قبل كده)
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(parseInt(offset)); }

    try { const result = await pgQuery(sql, params); res.json(result.rows); } 
    catch (err) { res.status(500).json({ message: 'Error fetching properties' }); } 
});
app.get('/api/property/:id', async (req, res) => { try { const r = await pgQuery(`SELECT * FROM properties WHERE id=$1`, [req.params.id]); if(r.rows[0]) { try { r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); } catch(e){ r.rows[0].imageUrls=[]; } res.json(r.rows[0]); } else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
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

app.get('/api/admin/users-stats', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'للأدمن فقط' });
        const sql = `SELECT name, phone, username, lifetime_posts as property_count FROM users WHERE lifetime_posts > 0 ORDER BY lifetime_posts DESC`;
        const result = await pgQuery(sql);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); }
});

app.get('/api/public/profile/:username', async (req, res) => { const { username } = req.params; try { const userRes = await pgQuery('SELECT name, phone FROM users WHERE username = $1', [username.toLowerCase()]); if (userRes.rows.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' }); const user = userRes.rows[0]; const propsRes = await pgQuery(`SELECT id, title, price, rooms, bathrooms, area, "imageUrl", type, "isFeatured" FROM properties WHERE "publisherUsername" = $1 OR "sellerPhone" = $2 ORDER BY id DESC`, [username.toLowerCase(), user.phone]); res.json({ name: user.name, properties: propsRes.rows }); } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } });

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

        const checkRes = await pgQuery(`SELECT "sellerPhone", "sellerName" FROM properties WHERE id = $1`, [propId]);
        if (checkRes.rows.length === 0) return res.status(404).json({ message: 'غير موجود' });
        
        const property = checkRes.rows[0];
        if (property.sellerPhone !== decoded.phone && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'لا تملك صلاحية التعديل' });
        }

        // 🔧 1. إصلاح السعر
        const englishPrice = toEnglishDigits(price);
        const numericPrice = parseFloat(englishPrice);

        // 🔧 2. فحص الـ AI
        console.log("🤖 AI جاري فحص التعديلات...");
        const allImagesForCheck = [...keptImages, ...newImageUrls]; 
        
        const aiReview = await aiCheckProperty(title, description, englishPrice, allImagesForCheck);

        // 🛑 حالة الرفض (مع إرسال السبب للواجهة)
        if (aiReview.status === 'rejected') {
            console.log(`❌ تم رفض التعديل: ${aiReview.reason}`);
            
            if (newFiles.length > 0) await deleteCloudinaryImages(newImageUrls);
            
            await sendDiscordNotification("⚠️ محاولة تعديل مرفوضة", [
                { name: "👤 المالك", value: property.sellerName },
                { name: "🚫 السبب", value: aiReview.reason }
            ], 15158332);

            return res.status(400).json({ 
                success: false, 
                status: 'rejected',
                title: 'عذراً، التعديلات مرفوضة',
                message: 'تحتوي التعديلات على مخالفة لسياسات النشر.',
                reason: aiReview.reason 
            });
        }

        // 3. التحديث في الداتابيز
        const finalImageUrls = [...keptImages, ...newImageUrls];
        const mainImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : 'logo.png';

        // 👇👇 التعديل هنا: ضفنا "isFeatured" = FALSE عشان يلغي التميز 👇👇
        const sql = `
            UPDATE properties 
            SET title=$1, price=$2, "numericPrice"=$3, description=$4, area=$5, rooms=$6, bathrooms=$7, 
            "imageUrl"=$8, "imageUrls"=$9, 
            "level"=$10, "floors_count"=$11, "finishing_type"=$12,
            "isFeatured"=FALSE 
            WHERE id=$13
        `;
        
        const params = [
            title, englishPrice, numericPrice, description, safeInt(area), safeInt(rooms), safeInt(bathrooms),
            mainImageUrl, JSON.stringify(finalImageUrls),
            level || '', safeInt(floors_count), finishing_type || '',
            propId
        ];

        await pgQuery(sql, params);

        await sendDiscordNotification("📝 تم تعديل عقار بنجاح", [
            { name: "👤 المالك", value: property.sellerName },
            { name: "🏠 العنوان", value: title },
            { name: "📸 الصور", value: `أصبح العدد ${finalImageUrls.length} صورة` },
            { name: "ℹ️ تنبيه", value: "تم إلغاء التميز (إن وجد) بسبب التعديل." }
        ], 3066993);

        res.json({ success: true, message: 'تم تحديث البيانات، وسيتم مراجعتها مرة أخرى.' });

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
app.get('/update-db-services', async (req, res) => {
    try {
        // إضافة العمود لجدول العقارات
        await pgQuery(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "nearby_services" TEXT`);
        
        // إضافة العمود لجدول طلبات النشر
        await pgQuery(`ALTER TABLE seller_submissions ADD COLUMN IF NOT EXISTS "nearby_services" TEXT`);
        
        res.send('✅ تم تحديث قاعدة البيانات وإضافة خانة الخدمات بنجاح!');
    } catch (error) {
        res.status(500).send('❌ حدث خطأ: ' + error.message);
    }
});
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });