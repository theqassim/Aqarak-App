document.addEventListener('DOMContentLoaded', () => {
    // تحميل عقارات الإيجار فقط عند البدء
    fetchProperties();

    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilter();
        });
    }
});

async function fetchProperties(queryParams = '') {
    const container = document.querySelector('.properties-grid');
    if (container) container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';

    try {
        // ✅ إجبار النوع على "إيجار" دائماً
        let url = `/api/properties?type=buy`;
        if (queryParams) url += `&${queryParams}`;
        
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
    const rooms = document.getElementById('filter-rooms').value;
    const minPrice = document.getElementById('filter-price-min').value;
    const maxPrice = document.getElementById('filter-price-max').value;

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (rooms) params.append('rooms', rooms);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    fetchProperties(params.toString());

    // ✅✅✅ الكود السحري لإغلاق القائمة بعد التطبيق ✅✅✅
    const filterBody = document.getElementById('filter-body');
    const filterContainer = document.querySelector('.filter-container');
    
    if (filterBody) {
        filterBody.style.display = 'none'; // إخفاء القائمة
        if(filterContainer) filterContainer.classList.remove('active'); // إرجاع السهم لوضعه الطبيعي
    }
}

// دالة الرسم (نفس الدالة الموحدة)
function renderProperties(properties) {
    const container = document.querySelector('.properties-grid');
    if (!container) return;
    container.innerHTML = '';

    if (properties.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:30px;"><p>لا توجد عقارات مطابقة.</p></div>`;
        return;
    }

    properties.forEach(property => {
        const formattedPrice = property.price ? parseInt(property.price).toLocaleString() : '0';
        // بما أننا في صفحة إيجار، التاج دائماً للإيجار
        const typeTag = '<span style="color: #0ce642ff;">(للبيع)</span>';
        const detailsUrl = `property-details?id=${property.id}`;

        const cardHTML = `
            <div class="property-card neon-glow" onclick="window.location.href='${detailsUrl}'">
                <img src="${property.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${property.title}">
                <div class="card-content">
                    <h3>${property.title} ${typeTag}</h3>
                    <p class="price">${formattedPrice} ج.م / شهرياً</p>
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