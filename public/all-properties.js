document.addEventListener('DOMContentLoaded', () => {
    
    // 1. التحقق: هل يوجد بحث قادم من الصفحة الرئيسية؟
    const urlParams = new URLSearchParams(window.location.search);
    const incomingKeyword = urlParams.get('keyword');

    if (incomingKeyword) {
        // لو فيه كلمة بحث، حطها في الفلتر وطبق البحث فوراً
        const keywordInput = document.getElementById('filter-keyword');
        if (keywordInput) {
            keywordInput.value = incomingKeyword; // وضع الكلمة في الخانة
            
            // فتح قائمة الفلتر عشان المستخدم يشوف هو بحث عن إيه (اختياري)
            const filterBody = document.getElementById('filter-body');
            const filterContainer = document.querySelector('.filter-container');
            if(filterBody) filterBody.style.display = 'block';
            if(filterContainer) filterContainer.classList.add('active');
        }
        
        // تشغيل البحث بالكلمة دي
        fetchProperties(`keyword=${encodeURIComponent(incomingKeyword)}`);
    } else {
        // لو مفيش بحث، هات كل العقارات عادي
        fetchProperties();
    }

    // تشغيل زر الفلتر (كما هو)
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            applyFilter();
        });
    }
});

// باقي الكود (fetchProperties, applyFilter, renderProperties) زي ما هو بالظبط...
// (تأكد إنك ناسخ باقي الدوال اللي بعتهالك قبل كده هنا)

async function fetchProperties(queryParams = '') {
    const container = document.querySelector('.properties-grid');
    if (container) container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';

    try {
        const url = `/api/properties${queryParams ? '?' + queryParams : ''}`;
        const response = await fetch(url);
        const properties = await response.json();
        renderProperties(properties);
    } catch (error) {
        console.error(error);
        if (container) container.innerHTML = '<p class="empty-message error">حدث خطأ.</p>';
    }
}

function applyFilter() {
    const keyword = document.getElementById('filter-keyword').value;
    const type = document.getElementById('filter-type').value;
    const rooms = document.getElementById('filter-rooms').value;
    const minPrice = document.getElementById('filter-price-min').value;
    const maxPrice = document.getElementById('filter-price-max').value;

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (type) params.append('type', type);
    if (rooms) params.append('rooms', rooms);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    fetchProperties(params.toString());

    // إغلاق القائمة
    const filterBody = document.getElementById('filter-body');
    const filterContainer = document.querySelector('.filter-container');
    if (filterBody) {
        filterBody.style.display = 'none';
        if(filterContainer) filterContainer.classList.remove('active');
    }
}

function renderProperties(properties) {
    const container = document.querySelector('.properties-grid');
    if (!container) return;
    container.innerHTML = '';

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3>لا توجد عقارات مطابقة</h3>
                <p>جرب كلمات بحث أخرى.</p>
            </div>
        `;
        return;
    }

    properties.forEach(property => {
        const formattedPrice = property.price ? parseInt(property.price).toLocaleString() : '0';
        
        // تحديد نوع التاج (بيع/إيجار)
        const typeTag = property.type === 'rent' || property.type === 'إيجار' 
            ? '<span style="color: #ffc107;">(للإيجار)</span>' 
            : '<span style="color: #28a745;">(للبيع)</span>';
            
        const detailsUrl = `property-details.html?id=${property.id}`;

        // ✅✅✅ 1. تجهيز الشارات (الجزء الجديد) ✅✅✅
        let badgesHTML = '<div class="card-badges-container">';
        
        // شارة مميز
        if (property.isFeatured) {
            badgesHTML += `<span class="badge-card badge-featured-small"><i class="fas fa-star"></i> مميز</span>`;
        }
        
        // شارة قانوني
        if (property.isLegal) {
            badgesHTML += `<span class="badge-card badge-legal-small"><i class="fas fa-shield-alt"></i> قانوني</span>`;
        }
        
        badgesHTML += '</div>';
        // ✅✅✅ نهاية الجزء الجديد ✅✅✅

        const cardHTML = `
            <div class="property-card neon-glow" onclick="window.location.href='${detailsUrl}'" style="cursor: pointer; position: relative;">
                
                ${badgesHTML}
                
                <img src="${property.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${property.title}">
                
                <div class="card-content">
                    <h3>${property.title} ${typeTag}</h3>
                    <p class="price">${formattedPrice} ج.م</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">
                        <i class="fas fa-bed"></i> ${property.rooms} غرف | 
                        <i class="fas fa-bath"></i> ${property.bathrooms} حمام | 
                        <i class="fas fa-ruler-combined"></i> ${property.area} م²
                    </p>
                    <a href="${detailsUrl}" class="btn-details-pro" onclick="event.stopPropagation()">
                        عرض التفاصيل <i class="fas fa-arrow-left" style="margin-right: 5px;"></i>
                    </a>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}