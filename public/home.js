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

    // ✅ نضع رابط التفاصيل هنا عشان نستخدمه في الكارت وفي الزرار
    const detailsUrl = `property-details.html?id=${property.id}`;

    const cardHTML = `
        <div class="property-card" onclick="window.location.href='${detailsUrl}'">
            
            <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=صورة+العقار'}" alt="${property.title}">
            
            <div class="card-content">
                <h3>${property.title} ${typeTag}</h3>
                <p class="price">${formattedPrice}</p>
                <p style="color: #666; margin: 10px 0;">
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