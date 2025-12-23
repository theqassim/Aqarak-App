let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true); // تحميل أولي
    updateNavigation();
});

// ✅ دالة ضبط الهيدر
async function updateNavigation() {
    const nav = document.getElementById('dynamic-nav');
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            nav.innerHTML = `
                <a href="all-properties" class="nav-button">جميع العقارات</a>
                <a href="all-properties.html?type=buy" class="nav-button">شراء</a>
                <a href="all-properties.html?type=rent" class="nav-button">ايجار</a>
                <a href="user-dashboard" class="nav-button">القائمة</a> 
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

// ✅ دالة جلب العقارات (المحدثة للتميز)
async function fetchLatestProperties(isFirstLoad = false) {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('listings-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (isFirstLoad) {
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
        
        if (isFirstLoad) container.innerHTML = '';

        if (isFirstLoad && properties.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">لا يوجد عقارات حالياً.</p>';
            isLoading = false;
            return;
        }

        properties.forEach(prop => {
            const bgImage = prop.imageUrl || 'logo.png';
            let priceText = prop.price;
            if(window.formatPrice) priceText = window.formatPrice(prop.price, prop.type);
            else priceText = parseInt(prop.price || 0).toLocaleString();

            const isSale = (prop.type === 'بيع' || prop.type === 'buy');
            const typeClass = isSale ? 'is-sale' : 'is-rent';
            const typeText = isSale ? 'للبيع' : 'للإيجار';

            // المميزات الداخلية
            const roomsHtml = prop.rooms ? `<span class="adv-feat-item"><i class="fas fa-bed"></i> ${prop.rooms}</span>` : '';
            const bathsHtml = prop.bathrooms ? `<span class="adv-feat-item"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : '';
            const areaHtml = prop.area ? `<span class="adv-feat-item"><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>` : '';

            // 🔥 1. تحديد كلاس التميز (للإطار الذهبي)
            const featuredClass = prop.isFeatured ? 'featured-card-glow' : '';

            // 🔥 2. بادج التاج الذهبي
            let extraBadges = '';
            if (prop.isFeatured) {
                extraBadges = `<div class="featured-crown"><i class="fas fa-crown"></i> مميز</div>`;
            }

            const html = `
                <div class="adv-card ${featuredClass}" onclick="window.location.href='property-details?id=${prop.id}'" style="cursor: pointer;">
                    
                    <div class="adv-card-img-box">
                        <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                        <span class="adv-type-badge ${typeClass}">${typeText}</span>
                        <div class="adv-price-tag">${priceText}</div>
                        ${extraBadges} </div>

                    <div class="adv-card-body">
                        <h3 class="adv-title" title="${prop.title}">${prop.title}</h3>
                        
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
            container.innerHTML += html;
        });

        currentOffset += properties.length;

        // زر عرض المزيد
        if (!document.getElementById('load-more-container')) {
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
        if(isFirstLoad) container.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ في التحميل.</p>';
    } finally {
        isLoading = false;
    }
}