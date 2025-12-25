let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true);
    updateNavigation();
    updateMobileHeader();
    checkNotifications();
    
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
// 📱 1. دوال هيدر الموبايل
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

// ✅ دالة فتح/غلق قائمة الإشعارات
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
        
        const badge = document.getElementById('menu-notif-badge');
        const innerBadge = document.getElementById('notif-count-text');
        const list = document.getElementById('menu-notif-list');

        if (data.unreadCount > 0) {
            if(badge) {
                badge.style.display = 'block';
                badge.textContent = data.unreadCount > 9 ? '+9' : data.unreadCount;
            }
            if(innerBadge) {
                innerBadge.style.display = 'inline-block';
                innerBadge.textContent = `${data.unreadCount} جديدة`;
            }
        } else {
            if(badge) badge.style.display = 'none';
            if(innerBadge) innerBadge.style.display = 'none';
        }

        if (list && data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `
                <div class="menu-notif-item ${n.is_read ? '' : 'unread'}" id="notif-${n.id}">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-left:25px;">
                        <strong style="color:white; font-size:0.9rem;">${n.title}</strong>
                        <button onclick="deleteNotification(event, ${n.id})" class="notif-delete-btn" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <p style="color:#aaa; font-size:0.8rem; margin:0; line-height:1.4;">${n.message}</p>
                    <span style="font-size:0.65rem; color:#666; display:block; margin-top:5px;">${new Date(n.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
            `).join('');
        }
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

async function updateNavigation() {
    const nav = document.getElementById('dynamic-nav');
    if(!nav) return;
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            nav.innerHTML = `
                <a href="all-properties" class="nav-button">جميع العقارات</a>
                <a href="all-properties.html?type=buy" class="nav-button">شراء</a>
                <a href="all-properties.html?type=rent" class="nav-button">ايجار</a>
                <a href="user-dashboard" class="nav-button">حسابي</a> 
                <a href="seller-dashboard" class="sell-btn">اعرض عقارك!</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="index" class="nav-button">تسجيل دخول</a>
                <a href="index" class="sell-btn">انشاء حساب</a>
            `;
        }
    } catch (error) {
        nav.innerHTML = `<a href="index" class="nav-button">تسجيل دخول</a>`;
    }
}

async function fetchLatestProperties(isFirstLoad = false) {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('listings-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (isFirstLoad && container) {
        currentOffset = 0;
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--neon-primary); padding: 50px;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';
        if(loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
        if(loadMoreBtn) loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
    }

    try {
        const response = await fetch(`/api/properties?limit=${LIMIT}&offset=${currentOffset}`);
        const properties = await response.json();
        
        if (isFirstLoad && container) container.innerHTML = '';

        if (isFirstLoad && properties.length === 0 && container) {
            container.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">لا يوجد عقارات حالياً.</p>';
            isLoading = false;
            return;
        }

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

        if (!document.getElementById('load-more-container') && container) {
            const btnContainer = document.createElement('div');
            btnContainer.id = 'load-more-container';
            btnContainer.style.gridColumn = "1 / -1";
            btnContainer.style.textAlign = 'center';
            btnContainer.style.marginTop = '20px';
            btnContainer.innerHTML = `<button id="load-more-btn" class="load-more-btn">عرض المزيد من العقارات <i class="fas fa-arrow-down"></i></button>`;
            container.parentNode.appendChild(btnContainer);
            document.getElementById('load-more-btn').addEventListener('click', () => fetchLatestProperties(false));
        }

        const btn = document.getElementById('load-more-btn');
        if (btn) {
            if (properties.length < LIMIT) btn.style.display = 'none';
            else {
                btn.style.display = 'block';
                btn.innerHTML = 'عرض المزيد من العقارات <i class="fas fa-arrow-down"></i>';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        if(isFirstLoad && container) container.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ في التحميل.</p>';
    } finally {
        isLoading = false;
    }
}

// =========================================
// 👽 Aqarak AI Core Logic
// =========================================

function toggleAiChat() {
    const hud = document.getElementById('ai-interface');
    const input = document.getElementById('ai-user-input');
    const orb = document.querySelector('.ai-orb-container'); 
    const complaintBtn = document.querySelector('.complaint-float-btn'); 
    
    if (hud.style.display === 'flex') {
        hud.style.display = 'none';
        if (orb) orb.style.display = 'flex';
        if (complaintBtn) complaintBtn.style.display = 'block';
    } else {
        hud.style.display = 'flex';
        setTimeout(() => input.focus(), 100);

        // إخفاء الأزرار في الموبايل
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