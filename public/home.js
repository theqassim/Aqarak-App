// =================================================
// 🏠 إعدادات الصفحة والمتغيرات العامة
// =================================================

let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;
let currentSearchQuery = ''; // 🔍 متغير جديد لحفظ كلمة البحث

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true);
    updateNavigation();
    updateMobileHeader();
    checkNotifications();
    setupSearchLogic(); // تشغيل منطق البحث
    
    // PWA Installer Logic
    let deferredPrompt;
    const installToast = document.getElementById('install-toast');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); deferredPrompt = e;
        if (!localStorage.getItem('installPromptDismissed')) installToast.style.display = 'flex';
    });
    document.getElementById('install-btn-action')?.addEventListener('click', async () => {
        if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; installToast.style.display = 'none'; }
    });
    document.getElementById('close-install')?.addEventListener('click', () => {
        installToast.style.display = 'none'; localStorage.setItem('installPromptDismissed', 'true');
    });
});

// =========================================
// 🔍 منطق البحث في نفس الصفحة (AJAX)
// =========================================

function setupSearchLogic() {
    const searchInputs = document.querySelectorAll('.search-bar');
    const searchButtons = document.querySelectorAll('.search-button');

    // دالة تنفيذ البحث
    window.performSearch = function(inputElement) {
        const query = inputElement.value.trim();
        
        // 1. تحديث متغير البحث العالمي
        currentSearchQuery = query;
        
        // 2. تصفير العداد عشان نبدأ من الأول
        currentOffset = 0;
        
        // 3. تغيير عنوان القسم (اختياري لتحسين التجربة)
        const titleEl = document.querySelector('.section-title');
        if(titleEl) {
            titleEl.innerHTML = query ? `نتائج البحث عن: "<span style="color:white">${query}</span>"` : 'أحدث العقارات';
        }

        // 4. جلب البيانات الجديدة
        fetchLatestProperties(true);
    };

    // تفعيل الزرار
    searchButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const input = searchInputs[index]; 
            if(input) performSearch(input);
        });
    });

    // تفعيل زر Enter
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(input);
        });
    });
}

// =========================================
// 🏘️ جلب وعرض العقارات (محدث للبحث)
// =========================================

// =========================================
// 🏘️ جلب وعرض العقارات (مع دعم AI Search)
// =========================================

async function fetchLatestProperties(isFirstLoad = false) {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('listings-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // إظهار اللودينج
    if (isFirstLoad && container) {
        currentOffset = 0;
        
        // رسالة مختلفة لو بحث
        const loadingMsg = currentSearchQuery 
            ? '<i class="fas fa-robot fa-spin fa-2x"></i><p style="margin-top:10px; color:#00ff88;">الذكاء الاصطناعي يبحث لك عن أفضل النتائج...</p>'
            : '<i class="fas fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:10px; color:#aaa;">جاري التحميل...</p>';

        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">${loadingMsg}</div>`;
        if(loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
        if(loadMoreBtn) loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
    }

    try {
        let url;
        
        // 🔥 التعديل الجوهري هنا: اختيار الراوت المناسب
        if (currentSearchQuery && currentSearchQuery.trim() !== '') {
            // لو فيه بحث -> استخدم راوت الذكاء الاصطناعي
            url = `/api/ai-search?limit=${LIMIT}&offset=${currentOffset}&query=${encodeURIComponent(currentSearchQuery)}`;
        } else {
            // لو مفيش بحث -> استخدم الراوت العادي (أسرع للعرض الأولي)
            url = `/api/properties?limit=${LIMIT}&offset=${currentOffset}`;
        }

        const response = await fetch(url);
        const properties = await response.json();
        
        if (isFirstLoad && container) container.innerHTML = '';

        if (isFirstLoad && properties.length === 0 && container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #333; margin-bottom: 15px;"></i>
                    <p style="color: #ccc; font-size: 1.1rem;">
                        ${currentSearchQuery ? 'لم نجد عقارات مطابقة تماماً، حاول تغيير كلمات البحث.' : 'لا توجد عقارات حالياً.'}
                    </p>
                    ${currentSearchQuery ? '<button onclick="clearSearch()" style="background:none; border:1px solid var(--neon-primary); color:var(--neon-primary); padding:8px 20px; border-radius:20px; margin-top:10px; cursor:pointer;">عرض الكل</button>' : ''}
                </div>
            `;
            isLoading = false;
            return;
        }

        // رسم الكروت (نفس الكود القديم)
        properties.forEach(prop => {
            const bgImage = prop.imageUrl || 'logo.png';
            let priceText = parseInt(prop.price || 0).toLocaleString();
            const isSale = (prop.type === 'بيع' || prop.type === 'buy');
            const typeClass = isSale ? 'is-sale' : 'is-rent';
            const typeText = isSale ? 'للبيع' : 'للإيجار';
            const roomsHtml = prop.rooms ? `<span style="margin-left:8px;"><i class="fas fa-bed"></i> ${prop.rooms}</span>` : '';
            const bathsHtml = prop.bathrooms ? `<span style="margin-left:8px;"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : '';
            const areaHtml = prop.area ? `<span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>` : '';
            const featuredClass = prop.isFeatured ? 'featured-card-glow' : '';
            let extraBadges = prop.isFeatured ? `<div class="featured-crown"><i class="fas fa-crown"></i> مميز</div>` : '';
            const verifiedBadge = prop.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-left:5px; vertical-align:middle;"></i>` : '';

            const html = `
                <div class="adv-card ${featuredClass}" onclick="window.location.href='property-details?id=${prop.id}'" style="cursor: pointer;">
                    <div class="adv-card-img-box">
                        <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                        <span class="adv-type-badge ${typeClass}">${typeText}</span>
                        <div class="adv-price-tag">${priceText} ج.م</div>
                        ${extraBadges} 
                    </div>
                    <div class="adv-card-body">
                        <h3 class="adv-title" title="${prop.title}">${verifiedBadge} ${prop.title}</h3>
                        <div class="adv-features">${roomsHtml}${bathsHtml}${areaHtml}</div>
                        <a href="property-details?id=${prop.id}" class="adv-details-btn">عرض التفاصيل <i class="fas fa-arrow-left"></i></a>
                    </div>
                </div>
            `;
            if(container) container.innerHTML += html;
        });

        currentOffset += properties.length;

        // منطق زر تحميل المزيد
        const btnContainer = document.getElementById('load-more-container');
        if (!btnContainer && container) {
            const newBtnDiv = document.createElement('div');
            newBtnDiv.id = 'load-more-container';
            newBtnDiv.style.gridColumn = "1 / -1";
            newBtnDiv.style.textAlign = 'center';
            newBtnDiv.style.marginTop = '20px';
            newBtnDiv.innerHTML = `<button id="load-more-btn" class="load-more-btn">عرض المزيد <i class="fas fa-arrow-down"></i></button>`;
            container.parentNode.appendChild(newBtnDiv);
            document.getElementById('load-more-btn').addEventListener('click', () => fetchLatestProperties(false));
        }

        const btn = document.getElementById('load-more-btn');
        if (btn) {
            if (properties.length < LIMIT) btn.style.display = 'none';
            else {
                btn.style.display = 'block';
                btn.innerHTML = 'عرض المزيد <i class="fas fa-arrow-down"></i>';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        if(isFirstLoad && container) container.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ في الاتصال.</p>';
    } finally {
        isLoading = false;
    }
}
// دالة مساعدة لمسح البحث والعودة للرئيسية
window.clearSearch = function() {
    document.querySelectorAll('.search-bar').forEach(el => el.value = '');
    currentSearchQuery = '';
    currentOffset = 0;
    document.querySelector('.section-title').textContent = 'أحدث العقارات';
    fetchLatestProperties(true);
}

// =========================================
// 📱 دوال الهيدر والإشعارات (زي ما هي)
// =========================================

async function updateMobileHeader() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        const mobCenterAction = document.getElementById('mob-center-action');
        const mobMenuToggle = document.getElementById('mob-menu-toggle');
        const mobGuestBtns = document.getElementById('mob-guest-btns');
        const mobName = document.getElementById('mob-user-name');
        const mobBalance = document.getElementById('mob-user-balance');

        if (data.isAuthenticated) {
            if(mobCenterAction) mobCenterAction.style.display = 'block';
            if(mobMenuToggle) mobMenuToggle.style.display = 'flex';
            if(mobGuestBtns) mobGuestBtns.style.display = 'none';

            const verifiedBadge = data.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-right:5px; vertical-align:middle;"></i>` : '';
            
            if(mobName) mobName.innerHTML = `${data.name || 'مستخدم'} ${verifiedBadge}`;
            
            if(mobBalance) {
                if(data.isPaymentActive) {
                    mobBalance.textContent = `${data.balance || 0} نقطة`;
                    mobBalance.style.display = 'block';
                } else {
                    mobBalance.style.display = 'none';
                }
            }
        } else {
            if(mobCenterAction) mobCenterAction.style.display = 'none';
            if(mobMenuToggle) mobMenuToggle.style.display = 'none';
            if(mobGuestBtns) mobGuestBtns.style.display = 'flex';
        }
    } catch (e) { console.error("Header Error", e); }
}

window.toggleNotifications = async function(e) {
    e.stopPropagation(); 
    const container = document.getElementById('notifications-container');
    const innerBadge = document.getElementById('notif-count-text');
    const outerBadge = document.getElementById('menu-notif-badge');
    
    if (container.style.display === 'block') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        if (innerBadge && innerBadge.style.display !== 'none') {
            innerBadge.style.display = 'none';
            if(outerBadge) outerBadge.style.display = 'none';
            try { await fetch('/api/user/notifications/read', { method: 'POST' }); } catch(e){}
        }
    }
};

async function checkNotifications() {
    try {
        const res = await fetch('/api/user/notifications');
        const data = await res.json();
        
        // عناصر الموبايل
        const mobBadge = document.getElementById('menu-notif-badge');
        const mobInnerBadge = document.getElementById('notif-count-text');
        const mobList = document.getElementById('menu-notif-list');

        // عناصر الديسكتوب (الجديدة)
        const desktopBadge = document.getElementById('desktop-notif-badge');
        const desktopList = document.getElementById('desktop-notif-list');

        // تحديث العدادات (Badges)
        if (data.unreadCount > 0) {
            const countText = data.unreadCount > 9 ? '+9' : data.unreadCount;
            
            // موبايل
            if(mobBadge) { mobBadge.style.display = 'block'; mobBadge.textContent = countText; }
            if(mobInnerBadge) { mobInnerBadge.style.display = 'inline-block'; mobInnerBadge.textContent = `${data.unreadCount} جديدة`; }
            
            // ديسكتوب ✅
            if(desktopBadge) { desktopBadge.style.display = 'block'; desktopBadge.textContent = countText; }
        } else {
            if(mobBadge) mobBadge.style.display = 'none';
            if(mobInnerBadge) mobInnerBadge.style.display = 'none';
            if(desktopBadge) desktopBadge.style.display = 'none';
        }

        // بناء HTML القائمة
       // داخل دالة checkNotifications في home.js
let listHTML = '';
if (data.notifications && data.notifications.length > 0) {
    listHTML = data.notifications.map(n => `
        <div class="menu-notif-item ${n.is_read ? '' : 'unread'}" id="notif-${n.id}">
            <div style="padding-left: 20px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="width:6px; height:6px; background:var(--neon-primary); border-radius:50%; display:${n.is_read ? 'none' : 'block'}"></span>
                    <strong style="color:white; font-size:0.95rem;">${n.title}</strong>
                </div>
                <p style="color:#bbb; font-size:0.85rem; margin:0; line-height:1.5;">${n.message}</p>
                <div style="margin-top:8px; font-size:0.7rem; color:#666; display:flex; align-items:center; gap:5px;">
                    <i class="far fa-clock"></i>
                    ${new Date(n.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                </div>
            </div>
            <button onclick="deleteNotification(event, ${n.id})" class="notif-delete-btn" title="حذف">
                <i class="fas fa-trash-alt" style="font-size:0.8rem;"></i>
            </button>
        </div>
    `).join('');
        } else {
            listHTML = '<p style="text-align:center; color:#555; padding:15px;">لا توجد إشعارات حالياً</p>';
        }

        // وضع المحتوى في القوائم
        if (mobList) mobList.innerHTML = listHTML;
        if (desktopList) desktopList.innerHTML = listHTML; // ✅

    } catch (e) { console.error("Notif Error", e); }
}
window.deleteNotification = async (e, id) => {
    e.stopPropagation();
    if(!confirm('حذف هذا الإشعار؟')) return;
    try {
        const res = await fetch(`/api/user/notification/${id}`, { method: 'DELETE' });
        if(res.ok) {
            const el = document.getElementById(`notif-${id}`);
            if(el) el.remove();
        }
    } catch(e) { alert('خطأ في الحذف'); }
};

window.toggleMobileMenu = async function() {
    const menu = document.getElementById('mobile-profile-dropdown');
    if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
};

window.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-profile-dropdown');
    const isMenuBtn = e.target.closest('.menu-toggle-btn');
    const isMenu = e.target.closest('.mobile-dropdown');
    const isDeleteBtn = e.target.closest('.notif-delete-btn');

    if (menu && menu.style.display === 'block' && !isMenuBtn && !isMenu && !isDeleteBtn) {
        menu.style.display = 'none';
    }
});

// =========================================
// 📱 دوال الهيدر والإشعارات
// =========================================

async function updateNavigation() {
    const nav = document.getElementById('dynamic-nav');
    if(!nav) return;
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            // ✅ للمستخدم المسجل
            nav.innerHTML = `
                <div class="desktop-notif-wrapper">
                    <button class="desktop-notif-btn" onclick="toggleDesktopNotif(event)">
                        <i class="fas fa-bell"></i>
                        <span id="desktop-notif-badge" class="desktop-badge">0</span>
                    </button>
                    <div id="desktop-notif-dropdown" class="desktop-notif-dropdown">
                        // في تحديث Navigation، استبدل الـ Header الخاص بالإشعارات بهذا:
<div class="notif-header">
    <span style="color:white;">التنبيهات</span>
    <span onclick="markAllRead()" class="mark-read-all" style="cursor:pointer;">
        <i class="fas fa-check-double"></i> قراءة الكل
    </span>
</div>
                        <div id="desktop-notif-list">
                            <p style="text-align:center; color:#777; padding:15px;">جاري التحميل...</p>
                        </div>
                    </div>
                </div>

                <a href="all-properties" class="nav-button">جميع العقارات</a>
                <a href="all-properties.html?type=buy" class="nav-button">شراء</a>
                <a href="all-properties.html?type=rent" class="nav-button">ايجار</a>
                <a href="about" class="nav-button">من نحن</a> <a href="user-dashboard" class="nav-button">حسابي</a> 
                <a href="seller-dashboard" class="sell-btn">اعرض عقارك!</a>
            `;
            
            // استدعاء التحقق من الإشعارات فوراً
            checkNotifications(); 
            
        } else {
            // ✅ للزائر (غير مسجل)
            nav.innerHTML = `
                <a href="about" class="nav-button">من نحن</a> <a href="index" class="nav-button">تسجيل دخول</a>
                <a href="index" class="sell-btn">انشاء حساب</a>
            `;
        }
    } catch (error) {
        // حالة الخطأ أو عدم الاتصال
        nav.innerHTML = `
            <a href="about" class="nav-button">من نحن</a>
            <a href="index" class="nav-button">تسجيل دخول</a>
        `;
    }
}
// =========================================
// 👽 Aqarak AI Core Logic (الشات مع إصلاح الموبايل)
// =========================================

function toggleAiChat() {
    const hud = document.getElementById('ai-interface');
    const input = document.getElementById('ai-user-input');
    const orb = document.querySelector('.ai-orb-container');
    const complaintBtn = document.querySelector('.complaint-float-btn');
    
    if (hud.style.display === 'flex') {
        // --- إغلاق الشات ---
        hud.style.display = 'none';
        document.body.classList.remove('chat-open');
        
        if (orb) orb.style.display = 'flex';
        if (complaintBtn) complaintBtn.style.display = 'block';

    } else {
        // --- فتح الشات ---
        hud.style.display = 'flex';
        document.body.classList.add('chat-open'); // كلاس للتحكم في الموبايل
        
        setTimeout(() => input.focus(), 100);

        if (window.innerWidth <= 768) { 
            if (orb) orb.style.display = 'none';
            if (complaintBtn) complaintBtn.style.display = 'none';
        }
    }
}

function handleAiEnter(e) {
    if (e.key === 'Enter') sendAiMessage();
}

async function sendAiMessage() {
    const input = document.getElementById('ai-user-input');
    const consoleDiv = document.getElementById('ai-console');
    const typingIndicator = document.getElementById('ai-typing');
    
    const message = input.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    input.value = '';

    if(typingIndicator) typingIndicator.style.display = 'flex';
    consoleDiv.scrollTop = consoleDiv.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        if(typingIndicator) typingIndicator.style.display = 'none';
        typeWriterResponse(data.reply);

    } catch (error) {
        if(typingIndicator) typingIndicator.style.display = 'none';
        appendMessage("⚠️ فقدنا الاتصال بالقاعدة الأم (خطأ في السيرفر).", 'bot');
    }
}

function appendMessage(text, sender) {
    const consoleDiv = document.getElementById('ai-console');
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${sender}`;
    
    if (sender === 'bot') {
        div.innerHTML = `
            <div class="ai-avatar"><img src="logo.png" alt="AI"></div>
            <div class="ai-text">${text}</div>
        `;
    } else {
        div.innerHTML = `
            <div class="ai-text">${text}</div>
        `;
    }
    
    consoleDiv.appendChild(div);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function typeWriterResponse(text) {
    const consoleDiv = document.getElementById('ai-console');
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-bot';
    
    div.innerHTML = `
        <div class="ai-avatar"><img src="logo.png" alt="AI"></div>
        <div class="ai-text"></div>
    `;
    consoleDiv.appendChild(div);
    
    const textElement = div.querySelector('.ai-text');
    let i = 0;
    const speed = 10;

    function type() {
        if (i < text.length) {
            if(text.charAt(i) === '<') {
                const endTag = text.indexOf('>', i);
                textElement.innerHTML += text.substring(i, endTag + 1);
                i = endTag + 1;
            } else {
                textElement.innerHTML += text.charAt(i);
                i++;
            }
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
            setTimeout(type, speed);
        }
    }
    type();
}

// =========================================
// 🎙️ 5. نظام التعرف الصوتي (Voice Input)
// =========================================

let recognition;
let isListening = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG'; 
    recognition.continuous = false; 
    recognition.interimResults = true; 

    recognition.onstart = function() {
        isListening = true;
        const btn = document.getElementById('ai-mic-btn');
        if(btn) btn.classList.add('ai-mic-active');
        document.getElementById('ai-user-input').placeholder = "جاري الاستماع... 🎧";
    };

    recognition.onend = function() {
        isListening = false;
        const btn = document.getElementById('ai-mic-btn');
        if(btn) btn.classList.remove('ai-mic-active');
        document.getElementById('ai-user-input').placeholder = "اكتب استفسارك هنا...";
    };

    recognition.onresult = function(event) {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        const input = document.getElementById('ai-user-input');
        input.value = transcript;
    };
    
    recognition.onerror = function(event) {
        console.error("Voice Error:", event.error);
        isListening = false;
        const btn = document.getElementById('ai-mic-btn');
        if(btn) btn.classList.remove('ai-mic-active');
    };
}

function toggleVoiceInput() {
    if (!recognition) {
        alert("عذراً، متصفحك لا يدعم الكتابة الصوتية.");
        return;
    }
    if (isListening) recognition.stop();
    else recognition.start();
}
// ✅ دالة فتح وإغلاق إشعارات الديسكتوب
window.toggleDesktopNotif = async function(e) {
    e.stopPropagation(); // منع إغلاق القائمة فوراً عند الضغط
    const dropdown = document.getElementById('desktop-notif-dropdown');
    const badge = document.getElementById('desktop-notif-badge');
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
        
        // عند الفتح، نعتبر الإشعارات مقروءة (اختياري)
        if (badge && badge.style.display !== 'none') {
            badge.style.display = 'none';
            try { await fetch('/api/user/notifications/read', { method: 'POST' }); } catch(e){}
        }
    }
};

// ✅ دالة تحديد الكل كمقروء (اختياري)
window.markAllRead = async function() {
    try { 
        await fetch('/api/user/notifications/read', { method: 'POST' }); 
        const badges = document.querySelectorAll('#desktop-notif-badge, #menu-notif-badge, #notif-count-text');
        badges.forEach(b => b.style.display = 'none');
        // إزالة ستايل "غير مقروء" من العناصر
        document.querySelectorAll('.menu-notif-item.unread').forEach(el => el.classList.remove('unread'));
    } catch(e){}
};

// ✅ إغلاق القائمة عند الضغط في أي مكان خارجها
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('desktop-notif-dropdown');
    const btn = e.target.closest('.desktop-notif-btn');
    const isInsideDropdown = e.target.closest('.desktop-notif-dropdown');

    // إذا ضغط المستخدم خارج الزر وخارج القائمة، أغلق القائمة
    if (dropdown && dropdown.style.display === 'block' && !btn && !isInsideDropdown) {
        dropdown.style.display = 'none';
    }
});