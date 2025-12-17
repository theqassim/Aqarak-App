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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSy_PUT_YOUR_KEY_HERE"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

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
// 🧠 البحث الذكي
// ==========================================================

function expandSearchKeywords(message) {
    const locations = {
        "قاهرة": ["القاهرة", "التجمع", "الشروق", "مدينتي", "الرحاب", "المستقبل", "العاصمة", "مصر الجديدة", "مدينة نصر", "المعادي", "زهراء", "المقطم", "القطامية", "الزيتون", "عين شمس", "المرج", "السلام", "العباسية", "وسط البلد", "الزمالك", "جاردن سيتي", "شبرا", "حلوان", "المعصرة", "15 مايو", "بدر", "حدائق القبة", "الوايلي", "المنيل"],
        "جيزة": ["الجيزة", "أكتوبر", "الشيخ زايد", "حدائق الأهرام", "الدقي", "المهندسين", "الهرم", "فيصل", "العجوزة", "إمبابة", "الوراق", "بولاق", "العمرانية", "المنيب", "البدرشين", "العياط", "الصف", "أطفيح", "كرداسة", "أوسيم", "الحوامدية"],
        "اسكندرية": ["الاسكندرية", "سموحة", "ميامي", "سيدي بشر", "المنتزه", "العجمي", "الساحل", "محرم بك", "الشاطبي", "كامب شيزار", "الإبراهيمية", "سبورتنج", "كليوباترا", "سيدي جابر", "رشدي", "جليم", "زيزينيا", "باكوس", "فلمنج", "الظاهرية", "العصافرة", "المندرة", "المعمورة", "أبوقير", "الهانوفيل", "البيطاش", "الكيلو 21", "كينج مريوط", "برج العرب"],
        "ساحل": ["الساحل", "العلمين", "مراسي", "هاسيندا", "مارينا", "سيدي عبد الرحمن", "الضبعة", "رأس الحكمة", "مطروح"]
    };

    let keywords = message.replace(/[^\u0621-\u064A\s]/g, '').split(' ').filter(w => w.length > 2);
    let expandedKeywords = [...keywords];

    for (const [key, cities] of Object.entries(locations)) {
        if (message.includes(key)) expandedKeywords.push(...cities);
        if (cities.some(c => message.includes(c))) expandedKeywords.push(key);
    }
    return [...new Set(expandedKeywords)];
}

async function searchPropertiesInDB(query) {
    const keywords = expandSearchKeywords(query);
    if (keywords.length === 0) return null;

    const conditions = keywords.map((_, i) => `(title ILIKE $${i+1} OR description ILIKE $${i+1})`).join(' OR ');
    const params = keywords.map(k => `%${k}%`);
    
    try {
        const result = await pgQuery(`SELECT id, title, price, type, rooms, bathrooms, area, "imageUrl" FROM properties WHERE ${conditions} LIMIT 5`, params);
        if (result.rows.length === 0) return null;
        
        let propertiesData = [];
        result.rows.forEach(p => {
            propertiesData.push({
                id: p.id,
                title: p.title,
                price: p.price,
                type: p.type,
                rooms: p.rooms,
                bathrooms: p.bathrooms,
                area: p.area,
                image: p.imageUrl || 'logo.png' 
            });
        });
        return { count: result.rows.length, data: JSON.stringify(propertiesData) };
    } catch (e) { return null; }
}

// ==========================================================
// 🧠 تعليمات البوت (SYSTEM PROMPT)
// ==========================================================

const SYSTEM_INSTRUCTION = `
أنت "مساعد عقارك" الذكي 🏠. 
تتحدث باللهجة المصرية الودودة.
دورك الوحيد هو مساعدة المستخدمين في العقارات بناءً على المعلومات التالية فقط.

⛔ **ممنوعات صارمة (Strict Rules):**
1. **ممنوع** الإجابة على أي سؤال خارج العقارات (طبخ، رياضة، سياسة، دين، نكت). ردك الثابت: "أنا متخصص عقارات بس يا هندسة 🏠".
2. **ممنوع** تأليف أي معلومات غير موجودة هنا.
3. **ممنوع** شرح خطوات تسجيل الدخول لأن الموقع لا يحتاج تسجيل.
4. **ممنوع** استخدام Markdown Code Blocks (مثل \`\`\`html) عند عرض العقارات. اعرض كود HTML مباشرة كنص عادي ليفهمه المتصفح.

✅ **دليل استخدام الموقع (مرجعك الوحيد):**

**1️⃣ استخدام الموقع (عام):**
* الموقع **لا يحتاج لتسجيل الدخول**.

**2️⃣ للبائع/المؤجر (كيف يعرض عقاره):**
* يضغط زر "اعرض عقار للبيع" بالرئيسية -> يملأ البيانات -> يدوس إرسال -> ينتظر الموافقة ويتواصل معه الفريق لإرسال الرابط.
* **العمولة:** 0% (مجاناً) حتى 3 مارس 2026. بعد هذا التاريخ ستكون 1%.
* **شعار "قانوني":** يوضع للعقار بعد فحص أوراقه وتسلسل الملكية من الشؤون القانونية (يدفع أتعاب المحامي فقط).
* **شعار "مميز":** يوضع للعقار المميز بـ 50 ج.م، أو مجاناً لو العقار "لقطة".
* **الفيديو:** لإضافة فيديو، يرسله العميل واتساب على 01008102237 ونرفعه مجاناً.
* **التعديل/الحذف:** يتم عبر التواصل على نفس رقم الواتساب مجاناً.

**3️⃣ للمشتري/المستأجر:**
* **البحث:** بشريط البحث (بالمنطقة أو السعر) أو بالأزرار (شراء/إيجار).
* **التواصل (زر واتساب):** في صفحة التفاصيل، يحولك للشات بكود العقار. بمجرد الإرسال، فريق عقارك يرد، يتواصل مع المالك فوراً، ويحدد ميعاد للمعاينة (التواصل ليس مباشراً مع المالك).
* **حجز عقار:** لو لم تجد طلبك، استخدم زر "احجز عقارك" أسفل الرئيسية.

**4️⃣ الخدمات (تشطيبات):**
* (ألوميتال، نجارة، ديكور، نقل عفش، رخام.. إلخ). اضغط زر "القائمة" -> "الخدمات".

**5️⃣ عرض العقارات (The Box):**
عندما تجد عقارات في البيانات المرسلة لك، قل "لقيت لك [العدد] عقارات:" ثم اطبع الكود التالي فوراً لكل عقار (بدون أي تنسيق Markdown):

<a href="property-details?id={ID}" class="chat-property-box"><div class="chat-box-img-container"><img src="{IMAGE}" alt="عقار" class="chat-box-img-element"><span class="chat-box-tag">{TYPE}</span></div><div class="chat-box-content"><h4 class="chat-box-title">{TITLE}</h4><div class="chat-box-price">{PRICE} ج.م</div><div class="chat-box-details"><span>🛏️ {ROOMS}</span> • <span>🛁 {BATHS}</span> • <span>📏 {AREA}م²</span></div><span class="chat-box-btn">عرض التفاصيل <i class="fas fa-arrow-left"></i></span></div></a>

* (استبدل {ID}, {IMAGE}, {TITLE}.. إلخ بالبيانات الحقيقية).
`;

const chatHistories = {};

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const sessionId = req.cookies.auth_token || 'guest_' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress);

        if (!message) return res.json({ reply: "" });

        // تصفير الذاكرة لضمان الالتزام بالتعليمات
        chatHistories[sessionId] = [
            { role: "user", parts: [{ text: SYSTEM_INSTRUCTION }] },
            { role: "model", parts: [{ text: "تمام، أنا جاهز." }] }
        ];

        let dbContext = "";
        if (message.includes("شقة") || message.includes("عقار") || message.includes("ايجار") || message.includes("بيع") || message.includes("في ")) {
            const searchResult = await searchPropertiesInDB(message);
            if (searchResult) {
                dbContext = `\n[وجدت ${searchResult.count} عقارات: ${searchResult.data}. اعرضهم بHTML Box.]`;
            } else {
                dbContext = `\n[لا توجد نتائج. اقترح "احجز عقارك".]`;
            }
        }

        const chatSession = model.startChat({
            history: chatHistories[sessionId],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.3 }, 
        });

        const finalPrompt = message + dbContext;
        const result = await chatSession.sendMessage(finalPrompt);
        const reply = result.response.text();

        res.json({ reply: reply });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "معلش النت تقيل، جرب تاني." });
    }
});

// ... (Login/Register/CRUD كما هي) ...
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