let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true);
    updateNavigation();
    updateMobileHeader();
    checkNotifications();
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

// ✅ دالة جلب الإشعارات (مع زر الحذف)
async function checkNotifications() {
    try {
        const res = await fetch('/api/user/notifications');
        const data = await res.json();
        
        const badge = document.getElementById('menu-notif-badge');
        const list = document.getElementById('menu-notif-list');
        const countText = document.getElementById('notif-count-text');

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

        if (list && data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `
                <div class="menu-notif-item ${n.is_read ? '' : 'unread'}" id="notif-${n.id}">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-left:25px;">
                        <strong style="color:white; font-size:0.9rem;">${n.title}</strong>
                        <button onclick="deleteNotification(${n.id})" class="notif-delete-btn" title="حذف">
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

// ✅ دالة حذف الإشعار
window.deleteNotification = async (id) => {
    if(!confirm('حذف هذا الإشعار؟')) return;
    try {
        const res = await fetch(`/api/user/notification/${id}`, { method: 'DELETE' });
        if(res.ok) {
            const el = document.getElementById(`notif-${id}`);
            if(el) el.remove();
            // تحديث العداد بسيط (أو ممكن تعيد طلب checkNotifications)
            const countText = document.getElementById('notif-count-text');
            if(countText) countText.innerHTML = '<i class="fas fa-sync fa-spin"></i>'; 
            checkNotifications(); 
        }
    } catch(e) { alert('خطأ في الحذف'); }
};

window.toggleMobileMenu = async function() {
    const menu = document.getElementById('mobile-profile-dropdown');
    const badge = document.getElementById('menu-notif-badge');
    const countText = document.getElementById('notif-count-text');
    
    if (menu) {
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
            if (badge && badge.style.display !== 'none') {
                badge.style.display = 'none'; 
                if(countText) countText.textContent = '';
                try { await fetch('/api/user/notifications/read', { method: 'POST' }); } catch(e){}
            }
        }
    }
};

window.logoutUser = async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (e) { window.location.reload(); }
};

window.addEventListener('click', function(e) {
    const header = document.querySelector('.mobile-header-custom');
    const menu = document.getElementById('mobile-profile-dropdown');
    const isMenuBtn = e.target.closest('.menu-toggle-btn');
    const isMenu = e.target.closest('.mobile-dropdown');
    const isDeleteBtn = e.target.closest('.notif-delete-btn'); // عشان لو داس حذف ميعتبرش كليك خارج القائمة

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
        console.error('Navigation Error:', error);
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
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-left:5px; vertical-align:middle;" title="بائع موثق"></i>` : '';

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

        // ✅ تحسين مكان زر عرض المزيد
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