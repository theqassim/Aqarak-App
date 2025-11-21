document.addEventListener('DOMContentLoaded', () => {
    checkUrlForKeyword();
    fetchAllProperties();

    document.getElementById('filter-apply-btn').addEventListener('click', fetchAllProperties);
});

function checkUrlForKeyword() {
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword');
    if (keyword) {
        document.getElementById('filter-keyword').value = keyword;
    }
}

async function fetchAllProperties() {
    const container = document.getElementById('all-listings-container');
    const title = document.getElementById('properties-list-title');
    container.innerHTML = '<p class="empty-message">جاري تحميل العقارات...</p>';

    const keyword = document.getElementById('filter-keyword').value;
    const type = document.getElementById('filter-type').value;
    const minPrice = document.getElementById('filter-price-min').value;
    const maxPrice = document.getElementById('filter-price-max').value;
    const rooms = document.getElementById('filter-rooms').value;

    let apiUrl = '/api/properties?';
    const params = new URLSearchParams();

    if (keyword) params.append('keyword', keyword);
    if (type) params.append('type', type === 'بيع' ? 'buy' : 'rent');
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (rooms) params.append('rooms', rooms);

    apiUrl += params.toString();

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const properties = await response.json();
        container.innerHTML = '';

        if (properties.length === 0) {
            title.innerText = 'لا توجد عقارات مطابقة للبحث';
            container.innerHTML = '<p class="empty-message">لم نجد أي عقارات تطابق بحثك. حاول مرة أخرى أو قم بتغيير الفلاتر.</p>';
            return;
        }

        title.innerText = `تم العثور على ${properties.length} عقار`;
        properties.forEach(property => {
            const formattedPrice = formatPrice(property.price, property.type);
            const typeTag = getTypeTag(property.type);

            const cardHTML = `
                <div class="property-card">
                    <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=صورة+الشقة'}" alt="${property.title}">
                    <div class="card-content">
                        <h3>${property.title} ${typeTag}</h3> <p class="price">${formattedPrice}</p> <p>${property.rooms} غرف | ${property.bathrooms} حمام | ${property.area} م²</p>
                        <a href="property-details.html?id=${property.id}" class="btn">عرض التفاصيل</a>
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