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

// ⚠️ مفتاح API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSy_PUT_YOUR_KEY_HERE"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

// ... إعدادات السيرفر ...
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // يمكن استخدامه كمعرف للأدمن
const ADMIN_PHONE = "01008102237"; // رقم الأدمن
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
function safeInt(value) { return isNaN(parseInt(value)) ? 0 : parseInt(value); }

// ==========================================================
// 📱 إعدادات الواتساب (WhatsApp Client)
// ==========================================================
const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

whatsappClient.on('qr', (qr) => {
    console.log('📱 امسح كود QR ده عشان تربط الواتساب بالسيرفر:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ الواتساب متصل وجاهز للإرسال!');
});

whatsappClient.initialize();

// دالة إرسال الرسالة عبر واتساب
async function sendWhatsAppMessage(phone, message) {
    try {
        let formattedNumber = phone.replace(/\D/g, '');
        if (formattedNumber.startsWith('01')) formattedNumber = '2' + formattedNumber;
        const chatId = `${formattedNumber}@c.us`;
        await whatsappClient.sendMessage(chatId, message);
        return true;
    } catch (error) {
        console.error("WhatsApp Send Error:", error);
        return false;
    }
}

// 🧠 مخزن مؤقت لأكواد التحقق (OTP Store)
const otpStore = {}; // { "010xxxx": { code: "1234", expires: 123456789 } }

// ==========================================================
// 🧠 دوال المساعدة
// ==========================================================

// دالة حذف الصور
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

// 🔥 النص الافتراضي
const DEFAULT_SYSTEM_INSTRUCTION = `
أنت "مساعد عقارك" الذكي 🏠.
تتحدث باللهجة المصرية الودودة.
خاطب المستخدم دائماً بصيغة المذكر.

⛔ **قواعد صارمة جداً:**
1. **الالتزام بالبيانات:** ستصلك بيانات. إذا كان العدد 0، رد: "للأسف مفيش عقارات مطابقة حالياً. ممكن تسيب طلبك في زر (احجز عقارك)".
2. **البحث العام (GENERAL_STATS):** - عندما يسأل المستخدم سؤالاً عاماً (ايه المتاح؟ شيك قاعدة البيانات؟)، ستصلك إحصائيات.
   - **مهمتك:** عرض الأعداد فقط (مثلاً: "متاح 5 عقارات: 3 في الشروق و 2 في التجمع").
   - 🛑 **ممنوع نهائياً** عرض أي كروت أو تفاصيل في هذا الرد، حتى لو كان العدد عقار واحد فقط.
   - اختم بسؤال: "تحب تشوف تفاصيل أنهي منطقة؟".
3. **البحث المخصص (SPECIFIC_DATA):** عندما يحدد المستخدم مدينة، اشرح التفاصيل واعرض الكروت.
4. **كود الكارت:**
   <a href="property-details?id={ID}" class="chat-property-box">
       <div class="chat-box-header">
           <span class="title-tag">{TYPE}</span>
           <h4 class="title-text">{TITLE}</h4>
       </div>
       <div class="chat-box-body">
           <div class="specs">
               <span>🛏️ {ROOMS}</span> | <span>🛁 {BATHS}</span> | <span>📏 {AREA}م²</span>
           </div>
           <div class="price">{PRICE} ج.م</div>
           <div class="cta">اضغط للتفاصيل 👈</div>
       </div>
   </a>

📘 **دليل استخدام الموقع (مرجعك الحصري):**
**الموقع اولا لا يحتاج لتسجيل الدخول.**
**البائع او المؤجر:** يقدر يعرض عقاره عن طريق الضغط على زر اعرض عقار للبيع الموجود في الصفحة الرئيسية للموقع بعد الضغط عليها هيملأ البيانات ويدوس ارسال وينتظر الموافقة والفريق بتاعنا ويتواصل معاه ويبعت له رابط العقار الخاص به.
**مدة عرض ال 0% عمولة** هتنتهي يوم 3 مارس 2026 والعمولة هتكون 1% فيما بعد كده.
**شعار "قانوني"** هو الشعار اللي بيتحط للعقار لما فريق الشؤون القانونية بتاعنا يفحص اوراق العقار وتسلسل الملكية وبيتم دفع اتعاب المحامي فقط.
**شعار "مميز"** هو الشعار اللي بيتحط للعقار المميز وبيتم تفعيله بمبلغ رمزي جدا قدره 50 ج.م. في حالة طلب ذلك انما لو العقار "لقطة" الفريق المتخصص للتسويق العقاري بيفعلها مجاناً.
**في حالة لو عايز اضيف فيديو** العقار الخاص بك بتبعت لنا الفيديو الخاص بالعقار عن طريق الواتساب في الرقم 01008102237 وهنرفع الفيديو مجانا وفي خلال دقائق ولو حابب تعدل أو تحذف حاجة بتكلمنا على نفس الرقم وهننفذ طلبك فورا ومجانا.

**المشتري او المستأجر:** يقدر يبحث عن العقار المناسب له على حسب السعر او المنطقة عن طريق شريط البحث الموجود في الصفحة الرئيسية. تقدر تفلتر البحث عن طريق انك تدوس على زر "جميع العقارات" أو زر "شراء" أو زر "ايجار" الموجودين في الصفحة الرئيسية تفلتر عن طريق عدد الغرف، السعر الأدنى والاقصى، نوع العرض.
**التفاصيل:** بعد ما تختار العقار المناسب سواء من البحث أو العقارات المعروضة في الصفحة الرئيسية (احدث ٦ عقارات) هتدخل على صفحة تفاصيل العقار وهنا هيكون مكتوب السعر، حاسبة لنسبة السمسمرة ومقارنة بين نسبة عقارك والمكاتب الأخرى وطبعا تفاصيل العقار موجودة من مساحة وعدد غرف وعدد حمامات وتفاصيل إضافية وزر عرض فيديو العقار (لو متاح فيديوهات للعقار).
**التواصل:** هتلاقي بعدها زر واتساب للتواصل بيحولّك على شات عقارك على الواتساب بالكود السري الخاص بالعقار وعنوان العقار بمجرد ارسال الرسالة المجهزة فريق عقارك هيرد عليك في خلال دقائق و هيتواصل فورا مع المالك وهيظبط ميعاد للمعاينة ويبعت لك كامل التفاصيل واجابات جميع الاسئلة اللي انت محتاجها ويوجد ايضا في صفحة التفاصيل زر المشاركة لسهولة مشاركة العقار مع العائلة والأصدقاء لأخذ رأيهم وزر المفضلة عشان تشوف العقارات المفضلة وقارن بينهم.

**خدمات أخرى:** عشان تلاقي العقارات المفضلة هتضغط على زر "القائمة" الموجود في الصفحة الرئيسية وتضغط على "العقارات المفضلة". في حالة لو لم تجد العقار المناسب تقدر تسيب تفاصيل العقار المناسب ليك عن طريق زر "احجز عقارك". في حالة انك عايز تشطيبات فقط (المونتال، نجارة، ديكور...) تقدر تشوف الخدمات عن طريق انك تدوس على زرار "القائمة" وتضغط على زر "الخدمات".
`;

async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS properties (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price TEXT NOT NULL, "numericPrice" NUMERIC, rooms INTEGER, bathrooms INTEGER, area INTEGER, description TEXT, "imageUrl" TEXT, "imageUrls" TEXT, type TEXT NOT NULL, "hiddenCode" TEXT UNIQUE, "sellerName" TEXT, "sellerPhone" TEXT, "isFeatured" BOOLEAN DEFAULT FALSE, "isLegal" BOOLEAN DEFAULT FALSE, "video_urls" TEXT[] DEFAULT '{}')`,
        // 🔴 تعديل جدول المستخدمين لاستخدام الهاتف
        `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, phone TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'user')`,
        `CREATE TABLE IF NOT EXISTS seller_submissions (id SERIAL PRIMARY KEY, "sellerName" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL, "propertyTitle" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "propertyPrice" TEXT NOT NULL, "propertyArea" INTEGER, "propertyRooms" INTEGER, "propertyBathrooms" INTEGER, "propertyDescription" TEXT, "imagePaths" TEXT, "submissionDate" TEXT, status TEXT DEFAULT 'pending')`,
        `CREATE TABLE IF NOT EXISTS property_requests (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, specifications TEXT NOT NULL, "submissionDate" TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, property_id INTEGER NOT NULL, UNIQUE(user_email, property_id))`,
        `CREATE TABLE IF NOT EXISTS property_offers (id SERIAL PRIMARY KEY, property_id INTEGER, buyer_name TEXT, buyer_phone TEXT, offer_price TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, endpoint TEXT UNIQUE, keys TEXT)`,
        `CREATE TABLE IF NOT EXISTS bot_settings (id SERIAL PRIMARY KEY, setting_key TEXT UNIQUE, setting_value TEXT)`
    ];
    try { 
        for (const query of queries) await pgQuery(query); 
        await pgQuery(`INSERT INTO bot_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING`, ['system_prompt', DEFAULT_SYSTEM_INSTRUCTION]);
        console.log('✅ Tables synced.'); 
    } 
    catch (err) { console.error('❌ Table Sync Error:', err); }
}
createTables();

const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const storageSeller = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: 'aqarak_submissions', format: async () => 'webp', public_id: (req, file) => `seller-${Date.now()}-${Math.round(Math.random() * 1E9)}` } });
const uploadSeller = multer({ storage: storageSeller, limits: { fileSize: MAX_FILE_SIZE } });
const storageProperties = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: 'aqarak_properties', format: async () => 'webp', public_id: (req, file) => `property-${Date.now()}-${Math.round(Math.random() * 1E9)}` } });
const uploadProperties = multer({ storage: storageProperties, limits: { fileSize: MAX_FILE_SIZE } });

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { index: false, extensions: ['html'] }));

// ==========================================================
// 🧠 خريطة مصر الشاملة (للبحث والفرز)
// ==========================================================
const EGYPT_LOCATIONS = {
    "قاهرة": ["القاهرة", "التجمع", "الشروق", "مدينتي", "الرحاب", "المستقبل", "العاصمة الادارية", "مصر الجديدة", "مدينة نصر", "المعادي", "زهراء المعادي", "المقطم", "القطامية", "الزيتون", "عين شمس", "المرج", "السلام", "العباسية", "وسط البلد", "الزمالك", "جاردن سيتي", "شبرا مصر", "حلوان", "المعصرة", "15 مايو", "بدر", "حدائق القبة", "الوايلي", "المنيل", "السيدة زينب", "الازبكية", "بولاق", "عابدين", "الموسكي", "الخليفة", "المطرية", "النزهة", "شيراتون", "الالف مسكن", "الحلمية", "منشأة ناصر", "طرة", "المعصرة", "التبين"],
    "جيزة": ["الجيزة", "6 أكتوبر", "الشيخ زايد", "حدائق الأهرام", "الدقي", "المهندسين", "الهرم", "فيصل", "العجوزة", "إمبابة", "الوراق", "بولاق الدكرور", "العمرانية", "المنيب", "البدرشين", "العياط", "الصف", "أطفيح", "كرداسة", "أوسيم", "الحوامدية", "حدائق اكتوبر", "ابو النمرس", "منشأة القناطر", "الواحات البحرية", "ميت عقبة", "بين السرايات", "الكيت كات", "أرض اللواء", "ناهيا", "صفط اللبن", "كفر طهرمس", "الطوابق", "المريوطية", "الرماية"],
    "اسكندرية": ["الاسكندرية", "سموحة", "ميامي", "سيدي بشر", "المنتزه", "العجمي", "الساحل الشمالي", "محرم بك", "الشاطبي", "كامب شيزار", "الإبراهيمية", "سبورتنج", "كليوباترا", "سيدي جابر", "رشدي", "جليم", "زيزينيا", "باكوس", "فلمنج", "الظاهرية", "العصافرة", "المندرة", "المعمورة", "أبوقير", "الهانوفيل", "البيطاش", "الكيلو 21", "كينج مريوط", "برج العرب", "العامرية", "الدخيلة", "المكس", "القباري", "كرموز", "غيط العنب", "كوم الدكة", "العطارين", "المنشية", "الجمرك", "الانفوشي", "راس التين", "المندرة", "ابيس"],
    "قليوبية": ["القليوبية", "بنها", "شبرا الخيمة", "القناطر الخيرية", "العبور", "طوخ", "قها", "كفر شكر", "الخانكة", "الخصوص", "قليوب", "شبين القناطر", "الخصوص", "مسطرد", "بهتيم", "ابو زعبل"],
    "دقهلية": ["الدقهلية", "المنصورة", "طلخا", "ميت غمر", "السنبلاوين", "دكرنس", "بلقاس", "جمصة", "شربين", "المطرية", "المنزلة", "ميت سلسيل", "الجمالية", "بني عبيد", "نبروه", "محلة دمنة", "أجا", "تمي الامديد"],
    "شرقية": ["الشرقية", "الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "فاقوس", "أبو حماد", "ديرب نجم", "مشتول السوق", "أبو كبير", "ههيا", "الإبراهيمية", "كفر صقر", "أولاد صقر", "الحسينية", "صان الحجر", "القرين", "القنايات"],
    "غربية": ["الغربية", "طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "سمنود", "بسيون", "قطور"],
    "منوفية": ["المنوفية", "شبين الكوم", "منوف", "قويسنا", "بركة السبع", "تلا", "الشهداء", "السادات", "أشمون", "سرس الليان", "الباجور"],
    "بحرية": ["البحيرة", "دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص", "النوبارية", "حوش عيسى", "الدلنجات", "كوم حمادة", "وادي النطرون", "الرحمانية", "المحمودية", "شبراخيت", "ايتاي البارود"],
    "دمياط": ["دمياط", "رأس البر", "فارسكور", "الزرقا", "كفر سعد", "ميت أبو غالب", "الروضة", "السرو", "كفر البطيخ", "عزبة البرج"],
    "كفر الشيخ": ["كفر الشيخ", "دسوق", "فوه", "مطوبس", "بلطيم", "مصيف بلطيم", "الحامول", "بيلا", "الرياض", "سيدي سالم", "قلين"],
    "بورسعيد": ["بورسعيد", "بورفؤاد", "حي الشرق", "حي العرب", "حي المناخ", "حي الضواحي", "حي الزهور", "حي الجنوب"],
    "اسماعيلية": ["الاسماعيلية", "فايد", "القنطرة شرق", "القنطرة غرب", "التل الكبير", "ابو صوير", "القصاصين"],
    "سويس": ["السويس", "العين السخنة", "حي الاربعين", "حي السويس", "حي الجناين", "حي فيصل", "حي عتاقة"],
    "بحر احمر": ["البحر الاحمر", "الغردقة", "الجونة", "سفاجا", "مرسى علم", "القصير", "حلايب", "شلاتين", "سهل حشيش", "مكادي", "سوما باي", "رأس غارب"],
    "جنوب سيناء": ["جنوب سيناء", "شرم الشيخ", "دهب", "نويبع", "طابا", "سانت كاترين", "الطور", "راس سدر"],
    "شمال سيناء": ["شمال سيناء", "العريش", "الشيخ زويد", "رفح", "بئر العبد", "الحسنة", "نخل"],
    "فيوم": ["الفيوم", "سنورس", "إطسا", "طامية", "ابشواي", "يوسف الصديق"],
    "بني سويف": ["بني سويف", "الواسطى", "ناصر", "اهناسيا", "ببا", "الفشن", "سمسطا"],
    "منيا": ["المنيا", "المنيا الجديدة", "ملوي", "بني مزار", "مغاغة", "سمالوط", "أبو قرقاص", "العدوة", "مطاي", "دير مواس"],
    "اسيوط": ["اسيوط", "ديروط", "القوصية", "أبنوب", "منفلوط", "أبو تيج", "الغنايم", "ساحل سليم", "البداري", "صدفا", "الفتح", "اسيوط الجديدة"],
    "سوهاج": ["سوهاج", "أخميم", "جرجا", "طمه", "طهطا", "المراغة", "جهينة", "المنشاة", "ساقلتة", "دار السلام", "البلينا", "سوهاج الجديدة"],
    "قنا": ["قنا", "نجع حمادي", "دشنا", "أبو تشت", "قوص", "نقادة", "فرشوط", "الوقف", "قفط", "قنا الجديدة"],
    "اقصر": ["الاقصر", "اسنا", "أرمنت", "طيبة", "القرنة"],
    "اسوان": ["اسوان", "كوم امبو", "إدفو", "نصر النوبة", "دراو", "ابو سمبل"],
    "مطروح": ["مطروح", "الساحل الشمالي", "العلمين", "مراسي", "هاسيندا", "مارينا", "سيدي عبد الرحمن", "الضبعة", "رأس الحكمة", "سيوة", "الحمام"],
    "وادي جديد": ["الوادي الجديد", "الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"]
};

// ... (دوال Levenshtein, normalizeText, expandSearchKeywords كما هي في الكود السابق) ...
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

// ... (searchPropertiesInDB, searchPropertiesInDBGeneral كما هي) ...
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
            await sendDiscordNotification("🎯 Lead Alert! (عميل مهتم)", [{ name: "📞 الرقم", value: phoneMatch[0] }, { name: "💬 الرسالة", value: message }, { name: "📜 السياق", value: contextText }], 15158332);
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
        const chatSession = model.startChat({ history: chatHistories[sessionId].history, generationConfig: { maxOutputTokens: 2000, temperature: 0.0 }, });
        const result = await chatSession.sendMessage(finalPrompt);
        let reply = result.response.text();
        reply = reply.replace(/```html/g, '').replace(/```/g, '').trim();
        chatHistories[sessionId].history.push({ role: "user", parts: [{ text: finalPrompt }] });
        chatHistories[sessionId].history.push({ role: "model", parts: [{ text: reply }] });
        res.json({ reply: reply });
    } catch (error) { console.error("Gemini Error:", error); res.status(500).json({ reply: "معلش يا هندسة، النت تقيل. جرب تاني!" }); }
});

// ==========================================================
// 🚀 نظام التوثيق بالهاتف (WhatsApp Auth)
// ==========================================================

// 1. توليد وإرسال كود التحقق (للتسجيل أو نسيان كلمة المرور)
app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

    // توليد كود عشوائي من 4 أرقام
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // حفظ الكود في الذاكرة لمدة 10 دقائق
    otpStore[phone] = { code: otp, expires: Date.now() + 10 * 60 * 1000 };

    const message = `🔐 كود التحقق الخاص بك في *عقارك* هو: *${otp}*\nصلاحية الكود 10 دقائق.`;
    
    const sent = await sendWhatsAppMessage(phone, message);
    if (sent) {
        res.json({ success: true, message: 'تم إرسال الكود عبر واتساب' });
    } else {
        res.status(500).json({ success: false, message: 'فشل إرسال الكود. تأكد من الرقم.' });
    }
});

// 2. التحقق من الكود (للتسجيل)
app.post('/api/register', async (req, res) => {
    const { name, phone, password, otp } = req.body;

    // التحقق من صحة الـ OTP
    if (!otpStore[phone] || otpStore[phone].code !== otp || Date.now() > otpStore[phone].expires) {
        return res.status(400).json({ message: 'كود التحقق غير صحيح أو منتهي الصلاحية' });
    }

    // مسح الكود بعد الاستخدام
    delete otpStore[phone];

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await pgQuery(`INSERT INTO users (name, phone, password, role) VALUES ($1, $2, $3, $4)`, [name, phone, hashedPassword, 'user']);
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
    } catch (error) {
        if (error.message.includes('unique constraint')) return res.status(400).json({ message: 'رقم الهاتف مسجل مسبقاً' });
        res.status(500).json({ message: 'خطأ في السيرفر' });
    }
});

// 3. تسجيل الدخول (باستخدام الهاتف)
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body; // تغيير من email لـ phone
    let user = null; let role = 'user';

    // دخول الأدمن الثابت (بأي رقم معين أو الرقم الثابت)
    if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) { 
        user = { id: 0, name: 'Admin', phone: phone }; role = 'admin'; 
    } else {
        try {
            const r = await pgQuery(`SELECT * FROM users WHERE phone=$1`, [phone]);
            if (!r.rows[0] || !(await bcrypt.compare(password, r.rows[0].password))) return res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور خطأ' });
            user = r.rows[0]; role = user.role;
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    const token = jwt.sign({ id: user.id, phone: user.phone, role: role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite:'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, role: role, message: 'تم الدخول بنجاح' });
});

// 4. إعادة تعيين كلمة المرور (Verify OTP + New Password)
app.post('/api/auth/reset-password', async (req, res) => {
    const { phone, otp, newPassword } = req.body;

    if (!otpStore[phone] || otpStore[phone].code !== otp || Date.now() > otpStore[phone].expires) {
        return res.status(400).json({ message: 'الكود غير صحيح' });
    }

    try {
        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pgQuery(`UPDATE users SET password = $1 WHERE phone = $2`, [hash, phone]);
        delete otpStore[phone];
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) { res.status(500).json({ message: 'خطأ' }); }
});

app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ isAuthenticated: false, role: 'guest' });
    try { const decoded = jwt.verify(token, JWT_SECRET); res.json({ isAuthenticated: true, role: decoded.role, phone: decoded.phone }); } // Return phone instead of email
    catch (err) { res.json({ isAuthenticated: false, role: 'guest' }); }
});

// ... (باقي الـ Routes زي ما هي: favorites, properties, requests...) ...
app.post('/api/logout', (req, res) => { res.clearCookie('auth_token'); res.json({ success: true, message: 'تم الخروج' }); });
app.put('/api/admin/toggle-badge/:id', async (req, res) => { const token = req.cookies.auth_token; try { const decoded = jwt.verify(token, JWT_SECRET); if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); } catch(e) { return res.status(401).json({message: 'سجل دخول أولاً'}); } try { await pgQuery(`UPDATE properties SET "${req.body.type}" = $1 WHERE id = $2`, [req.body.value, req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ message: 'Error' }); } });
app.post('/api/subscribe', async (req, res) => { try { await pgQuery(`INSERT INTO subscriptions (endpoint, keys) VALUES ($1, $2) ON CONFLICT (endpoint) DO NOTHING`, [req.body.endpoint, JSON.stringify(req.body.keys)]); res.status(201).json({}); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/make-offer', async (req, res) => { const { propertyId, buyerName, buyerPhone, offerPrice } = req.body; try { await pgQuery(`INSERT INTO property_offers (property_id, buyer_name, buyer_phone, offer_price, created_at) VALUES ($1, $2, $3, $4, $5)`, [propertyId, buyerName, buyerPhone, offerPrice, new Date().toISOString()]); const propRes = await pgQuery('SELECT title FROM properties WHERE id = $1', [propertyId]); await sendDiscordNotification("💰 عرض سعر جديد", [{ name: "🏠 العقار", value: propRes.rows[0]?.title || 'غير معروف' }, { name: "📉 العرض", value: `${offerPrice} ج.م` }, { name: "👤 المشتري", value: `${buyerName} - ${buyerPhone}` }], 16753920); res.status(200).json({ success: true }); } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); } });
app.post('/api/admin/publish-submission', async (req, res) => { const { submissionId, hiddenCode } = req.body; try { const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]); const sub = subRes.rows[0]; const imageUrls = (sub.imagePaths || '').split(' | ').filter(Boolean); const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "isFeatured", "isLegal", "video_urls") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`; const params = [sub.propertyTitle, sub.propertyPrice, parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), safeInt(sub.propertyRooms), safeInt(sub.propertyBathrooms), safeInt(sub.propertyArea), sub.propertyDescription, imageUrls[0], JSON.stringify(imageUrls), sub.propertyType, hiddenCode, sub.sellerName, sub.sellerPhone, false, false, []]; const result = await pgQuery(sql, params); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]); notifyAllUsers(`عقار جديد!`, sub.propertyTitle, `/property-details?id=${result.rows[0].id}`); res.status(201).json({ success: true, id: result.rows[0].id }); } catch (err) { res.status(400).json({ message: 'Error' }); } });
app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => { const files = req.files || []; const data = req.body; const urls = files.map(f => f.path); let videoUrls = []; try { videoUrls = JSON.parse(data.video_urls || '[]'); } catch(e) {} const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "isFeatured", "isLegal", "video_urls") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`; const params = [data.title, data.price, parseFloat((data.price || '0').replace(/[^0-9.]/g, '')), safeInt(data.rooms), safeInt(data.bathrooms), safeInt(data.area), data.description, urls[0], JSON.stringify(urls), data.type, data.hiddenCode, "Admin", ADMIN_EMAIL, false, false, videoUrls]; try { const result = await pgQuery(sql, params); res.status(201).json({ success: true, id: result.rows[0].id }); } catch (err) { res.status(400).json({ message: 'Error' }); } });
app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => { const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages, video_urls } = req.body; let oldUrls = []; try { oldUrls = JSON.parse((Array.isArray(existingImages) ? existingImages[0] : existingImages) || '[]'); } catch(e) {} const newUrls = req.files ? req.files.map(f => f.path) : []; const allUrls = [...oldUrls, ...newUrls]; let videoUrlsArr = []; try { videoUrlsArr = JSON.parse(video_urls || '[]'); } catch(e) {} const sql = `UPDATE properties SET title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11, "video_urls"=$12 WHERE id=$13`; const params = [title, price, parseFloat((price||'0').replace(/,/g,'')), safeInt(rooms), safeInt(bathrooms), safeInt(area), description, allUrls[0], JSON.stringify(allUrls), type, hiddenCode, videoUrlsArr, req.params.id]; try { await pgQuery(sql, params); res.status(200).json({ message: 'تم التحديث' }); } catch (err) { res.status(400).json({ message: `خطأ` }); } });
app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => { const data = req.body; const files = req.files || []; const paths = files.map(f => f.path).join(' | '); const sql = `INSERT INTO seller_submissions ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`; const params = [data.sellerName, data.sellerPhone, data.propertyTitle, data.propertyType, data.propertyPrice, safeInt(data.propertyArea), safeInt(data.propertyRooms), safeInt(data.propertyBathrooms), data.propertyDescription, paths, new Date().toISOString()]; try { await pgQuery(sql, params); await sendDiscordNotification("📢 طلب عرض عقار جديد!", [{ name: "👤 المالك", value: data.sellerName }, { name: "📞 الهاتف", value: data.sellerPhone }], 3066993, files[0]?.path); res.status(200).json({ success: true, message: 'تم الاستلام' }); } catch (err) { throw err; } });
app.post('/api/request-property', async (req, res) => { const { name, phone, email, specifications } = req.body; try { await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]); await sendDiscordNotification("📩 طلب عقار مخصص", [{ name: "👤 الاسم", value: name }, { name: "📝 المواصفات", value: specifications }], 15158332); res.status(200).json({ success: true }); } catch (err) { throw err; } });
app.get('/api/admin/seller-submissions', async (req, res) => { try { const r = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.get('/api/admin/property-requests', async (req, res) => { try { const r = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.delete('/api/admin/seller-submission/:id', async (req, res) => { try { const r = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]); if(r.rows[0]) await deleteCloudinaryImages((r.rows[0].imagePaths || '').split(' | ')); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { console.error("Delete Error:", err); res.status(500).json({ message: 'فشل الحذف' }); } });
app.delete('/api/admin/property-request/:id', async (req, res) => { try { await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });
app.get('/api/properties', async (req, res) => { let sql = "SELECT id, title, price, rooms, bathrooms, area, \"imageUrl\", type, \"isFeatured\", \"isLegal\" FROM properties"; const params = []; let idx = 1; const filters = []; const { type, limit, keyword, minPrice, maxPrice, rooms, sort } = req.query; if (type) { filters.push(`type = $${idx++}`); params.push(type === 'buy' ? 'بيع' : 'إيجار'); } if (keyword) { filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR "hiddenCode" ILIKE $${idx})`); params.push(`%${keyword}%`); idx++; } if (minPrice) { filters.push(`"numericPrice" >= $${idx++}`); params.push(Number(minPrice)); } if (maxPrice) { filters.push(`"numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); } if (rooms) { if (rooms === '4+') { filters.push(`rooms >= $${idx++}`); params.push(4); } else { filters.push(`rooms = $${idx++}`); params.push(Number(rooms)); } } if (filters.length > 0) sql += " WHERE " + filters.join(" AND "); let orderBy = "ORDER BY id DESC"; if (sort === 'price_asc') orderBy = 'ORDER BY "numericPrice" ASC'; else if (sort === 'price_desc') orderBy = 'ORDER BY "numericPrice" DESC'; else if (sort === 'oldest') orderBy = 'ORDER BY id ASC'; sql += ` ${orderBy}`; if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); } try { const result = await pgQuery(sql, params); res.json(result.rows); } catch (err) { throw err; } });
app.get('/api/property/:id', async (req, res) => { try { const r = await pgQuery(`SELECT * FROM properties WHERE id=$1`, [req.params.id]); if(r.rows[0]) { try { r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); } catch(e){ r.rows[0].imageUrls=[]; } res.json(r.rows[0]); } else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.get('/api/property-by-code/:code', async (req, res) => { try { const r = await pgQuery(`SELECT id, title, price, "hiddenCode" FROM properties WHERE UPPER("hiddenCode") LIKE UPPER($1)`, [`%${req.params.code}%`]); if(r.rows[0]) res.json(r.rows[0]); else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.delete('/api/property/:id', async (req, res) => { try { const resGet = await pgQuery(`SELECT "imageUrls" FROM properties WHERE id=$1`, [req.params.id]); if(resGet.rows[0]) await deleteCloudinaryImages(JSON.parse(resGet.rows[0].imageUrls)); await pgQuery(`DELETE FROM properties WHERE id=$1`, [req.params.id]); res.json({message: 'تم الحذف'}); } catch (e) { throw e; } });
app.post('/api/favorites', async (req, res) => { try { await pgQuery(`INSERT INTO favorites (user_email, property_id) VALUES ($1, $2)`, [req.body.userEmail, req.body.propertyId]); res.status(201).json({ success: true }); } catch (err) { if (err.code === '23505') return res.status(409).json({ message: 'موجودة' }); throw err; } });
app.delete('/api/favorites/:propertyId', async (req, res) => { try { await pgQuery(`DELETE FROM favorites WHERE user_email = $1 AND property_id = $2`, [req.query.userEmail, req.params.propertyId]); res.json({ success: true }); } catch (err) { throw err; } });
app.get('/api/favorites', async (req, res) => { const sql = `SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p."imageUrl", p.type, f.id AS favorite_id FROM properties p JOIN favorites f ON p.id = f.property_id WHERE f.user_email = $1 ORDER BY f.id DESC`; try { const result = await pgQuery(sql, [req.query.userEmail]); res.json(result.rows); } catch (err) { throw err; } });
// باقي الـ Routes (تغيير باسورد وحذف حساب) هنخليها تعتمد على Phone بدل Email في المستقبل لو حبيت
app.delete('/api/user/delete-account', async (req, res) => { try { await pgQuery(`DELETE FROM users WHERE phone = $1`, [req.body.phone]); res.json({ success: true }); } catch (err) { throw err; } });

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'home.html')); });
app.get('/api/ping', (req, res) => res.json({status: "OK"}));

app.use((err, req, res, next) => {
    console.log("🔥 ERROR CAUGHT:"); console.error(err);
    if (res.headersSent) return next(err);
    if (err instanceof multer.MulterError) return res.status(500).json({ success: false, message: `فشل الرفع: ${err.code}` });
    res.status(500).json({ success: false, message: 'خطأ داخلي', error: err.message });
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });