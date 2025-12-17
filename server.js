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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
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

// ... دوال الإشعارات ...
async function sendDiscordNotification(title, fields, color = 3447003, imageUrl = null) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("ضع_رابط")) return;
    const embed = { title, color, fields, footer: { text: "Aqarak Bot 🏠" }, timestamp: new Date().toISOString() };
    if (imageUrl) embed.image = { url: imageUrl };
    try { await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) }); } catch (error) { console.error("❌ Discord Error:", error.message); }
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

async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS properties (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price TEXT NOT NULL, "numericPrice" NUMERIC, rooms INTEGER, bathrooms INTEGER, area INTEGER, description TEXT, "imageUrl" TEXT, "imageUrls" TEXT, type TEXT NOT NULL, "hiddenCode" TEXT UNIQUE, "sellerName" TEXT, "sellerPhone" TEXT, "isFeatured" BOOLEAN DEFAULT FALSE, "isLegal" BOOLEAN DEFAULT FALSE, "video_urls" TEXT[] DEFAULT '{}')`,
        `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'user')`,
        `CREATE TABLE IF NOT EXISTS seller_submissions (id SERIAL PRIMARY KEY, "sellerName" TEXT NOT NULL, "sellerPhone" TEXT NOT NULL, "propertyTitle" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "propertyPrice" TEXT NOT NULL, "propertyArea" INTEGER, "propertyRooms" INTEGER, "propertyBathrooms" INTEGER, "propertyDescription" TEXT, "imagePaths" TEXT, "submissionDate" TEXT, status TEXT DEFAULT 'pending')`,
        `CREATE TABLE IF NOT EXISTS property_requests (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, specifications TEXT NOT NULL, "submissionDate" TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, property_id INTEGER NOT NULL, UNIQUE(user_email, property_id))`,
        `CREATE TABLE IF NOT EXISTS property_offers (id SERIAL PRIMARY KEY, property_id INTEGER, buyer_name TEXT, buyer_phone TEXT, offer_price TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, endpoint TEXT UNIQUE, keys TEXT)`
    ];
    try { for (const query of queries) await pgQuery(query); console.log('✅ Tables synced.'); } 
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
// 🧠 قاعدة بيانات المدن والمحافظات (الموسعة جداً) 🗺️
// ==========================================================

function expandSearchKeywords(message) {
    const locations = {
        "قاهرة": ["القاهرة", "التجمع", "الشروق", "مدينتي", "الرحاب", "المستقبل", "العاصمة الادارية", "مصر الجديدة", "مدينة نصر", "المعادي", "زهراء المعادي", "المقطم", "القطامية", "الزيتون", "عين شمس", "المرج", "السلام", "العباسية", "وسط البلد", "الزمالك", "جاردن سيتي", "شبرا مصر", "حلوان", "المعصرة", "15 مايو", "بدر", "حدائق القبة", "الوايلي", "المنيل", "السيدة زينب", "عابدين", "الازبكية", "بولاق ابو العلا", "الشرابية", "روض الفرج", "الساحل", "شبرا", "المطرية", "المرج", "النزهة", "هليوبوليس", "عين شمس", "الاميرية", "حدائق القبة", "الوايلي", "باب الشعرية", "الموسكي", "الدرب الاحمر", "الخليفة", "مصر القديمة", "البساتين", "دار السلام", "طرة", "المعصرة", "التبين", "حلوان"],
        "جيزة": ["الجيزة", "6 أكتوبر", "الشيخ زايد", "حدائق الأهرام", "الدقي", "المهندسين", "الهرم", "فيصل", "العجوزة", "إمبابة", "الوراق", "بولاق الدكرور", "العمرانية", "المنيب", "البدرشين", "العياط", "الصف", "أطفيح", "كرداسة", "أوسيم", "الحوامدية", "ابو النمرس", "منشأة القناطر", "الواحات البحرية", "ميت عقبة", "بين السرايات", "الكيت كات", "أرض اللواء", "ناهيا", "صفط اللبن", "كفر طهرمس", "الطوابق", "المريوطية", "الرماية", "حدائق اكتوبر"],
        "اسكندرية": ["الاسكندرية", "سموحة", "ميامي", "سيدي بشر", "المنتزه", "العجمي", "الساحل الشمالي", "محرم بك", "الشاطبي", "كامب شيزار", "الإبراهيمية", "سبورتنج", "كليوباترا", "سيدي جابر", "رشدي", "جليم", "زيزينيا", "باكوس", "فلمنج", "الظاهرية", "العصافرة", "المندرة", "المعمورة", "أبوقير", "الهانوفيل", "البيطاش", "الكيلو 21", "كينج مريوط", "برج العرب", "العامرية", "الدخيلة", "المكس", "القباري", "كرموز", "غيط العنب", "كوم الدكة", "العطارين", "المنشية", "الجمرك", "الانفوشي", "راس التين"],
        "ساحل": ["الساحل الشمالي", "العلمين الجديدة", "مراسي", "هاسيندا", "مارينا", "سيدي عبد الرحمن", "الضبعة", "رأس الحكمة", "مطروح", "فوكا", "غزالة"],
        "قليوبية": ["القليوبية", "بنها", "شبرا الخيمة", "القناطر الخيرية", "العبور", "طوخ", "قها", "كفر شكر", "الخانكة", "الخصوص", "قليوب"],
        "دقهلية": ["الدقهلية", "المنصورة", "طلخا", "ميت غمر", "السنبلاوين", "دكرنس", "بلقاس", "جمصة", "شربين", "المطرية", "المنزلة", "ميت سلسيل", "الجمالية", "بني عبيد", "نبروه", "محلة دمنة", "أجا"],
        "شرقية": ["الشرقية", "الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "فاقوس", "أبو حماد", "ديرب نجم", "مشتول السوق", "أبو كبير", "ههيا", "الإبراهيمية", "كفر صقر", "أولاد صقر", "الحسينية", "صان الحجر", "القرين", "القنايات"],
        "غربية": ["الغربية", "طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "سمنود", "بسيون", "قطور"],
        "منوفية": ["المنوفية", "شبين الكوم", "منوف", "قويسنا", "بركة السبع", "تلا", "الشهداء", "السادات", "أشمون", "سرس الليان", "الباجور"],
        "بحرية": ["البحيرة", "دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص", "النوبارية", "حوش عيسى", "الدلنجات", "كوم حمادة", "وادي النطرون", "الرحمانية", "المحمودية", "شبراخيت", "ايتاي البارود"],
        "سويس": ["السويس", "العين السخنة", "الأربعين", "عتاقة", "الجناين", "فيصل"],
        "بورسعيد": ["بورسعيد", "بورفؤاد", "الزهور", "الشرق", "العرب", "الضواحي", "المناخ"],
        "اسماعيلية": ["الاسماعيلية", "فايد", "القنطرة", "التل الكبير", "ابو صوير", "القصاصين"],
        "بحر احمر": ["البحر الاحمر", "الغردقة", "الجونة", "سفاجا", "مرسى علم", "القصير", "حلايب", "شلاتين", "سهل حشيش", "مكادي", "سوما باي"],
        "جنوب سيناء": ["جنوب سيناء", "شرم الشيخ", "دهب", "نويبع", "طابا", "سانت كاترين", "الطور", "راس سدر"],
        "فيوم": ["الفيوم", "سنورس", "إطسا", "طامية", "ابشواي", "يوسف الصديق"],
        "بني سويف": ["بني سويف", "الواسطى", "ناصر", "اهناسيا", "ببا", "الفشن", "سمسطا"],
        "منيا": ["المنيا", "ملوي", "بني مزار", "مغاغة", "سمالوط", "أبو قرقاص", "العدوة", "مطاي", "دير مواس"],
        "اسيوط": ["اسيوط", "ديروط", "القوصية", "أبنوب", "منفلوط", "أبو تيج", "الغنايم", "ساحل سليم", "البداري", "صدفا", "الفتح"],
        "سوهاج": ["سوهاج", "أخميم", "جرجا", "طمه", "طهطا", "المراغة", "جهينة", "المنشاة", "ساقلتة", "دار السلام", "البلينا"],
        "قنا": ["قنا", "نجع حمادي", "دشنا", "أبو تشت", "قوص", "نقادة", "فرشوط", "الوقف", "قفط"],
        "اقصر": ["الاقصر", "اسنا", "أرمنت", "طيبة", "القرنة"],
        "اسوان": ["اسوان", "كوم امبو", "إدفو", "نصر النوبة", "دراو", "ابو سمبل"]
    };

    let keywords = message.replace(/[^\u0621-\u064A\s]/g, '').split(' ').filter(w => w.length > 2);
    let expandedKeywords = [...keywords];

    for (const [gov, cities] of Object.entries(locations)) {
        if (cities.some(city => message.includes(city))) expandedKeywords.push(gov);
        if (message.includes(gov)) expandedKeywords.push(...cities);
    }
    return [...new Set(expandedKeywords)];
}

async function searchPropertiesInDB(query) {
    const keywords = expandSearchKeywords(query);
    if (keywords.length === 0) return null;

    const conditions = keywords.map((_, i) => `(title ILIKE $${i+1} OR description ILIKE $${i+1})`).join(' OR ');
    const params = keywords.map(k => `%${k}%`);
    
    try {
        const result = await pgQuery(`SELECT id, title, price, type, rooms, bathrooms, area, description FROM properties WHERE ${conditions} LIMIT 10`, params); // زودنا Limit شوية عشان العد
        if (result.rows.length === 0) return null;
        
        // إرسال البيانات "خام" للبوت وهو يتصرف في العرض
        return JSON.stringify(result.rows);
    } catch (e) { return null; }
}

// ==========================================================
// 🧠 دستور البوت (System Prompt) - معدل بالكامل
// ==========================================================

const SYSTEM_INSTRUCTION = `
أنت "مساعد عقارك" الذكي 🏠. 
تتحدث باللهجة المصرية الودودة (نوع في الألقاب: يا هندسة، يا باشا، يا فندم، يا معلم، يا ست الكل).
دورك مساعدة المستخدمين في العقارات (شقق وفيلات فقط) بناءً على الدليل التالي.

⛔ **الممنوعات والحدود:**
1. **نطاق العمل:** نحن نعمل في **الشقق والفيلات فقط**. لا نعمل في المحلات التجارية أو الأراضي أو التعامل مع السماسرة حالياً.
2. **المواضيع الشخصية:** لا تتدخل في الأمور الشخصية (مثل: كيف أفتح قناة يوتيوب، طبخ، رياضة). رد بأدب: "ده خارج تخصصي، أنا هنا لمساعدتك في العقارات بس".
3. **الاستثناء القانوني:** مسموح لك مراجعة بنود عقود البيع والإيجار إذا طلب العميل.
4. **تسجيل الدخول:** الموقع **لا يحتاج لتسجيل دخول**. ممنوع تأليف خطوات تسجيل.
5. **الروابط:** اكتب الروابط نصاً فقط.

🔄 **منطق البحث والرد (هام جداً):**
1. **إذا بحث المستخدم عن "محافظة" (مثل: القاهرة):**
   - لا تعرض كروت العقارات فوراً.
   - قم بفرز البيانات المرسلة لك، واذكر عدد العقارات في كل مدينة تابعة للمحافظة.
   - مثال: "متاح حالياً 3 عقارات في التجمع، وعقارين في الشروق يا باشا".
2. **إذا اختار مدينة محددة (مثل: الشروق):**
   - اشرح تفاصيل العقارات المتاحة نصياً أولاً (الأسعار، المساحات).
   - ثم اعرض عليه: "تحب تشوف كروت لأحدث 3 عقارات؟".
3. **إذا وافق على عرض الكروت (أو طلب "وريني"، "عايز أشوف"):**
   - اعرض أحدث 3 عقارات باستخدام **كود HTML للكارت المربع الصغير** التالي (بالحرف):

   \`\`\`html
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
   \`\`\`
   *(استبدل {ID}, {TITLE}, {PRICE}, {TYPE} (بيع/إيجار), {ROOMS}, {BATHS}, {AREA} بالبيانات)*.

📘 **دليل استخدام الموقع (مرجعك الحصري):**

**1️⃣ عام:**
* الموقع بدون تسجيل دخول.
* **شعار "مميز":** بـ 50 ج.م، أو **مجاناً** لو العقار "لقطة" (بقرار التسويق).
* **شعار "قانوني":** يوضع بعد فحص الأوراق (أتعاب المحامي فقط).

**2️⃣ للبائع (عرض عقار):**
* يضغط "اعرض عقار للبيع" -> يملأ البيانات -> يرسل -> ينتظر الموافقة والتواصل.
* **العمولة:** 0% (مجاناً) حتى 3 مارس 2026. بعدها 1%.
* **الفيديو/التعديل:** عبر واتساب 01008102237 مجاناً.

**3️⃣ للمشتري:**
* البحث بالفلتر أو الشريط.
* التواصل عبر زر واتساب في صفحة العقار (نحن الوسيط، لا تواصل مباشر مع المالك).
* "احجز عقارك" لو مش لاقي طلبه.

**4️⃣ خدمات التشطيب:**
* (ألوميتال، نجارة، ديكور.. إلخ) من زر "القائمة" -> "الخدمات".

**الروابط الرسمية:**
* واتساب: https://wa.me/201008102237
* فيسبوك: https://www.facebook.com/share/17b14ZTvd9/
`;

const chatHistories = {};

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const sessionId = req.cookies.auth_token || 'guest_' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress);

        if (!message) return res.json({ reply: "" });

        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [
                { role: "user", parts: [{ text: SYSTEM_INSTRUCTION }] },
                { role: "model", parts: [{ text: "تمام يا ريس، أنا جاهز وقارئ التعليمات كويس." }] }
            ];
        }

        let dbContext = "";
        // توسيع نطاق البحث ليشمل كل شيء متعلق بالعقار
        if (message.includes("شقة") || message.includes("عقار") || message.includes("ايجار") || message.includes("بيع") || message.includes("في ") || message.includes("محافظة") || message.includes("مدينة")) {
            const searchResult = await searchPropertiesInDB(message);
            if (searchResult) {
                // بنبعت البيانات خام، والبوت هو اللي هيقرر يعرض عدد ولا تفاصيل ولا كروت حسب التعليمات
                dbContext = `\n[نتائج قاعدة البيانات (استخدمها حسب السيناريو المطلوب): ${searchResult}]`;
            } else {
                dbContext = `\n[لا توجد نتائج في القاعدة. اقترح "احجز عقارك".]`;
            }
        }

        const chatSession = model.startChat({
            history: chatHistories[sessionId],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.4 }, 
        });

        const finalPrompt = message + dbContext;
        const result = await chatSession.sendMessage(finalPrompt);
        const reply = result.response.text();

        // تحديث الذاكرة
        chatHistories[sessionId].push({ role: "user", parts: [{ text: finalPrompt }] });
        chatHistories[sessionId].push({ role: "model", parts: [{ text: reply }] });

        res.json({ reply: reply });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "معلش يا هندسة، النت تقيل شوية. جرب تاني!" });
    }
});

// ... (Login/Register/CRUD - انسخهم من الكود السابق كما هم) ...
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    let user = null; let role = 'user';
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) { user = { id: 0, name: 'Admin', email: email }; role = 'admin'; } 
    else {
        try {
            const r = await pgQuery(`SELECT * FROM users WHERE email=$1`, [email]);
            if (!r.rows[0] || !(await bcrypt.compare(password, r.rows[0].password))) return res.status(401).json({ message: 'بيانات خاطئة' });
            user = r.rows[0]; role = user.role;
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite:'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, role: role, message: 'تم الدخول بنجاح' });
});

app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.json({ isAuthenticated: false, role: 'guest' });
    try { const decoded = jwt.verify(token, JWT_SECRET); res.json({ isAuthenticated: true, role: decoded.role, email: decoded.email }); } 
    catch (err) { res.json({ isAuthenticated: false, role: 'guest' }); }
});

app.post('/api/logout', (req, res) => { res.clearCookie('auth_token'); res.json({ success: true, message: 'تم الخروج' }); });

app.put('/api/admin/toggle-badge/:id', async (req, res) => {
    const token = req.cookies.auth_token;
    try { const decoded = jwt.verify(token, JWT_SECRET); if(decoded.role !== 'admin') return res.status(403).json({message: 'غير مسموح'}); } 
    catch(e) { return res.status(401).json({message: 'سجل دخول أولاً'}); }
    try { await pgQuery(`UPDATE properties SET "${req.body.type}" = $1 WHERE id = $2`, [req.body.value, req.params.id]); res.json({ success: true }); } 
    catch (err) { res.status(500).json({ message: 'Error' }); }
});

app.post('/api/subscribe', async (req, res) => {
    try { await pgQuery(`INSERT INTO subscriptions (endpoint, keys) VALUES ($1, $2) ON CONFLICT (endpoint) DO NOTHING`, [req.body.endpoint, JSON.stringify(req.body.keys)]); res.status(201).json({}); } 
    catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/make-offer', async (req, res) => {
    const { propertyId, buyerName, buyerPhone, offerPrice } = req.body;
    try {
        await pgQuery(`INSERT INTO property_offers (property_id, buyer_name, buyer_phone, offer_price, created_at) VALUES ($1, $2, $3, $4, $5)`, [propertyId, buyerName, buyerPhone, offerPrice, new Date().toISOString()]);
        const propRes = await pgQuery('SELECT title FROM properties WHERE id = $1', [propertyId]);
        await sendDiscordNotification("💰 عرض سعر جديد", [{ name: "🏠 العقار", value: propRes.rows[0]?.title || 'غير معروف' }, { name: "📉 العرض", value: `${offerPrice} ج.م` }, { name: "👤 المشتري", value: `${buyerName} - ${buyerPhone}` }], 16753920);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ message: 'خطأ سيرفر' }); }
});

app.post('/api/admin/publish-submission', async (req, res) => {
    const { submissionId, hiddenCode } = req.body;
    try {
        const subRes = await pgQuery(`SELECT * FROM seller_submissions WHERE id = $1`, [submissionId]);
        const sub = subRes.rows[0];
        const imageUrls = (sub.imagePaths || '').split(' | ').filter(Boolean);
        const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "isFeatured", "isLegal", "video_urls") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`;
        const params = [sub.propertyTitle, sub.propertyPrice, parseFloat(sub.propertyPrice.replace(/[^0-9.]/g, '')), safeInt(sub.propertyRooms), safeInt(sub.propertyBathrooms), safeInt(sub.propertyArea), sub.propertyDescription, imageUrls[0], JSON.stringify(imageUrls), sub.propertyType, hiddenCode, sub.sellerName, sub.sellerPhone, false, false, []];
        const result = await pgQuery(sql, params);
        await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [submissionId]);
        notifyAllUsers(`عقار جديد!`, sub.propertyTitle, `/property-details?id=${result.rows[0].id}`);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) { res.status(400).json({ message: 'Error' }); }
});

app.post('/api/add-property', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const files = req.files || []; const data = req.body;
    const urls = files.map(f => f.path);
    let videoUrls = []; try { videoUrls = JSON.parse(data.video_urls || '[]'); } catch(e) {}
    const sql = `INSERT INTO properties (title, price, "numericPrice", rooms, bathrooms, area, description, "imageUrl", "imageUrls", type, "hiddenCode", "sellerName", "sellerPhone", "isFeatured", "isLegal", "video_urls") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`;
    const params = [data.title, data.price, parseFloat((data.price || '0').replace(/[^0-9.]/g, '')), safeInt(data.rooms), safeInt(data.bathrooms), safeInt(data.area), data.description, urls[0], JSON.stringify(urls), data.type, data.hiddenCode, "Admin", ADMIN_EMAIL, false, false, videoUrls];
    try { const result = await pgQuery(sql, params); res.status(201).json({ success: true, id: result.rows[0].id }); } 
    catch (err) { res.status(400).json({ message: 'Error' }); }
});

app.put('/api/update-property/:id', uploadProperties.array('propertyImages', 10), async (req, res) => {
    const { title, price, rooms, bathrooms, area, description, type, hiddenCode, existingImages, video_urls } = req.body;
    let oldUrls = []; try { oldUrls = JSON.parse((Array.isArray(existingImages) ? existingImages[0] : existingImages) || '[]'); } catch(e) {}
    const newUrls = req.files ? req.files.map(f => f.path) : [];
    const allUrls = [...oldUrls, ...newUrls];
    let videoUrlsArr = []; try { videoUrlsArr = JSON.parse(video_urls || '[]'); } catch(e) {}
    const sql = `UPDATE properties SET title=$1, price=$2, "numericPrice"=$3, rooms=$4, bathrooms=$5, area=$6, description=$7, "imageUrl"=$8, "imageUrls"=$9, type=$10, "hiddenCode"=$11, "video_urls"=$12 WHERE id=$13`;
    const params = [title, price, parseFloat((price||'0').replace(/,/g,'')), safeInt(rooms), safeInt(bathrooms), safeInt(area), description, allUrls[0], JSON.stringify(allUrls), type, hiddenCode, videoUrlsArr, req.params.id];
    try { await pgQuery(sql, params); res.status(200).json({ message: 'تم التحديث' }); } catch (err) { res.status(400).json({ message: `خطأ` }); }
});

app.post('/api/submit-seller-property', uploadSeller.array('images', 10), async (req, res) => {
    const data = req.body; const files = req.files || [];
    const paths = files.map(f => f.path).join(' | ');
    const sql = `INSERT INTO seller_submissions ("sellerName", "sellerPhone", "propertyTitle", "propertyType", "propertyPrice", "propertyArea", "propertyRooms", "propertyBathrooms", "propertyDescription", "imagePaths", "submissionDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
    const params = [data.sellerName, data.sellerPhone, data.propertyTitle, data.propertyType, data.propertyPrice, safeInt(data.propertyArea), safeInt(data.propertyRooms), safeInt(data.propertyBathrooms), data.propertyDescription, paths, new Date().toISOString()];
    try { await pgQuery(sql, params); await sendDiscordNotification("📢 طلب عرض عقار جديد!", [{ name: "👤 المالك", value: data.sellerName }, { name: "📞 الهاتف", value: data.sellerPhone }], 3066993, files[0]?.path); res.status(200).json({ success: true, message: 'تم الاستلام' }); } 
    catch (err) { throw err; }
});

app.post('/api/request-property', async (req, res) => {
    const { name, phone, email, specifications } = req.body;
    try { await pgQuery(`INSERT INTO property_requests (name, phone, email, specifications, "submissionDate") VALUES ($1, $2, $3, $4, $5)`, [name, phone, email, specifications, new Date().toISOString()]); await sendDiscordNotification("📩 طلب عقار مخصص", [{ name: "👤 الاسم", value: name }, { name: "📝 المواصفات", value: specifications }], 15158332); res.status(200).json({ success: true }); } 
    catch (err) { throw err; }
});

app.get('/api/admin/seller-submissions', async (req, res) => { try { const r = await pgQuery("SELECT * FROM seller_submissions WHERE status = 'pending' ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.get('/api/admin/property-requests', async (req, res) => { try { const r = await pgQuery("SELECT * FROM property_requests ORDER BY \"submissionDate\" DESC"); res.json(r.rows); } catch (err) { throw err; } });
app.delete('/api/admin/seller-submission/:id', async (req, res) => { try { const r = await pgQuery(`SELECT "imagePaths" FROM seller_submissions WHERE id = $1`, [req.params.id]); if (r.rows[0]) await deleteCloudinaryImages((r.rows[0].imagePaths || '').split(' | ')); await pgQuery(`DELETE FROM seller_submissions WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });
app.delete('/api/admin/property-request/:id', async (req, res) => { try { await pgQuery(`DELETE FROM property_requests WHERE id = $1`, [req.params.id]); res.json({ message: 'تم الحذف' }); } catch (err) { throw err; } });

app.get('/api/properties', async (req, res) => { 
    let sql = "SELECT id, title, price, rooms, bathrooms, area, \"imageUrl\", type, \"isFeatured\", \"isLegal\" FROM properties"; 
    const params = []; let idx = 1; const filters = []; const { type, limit, keyword, minPrice, maxPrice, rooms, sort } = req.query; 
    if (type) { filters.push(`type = $${idx++}`); params.push(type === 'buy' ? 'بيع' : 'إيجار'); } 
    if (keyword) { filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR "hiddenCode" ILIKE $${idx})`); params.push(`%${keyword}%`); idx++; } 
    if (minPrice) { filters.push(`"numericPrice" >= $${idx++}`); params.push(Number(minPrice)); } 
    if (maxPrice) { filters.push(`"numericPrice" <= $${idx++}`); params.push(Number(maxPrice)); } 
    if (rooms) { if (rooms === '4+') { filters.push(`rooms >= $${idx++}`); params.push(4); } else { filters.push(`rooms = $${idx++}`); params.push(Number(rooms)); } } 
    if (filters.length > 0) sql += " WHERE " + filters.join(" AND "); 
    let orderBy = "ORDER BY id DESC"; 
    if (sort === 'price_asc') orderBy = 'ORDER BY "numericPrice" ASC'; else if (sort === 'price_desc') orderBy = 'ORDER BY "numericPrice" DESC'; else if (sort === 'oldest') orderBy = 'ORDER BY id ASC'; 
    sql += ` ${orderBy}`; 
    if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit)); } 
    try { const result = await pgQuery(sql, params); res.json(result.rows); } catch (err) { throw err; } 
});

app.get('/api/property/:id', async (req, res) => { try { const r = await pgQuery(`SELECT * FROM properties WHERE id=$1`, [req.params.id]); if(r.rows[0]) { try { r.rows[0].imageUrls = JSON.parse(r.rows[0].imageUrls); } catch(e){ r.rows[0].imageUrls=[]; } res.json(r.rows[0]); } else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.get('/api/property-by-code/:code', async (req, res) => { try { const r = await pgQuery(`SELECT id, title, price, "hiddenCode" FROM properties WHERE UPPER("hiddenCode") LIKE UPPER($1)`, [`%${req.params.code}%`]); if(r.rows[0]) res.json(r.rows[0]); else res.status(404).json({message: 'غير موجود'}); } catch(e) { throw e; } });
app.delete('/api/property/:id', async (req, res) => { try { const resGet = await pgQuery(`SELECT "imageUrls" FROM properties WHERE id=$1`, [req.params.id]); if(resGet.rows[0]) await deleteCloudinaryImages(JSON.parse(resGet.rows[0].imageUrls)); await pgQuery(`DELETE FROM properties WHERE id=$1`, [req.params.id]); res.json({message: 'تم الحذف'}); } catch (e) { throw e; } });
app.post('/api/favorites', async (req, res) => { try { await pgQuery(`INSERT INTO favorites (user_email, property_id) VALUES ($1, $2)`, [req.body.userEmail, req.body.propertyId]); res.status(201).json({ success: true }); } catch (err) { if (err.code === '23505') return res.status(409).json({ message: 'موجودة' }); throw err; } });
app.delete('/api/favorites/:propertyId', async (req, res) => { try { await pgQuery(`DELETE FROM favorites WHERE user_email = $1 AND property_id = $2`, [req.query.userEmail, req.params.propertyId]); res.json({ success: true }); } catch (err) { throw err; } });
app.get('/api/favorites', async (req, res) => { const sql = `SELECT p.id, p.title, p.price, p.rooms, p.bathrooms, p.area, p."imageUrl", p.type, f.id AS favorite_id FROM properties p JOIN favorites f ON p.id = f.property_id WHERE f.user_email = $1 ORDER BY f.id DESC`; try { const result = await pgQuery(sql, [req.query.userEmail]); res.json(result.rows); } catch (err) { throw err; } });
app.post('/api/register', async (req, res) => { try { const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS); await pgQuery(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`, [req.body.name, req.body.email, hashedPassword, 'user']); res.status(201).json({ success: true, message: 'تم التسجيل' }); } catch (error) { if (error.message.includes('unique constraint')) return res.status(400).json({ message: 'مسجل مسبقاً' }); throw error; } });
app.put('/api/user/change-password', async (req, res) => { const { email, currentPassword, newPassword } = req.body; try { const r = await pgQuery(`SELECT * FROM users WHERE email=$1`, [email]); if (!r.rows[0] || !(await bcrypt.compare(currentPassword, r.rows[0].password))) return res.status(401).json({ message: 'خطأ' }); const hash = await bcrypt.hash(newPassword, SALT_ROUNDS); await pgQuery(`UPDATE users SET password = $1 WHERE id = $2`, [hash, r.rows[0].id]); res.json({ success: true }); } catch (err) { throw err; } });
app.delete('/api/user/delete-account', async (req, res) => { try { await pgQuery(`DELETE FROM users WHERE email = $1`, [req.body.email]); res.json({ success: true }); } catch (err) { throw err; } });

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'home.html')); });
app.get('/api/ping', (req, res) => res.json({status: "OK"}));

app.use((err, req, res, next) => {
    console.log("🔥 ERROR CAUGHT:"); console.error(err);
    if (res.headersSent) return next(err);
    if (err instanceof multer.MulterError) return res.status(500).json({ success: false, message: `فشل الرفع: ${err.code}` });
    res.status(500).json({ success: false, message: 'خطأ داخلي', error: err.message });
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });