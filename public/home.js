let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true); // تحميل العقارات
    updateNavigation(); // الهيدر القديم (Desktop)
    updateMobileHeader(); // ✅ الهيدر الجديد (Mobile)
    checkNotifications(); // ✅ تشغيل نظام الإشعارات والعداد
});

// =========================================
// 📱 1. دوال هيدر الموبايل والإشعارات والتوثيق
// =========================================

async function updateMobileHeader() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // عناصر الهيدر
        const mobCenterAction = document.getElementById('mob-center-action');
        const mobMenuToggle = document.getElementById('mob-menu-toggle');
        const mobGuestBtns = document.getElementById('mob-guest-btns');
        
        // عناصر القائمة المنسدلة
        const mobName = document.getElementById('mob-user-name');
        const mobBalance = document.getElementById('mob-user-balance');
        // (اختياري) لو عندك صورة في القائمة القديمة
        const profileImg = document.querySelector('.mobile-profile-img');

        if (data.isAuthenticated) {
            // 🟢 مستخدم مسجل: أظهر زر الإضافة والقائمة
            if(mobCenterAction) mobCenterAction.style.display = 'block';
            if(mobMenuToggle) mobMenuToggle.style.display = 'flex';
            if(mobGuestBtns) mobGuestBtns.style.display = 'none';

            // ✅ تصميم علامة التوثيق الذهبية (Facebook Style)
            const verifiedBadge = data.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; border:1px solid white; margin-right:5px; box-shadow:0 0 8px rgba(255, 215, 0, 0.6); vertical-align:middle;"></i>` : '';
            
            // تحديث الاسم بالعلامة
            if(mobName) mobName.innerHTML = `${data.name || 'مستخدم'} ${verifiedBadge}`;
            
            // تحديث الرصيد
            if(mobBalance) {
                if(data.isPaymentActive) {
                    mobBalance.textContent = `${data.balance || 0} نقطة`;
                    mobBalance.style.display = 'block';
                } else {
                    mobBalance.style.display = 'none';
                }
            }

            // تحديث الصورة لو موجودة
            if(profileImg) profileImg.src = data.profile_picture || 'logo.png';

        } else {
            // 🔴 زائر: أظهر أزرار الدخول والتسجيل فقط
            if(mobCenterAction) mobCenterAction.style.display = 'none';
            if(mobMenuToggle) mobMenuToggle.style.display = 'none';
            if(mobGuestBtns) mobGuestBtns.style.display = 'flex';
        }
    } catch (e) { console.error("Header Error", e); }
}

// ✅ دالة جلب الإشعارات وتحديث العداد
async function checkNotifications() {
    try {
        const res = await fetch('/api/user/notifications');
        const data = await res.json();
        
        const badge = document.getElementById('menu-notif-badge');
        const list = document.getElementById('menu-notif-list');
        const countText = document.getElementById('notif-count-text');

        // تحديث العداد الأحمر على أيقونة القائمة
        if (data.unreadCount > 0) {
            if(badge) {
                badge.style.display = 'block';
                badge.textContent = data.unreadCount > 9 ? '+9' : data.unreadCount;
            }
            if(countText) countText.textContent = `${data.unreadCount} جديدة`;
        } else {
            if(badge) badge.style.display = 'none';
            if(countText) countText.textContent = '';
        }

        // تعبئة قائمة الإشعارات
        if (list && data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `
                <div style="padding:10px; border-bottom:1px solid #333; background:${n.is_read ? 'transparent' : 'rgba(0, 255, 136, 0.05)'}; transition:0.3s;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <strong style="color:white; font-size:0.9rem;">${n.title}</strong>
                        <span style="font-size:0.7rem; color:#777;">${new Date(n.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p style="color:#aaa; font-size:0.85rem; margin:0; line-height:1.4;">${n.message}</p>
                </div>
            `).join('');
        }
    } catch (e) { console.error("Notif Error", e); }
}

// ✅ دالة فتح القائمة (وتصفير الإشعارات عند الفتح)
window.toggleMobileMenu = async function() {
    const menu = document.getElementById('mobile-profile-dropdown');
    const badge = document.getElementById('menu-notif-badge');
    const countText = document.getElementById('notif-count-text');
    
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
        
        // عند الفتح: تصفير العداد وقراءة الإشعارات
        if (badge && badge.style.display !== 'none') {
            badge.style.display = 'none'; // إخفاء النقطة الحمراء
            if(countText) countText.textContent = '';
            
            // إبلاغ السيرفر بأن الإشعارات تمت قراءتها
            try { await fetch('/api/user/notifications/read', { method: 'POST' }); } catch(e){}
        }
    }
};

window.logoutUser = async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (e) { window.location.reload(); }
};

// إغلاق القائمة عند الضغط خارجها
window.addEventListener('click', function(e) {
    const header = document.querySelector('.mobile-header-custom');
    const menu = document.getElementById('mobile-profile-dropdown');
    
    // لو الضغط تم خارج الهيدر وخارج القائمة
    if (header && menu && !header.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// =========================================
// 🖥️ 2. دوال الهيدر القديم (Desktop)
// =========================================

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
        console.error('Navigation Error:', error);
        nav.innerHTML = `<a href="index" class="nav-button">تسجيل دخول</a>`;
    }
}

// =========================================
// 🏠 3. دالة جلب العقارات (الرئيسية)
// =========================================

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
        if (!response.ok) throw new Error('Network response was not ok');
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

            // المميزات
            const roomsHtml = prop.rooms ? `<span class="adv-feat-item"><i class="fas fa-bed"></i> ${prop.rooms}</span>` : '';
            const bathsHtml = prop.bathrooms ? `<span class="adv-feat-item"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : '';
            const areaHtml = prop.area ? `<span class="adv-feat-item"><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>` : '';

            // 🔥 1. التميز (تاج ذهبي + إطار)
            const featuredClass = prop.isFeatured ? 'featured-card-glow' : '';
            let extraBadges = prop.isFeatured ? `<div class="featured-crown"><i class="fas fa-crown"></i> مميز</div>` : '';

            // ✅ 2. التوثيق (علامة ذهبية بجانب اسم العقار)
            // (لاحظ: لازم السيرفر يرجع is_verified في الـ query)
            const verifiedBadge = prop.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-left:5px; vertical-align:middle; box-shadow:0 0 5px rgba(255, 215, 0, 0.5);" title="بائع موثق"></i>` : '';

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
                        
                        <div class="adv-features">
                            ${roomsHtml}
                            ${bathsHtml}
                            ${areaHtml}
                        </div>

                        <a href="property-details?id=${prop.id}" class="adv-details-btn">
                            عرض التفاصيل <i class="fas fa-arrow-left"></i>
                        </a>
                    </div>
                </div>
            `;
            if(container) container.innerHTML += html;
        });

        currentOffset += properties.length;

        // زر عرض المزيد
        if (!document.getElementById('load-more-container') && container) {
            const btnContainer = document.createElement('div');
            btnContainer.id = 'load-more-container';
            btnContainer.style.gridColumn = "1 / -1";
            btnContainer.style.textAlign = 'center';
            btnContainer.innerHTML = `<button id="load-more-btn" class="load-more-btn">عرض المزيد من العقارات</button>`;
            container.parentNode.appendChild(btnContainer);
            document.getElementById('load-more-btn').addEventListener('click', () => fetchLatestProperties(false));
        }

        const btn = document.getElementById('load-more-btn');
        if (btn) {
            if (properties.length < LIMIT) btn.style.display = 'none';
            else {
                btn.style.display = 'inline-block';
                btn.innerHTML = 'عرض المزيد من العقارات';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        if(isFirstLoad && container) container.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ في التحميل.</p>';
    } finally {
        isLoading = false;
    }
}