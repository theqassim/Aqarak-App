let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true); // تحميل أولي
    updateNavigation(); // الهيدر القديم
    updateMobileHeader(); // ✅ الهيدر الجديد للموبايل
});

// ✅ دالة ضبط هيدر الموبايل الجديد
// ✅ دالة ضبط هيدر الموبايل (المعدلة)
// ✅ دالة ضبط هيدر الموبايل (نظام الضيف والمستخدم)
async function updateMobileHeader() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        const mobCenterAction = document.getElementById('mob-center-action');
        const mobMenuToggle = document.getElementById('mob-menu-toggle');
        const mobGuestBtns = document.getElementById('mob-guest-btns');

        if (data.isAuthenticated) {
            // 🟢 مستخدم مسجل: أظهر زر الإضافة والقائمة
            if(mobCenterAction) mobCenterAction.style.display = 'block';
            if(mobMenuToggle) mobMenuToggle.style.display = 'flex';
            if(mobGuestBtns) mobGuestBtns.style.display = 'none';

            // تعبئة بيانات القائمة
            const mobName = document.getElementById('mob-user-name');
            const mobBalance = document.getElementById('mob-user-balance');
            
            if(mobName) mobName.textContent = data.name || 'مستخدم عقارك';
            if(mobBalance && data.isPaymentActive) {
                mobBalance.textContent = `${data.balance || 0} نقطة`;
                mobBalance.style.display = 'block';
            }
        } else {
            // 🔴 زائر: أظهر زرارين الدخول والتسجيل فقط
            if(mobCenterAction) mobCenterAction.style.display = 'none';
            if(mobMenuToggle) mobMenuToggle.style.display = 'none';
            if(mobGuestBtns) mobGuestBtns.style.display = 'flex';
        }
    } catch (e) { console.error("Mobile Header Error:", e); }
}
// ✅ دوال القائمة المنسدلة (Global)
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-profile-dropdown');
    if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
};

window.logoutUser = async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (e) { window.location.reload(); }
};

// إغلاق القائمة عند الضغط خارجها
window.addEventListener('click', function(e) {
    const container = document.querySelector('.mobile-profile-container');
    const menu = document.getElementById('mobile-profile-dropdown');
    if (container && menu && !container.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// ✅ دالة ضبط الهيدر (القديمة للديسكتوب)
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

// ✅ دالة جلب العقارات
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

            const roomsHtml = prop.rooms ? `<span class="adv-feat-item"><i class="fas fa-bed"></i> ${prop.rooms}</span>` : '';
            const bathsHtml = prop.bathrooms ? `<span class="adv-feat-item"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : '';
            const areaHtml = prop.area ? `<span class="adv-feat-item"><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>` : '';

            const featuredClass = prop.isFeatured ? 'featured-card-glow' : '';
            let extraBadges = prop.isFeatured ? `<div class="featured-crown"><i class="fas fa-crown"></i> مميز</div>` : '';

            const html = `
                <div class="adv-card ${featuredClass}" onclick="window.location.href='property-details?id=${prop.id}'" style="cursor: pointer;">
                    <div class="adv-card-img-box">
                        <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                        <span class="adv-type-badge ${typeClass}">${typeText}</span>
                        <div class="adv-price-tag">${priceText}</div>
                        ${extraBadges} 
                    </div>
                    <div class="adv-card-body">
                        <h3 class="adv-title" title="${prop.title}">${prop.title}</h3>
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