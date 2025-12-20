let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(true); // true تعني أول تحميل
    updateNavigation();
});

// ✅ دالة ضبط الهيدر (كما هي)
async function updateNavigation() {
    const nav = document.getElementById('dynamic-nav');
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            nav.innerHTML = `
                <a href="all-properties" class="nav-button neon-button-white">جميع العقارات</a>
                <a href="buy" class="nav-button neon-button-white">شراء</a>
                <a href="rent" class="nav-button neon-button-white">ايجار</a>
                <a href="user-dashboard" class="nav-button neon-button-white">القائمة</a> 
                <a href="seller-dashboard" class="sell-btn">اعرض عقار للبيع!</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="index" class="nav-button neon-button-white">تسجيل دخول</a>
                <a href="index" class="sell-btn" style="background: transparent; border: 1px solid #00ff88; color: #00ff88;">انشاء حساب</a>
            `;
        }
    } catch (error) {
        console.error('Navigation Error:', error);
        nav.innerHTML = `<a href="index" class="nav-button neon-button-white">تسجيل دخول</a>`;
    }
}

// ✅ دالة جلب العقارات (المحدثة مع عرض المزيد)
async function fetchLatestProperties(isFirstLoad = false) {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('listings-container');
    const loadMoreBtn = document.getElementById('load-more-btn'); // الزرار اللي هنضيفه

    if (isFirstLoad) {
        currentOffset = 0;
        container.innerHTML = '<p class="empty-message" id="loading-msg">جاري تحميل العقارات...</p>';
        if(loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
        if(loadMoreBtn) loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
    }

    try {
        // نبعت الـ offset والـ limit للسيرفر
        const response = await fetch(`/api/properties?limit=${LIMIT}&offset=${currentOffset}`);

        if (!response.ok) throw new Error('Network response was not ok');

        const properties = await response.json();
        
        // لو أول مرة، نشيل رسالة التحميل
        if (isFirstLoad) {
            const loadingMsg = document.getElementById('loading-msg');
            if(loadingMsg) loadingMsg.remove();
        }

        if (isFirstLoad && properties.length === 0) {
            container.innerHTML = '<p class="empty-message">لا يوجد عقارات في الوقت الحالي</p>';
            isLoading = false;
            return;
        }

        // رسم العقارات
        properties.forEach(property => {
            const formattedPrice = window.formatPrice ? window.formatPrice(property.price, property.type) : property.price;

            const typeTag = (property.type === 'buy' || property.type === 'بيع') 
                ? '<span class="property-type sale">بيع</span>' 
                : '<span class="property-type rent">إيجار</span>';

            let badgesHTML = '<div class="badge-container">';
            if (property.isFeatured) {
                badgesHTML += `<div class="badge badge-featured"><i class="fas fa-star"></i> مميز</div>`;
            }
            if (property.isLegal) {
                badgesHTML += `<div class="badge badge-legal"><i class="fas fa-shield-alt"></i> قانوني</div>`;
            }
            badgesHTML += '</div>';

            const detailsUrl = `property-details?id=${property.id}`;

            const cardHTML = `
                <div class="property-card neon-glow" onclick="window.location.href='${detailsUrl}'">
                    ${badgesHTML}
                    <img src="${property.imageUrl || 'logo.png'}" alt="${property.title}" loading="lazy">
                    <div class="card-content">
                        <h3>${property.title} ${typeTag}</h3>
                        <p class="price">${formattedPrice}</p>
                        <p style="color: var(--text-secondary); margin: 10px 0; font-size: 0.9rem;">
                            <i class="fas fa-bed"></i> ${property.rooms} غرف | 
                            <i class="fas fa-bath"></i> ${property.bathrooms} حمام | 
                            <i class="fas fa-ruler-combined"></i> ${property.area} م²
                        </p>
                        <a href="${detailsUrl}" class="btn-details-pro view-details-btn" onclick="event.stopPropagation()">
                            عرض التفاصيل <i class="fas fa-arrow-left" style="margin-right: 5px;"></i>
                        </a>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

        // تحديث العداد
        currentOffset += properties.length;

        // التحكم في زرار عرض المزيد
        if (!document.getElementById('load-more-container')) {
            const btnContainer = document.createElement('div');
            btnContainer.id = 'load-more-container';
            btnContainer.style.textAlign = 'center';
            btnContainer.style.marginTop = '30px';
            btnContainer.style.width = '100%';
            btnContainer.innerHTML = `<button id="load-more-btn" class="btn-neon-auth" style="padding: 10px 30px;">عرض المزيد من العقارات</button>`;
            container.parentNode.appendChild(btnContainer);
            
            document.getElementById('load-more-btn').addEventListener('click', () => fetchLatestProperties(false));
        }

        const btn = document.getElementById('load-more-btn');
        if (properties.length < LIMIT) {
            // لو اللي راجع أقل من الليمت، يبقى مفيش تاني
            if(btn) btn.style.display = 'none';
        } else {
            if(btn) {
                btn.style.display = 'inline-block';
                btn.innerHTML = 'عرض المزيد من العقارات';
            }
        }

    } catch (error) {
        console.error('Error fetching properties:', error);
        if(isFirstLoad) container.innerHTML = '<p class="empty-message">حدث خطأ أثناء تحميل العقارات.</p>';
    } finally {
        isLoading = false;
    }
}