document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties(); // الدالة القديمة لجلب العقارات
    updateNavigation();      // الدالة الجديدة لضبط الهيدر
});

// ✅ دالة ضبط الهيدر بناءً على حالة المستخدم
async function updateNavigation() {
    const nav = document.getElementById('dynamic-nav');
    
    try {
        // نكلم السيرفر نشوف مين اللي فاتح
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            // 🟢 سيناريو 1: المستخدم مسجل دخول
            nav.innerHTML = `
                <a href="all-properties" class="nav-button neon-button-white">جميع العقارات</a>
                <a href="buy" class="nav-button neon-button-white">شراء</a>
                <a href="rent" class="nav-button neon-button-white">ايجار</a>
                <a href="user-dashboard" class="nav-button neon-button-white">القائمة</a> 
                <a href="seller-dashboard" class="sell-btn">اعرض عقار للبيع!</a>
            `;
        } else {
            // 🔴 سيناريو 2: زائر (Guest)
            // الزرارين بيودوا على صفحة login لأنها فيها التبويبين
            nav.innerHTML = `
                <a href="login" class="nav-button neon-button-white">تسجيل دخول</a>
                <a href="login" class="sell-btn" style="background: transparent; border: 1px solid #00ff88; color: #00ff88;">انشاء حساب</a>
            `;
        }

    } catch (error) {
        console.error('Navigation Error:', error);
        // في حالة الخطأ، نعرض أزرار الزائر كاحتياط
        nav.innerHTML = `<a href="login" class="nav-button neon-button-white">تسجيل دخول</a>`;
    }
}

// ... باقي كود جلب العقارات القديم زي ما هو ...
async function fetchLatestProperties() {
    const container = document.getElementById('listings-container');
    container.innerHTML = '<p class="empty-message">جاري تحميل العقارات...</p>';

    try {
        const response = await fetch('/api/properties?limit=6');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const properties = await response.json();

        container.innerHTML = '';

        if (properties.length === 0) {
            container.innerHTML = '<p class="empty-message">لا يوجد عقارات في الوقت الحالي</p>';
            return;
        }

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
                    
                    <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=Aqarak'}" alt="${property.title}">
                    
                    <div class="card-content">
                        <h3>${property.title} ${typeTag}</h3>
                        <p class="price">${formattedPrice}</p>
                        
                        <p style="color: var(--text-secondary); margin: 10px 0;">
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
            container.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = '<p class="empty-message">حدث خطأ أثناء تحميل العقارات. برجاء المحاولة لاحقاً.</p>';
    }
}
