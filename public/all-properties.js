document.addEventListener('DOMContentLoaded', () => {
    // تحميل جميع العقارات عند فتح الصفحة
    fetchProperties();

    // تشغيل زر الفلتر
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault(); // منع إعادة تحميل الصفحة
            applyFilter();
        });
    }
});

// دالة جلب العقارات (مع أو بدون فلتر)
async function fetchProperties(queryParams = '') {
    const container = document.querySelector('.properties-grid'); // تأكد أن هذا الكلاس موجود في الـ HTML للحاوية
    
    // عرض رسالة تحميل
    if (container) {
        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';
    }

    try {
        // بناء الرابط
        const url = `/api/properties${queryParams ? '?' + queryParams : ''}`;
        
        const response = await fetch(url);
        const properties = await response.json();

        renderProperties(properties);

    } catch (error) {
        console.error('Error fetching properties:', error);
        if (container) {
            container.innerHTML = '<p class="empty-message error">حدث خطأ أثناء تحميل العقارات. حاول مرة أخرى.</p>';
        }
    }
}

// دالة تطبيق الفلتر (قراءة البيانات من الفورم الجديد)
function applyFilter() {
    const keyword = document.getElementById('filter-keyword').value;
    const type = document.getElementById('filter-type').value;
    const rooms = document.getElementById('filter-rooms').value;
    const minPrice = document.getElementById('filter-price-min').value;
    const maxPrice = document.getElementById('filter-price-max').value;

    // تجهيز المتغيرات للرابط
    const params = new URLSearchParams();

    if (keyword) params.append('keyword', keyword);
    if (type) params.append('type', type);
    if (rooms) params.append('rooms', rooms);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    // استدعاء الدالة بالفلتر الجديد
    fetchProperties(params.toString());
}

// دالة رسم العقارات (Design Render)
function renderProperties(properties) {
    const container = document.querySelector('.properties-grid'); // الحاوية في ملف all-properties.html
    
    if (!container) return;

    container.innerHTML = ''; // مسح المحتوى القديم

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; grid-column: 1/-1; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3>لا توجد عقارات مطابقة للبحث</h3>
                <p>جرب تغيير شروط الفلتر أو البحث عن شيء آخر.</p>
            </div>
        `;
        return;
    }

    properties.forEach(property => {
        const formattedPrice = property.price ? parseInt(property.price).toLocaleString() : '0';
        const typeTag = property.type === 'rent' || property.type === 'إيجار' 
            ? '<span style="color: #ffc107;">(للإيجار)</span>' 
            : '<span style="color: #28a745;">(للبيع)</span>';

        const detailsUrl = `property-details.html?id=${property.id}`;

        const cardHTML = `
            <div class="property-card neon-glow" onclick="window.location.href='${detailsUrl}'">
                
                <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=Aqarak'}" alt="${property.title}">
                
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