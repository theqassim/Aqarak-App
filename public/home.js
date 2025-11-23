document.addEventListener('DOMContentLoaded', () => {
    fetchLatestProperties();
});

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
    const formattedPrice = formatPrice(property.price, property.type);
    const typeTag = getTypeTag(property.type);

    const cardHTML = `
        <div class="property-card">
            <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=صورة+الشقة'}" alt="${property.title}">
            <div class="card-content">
                <h3>${property.title} ${typeTag}</h3>
                <p class="price">${formattedPrice}</p>
                <p>${property.rooms} غرف | ${property.bathrooms} حمام | ${property.area} م²</p>
                
                <a href="property-details.html?id=${property.id}" class="btn view-details-btn">
                    عرض التفاصيل
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