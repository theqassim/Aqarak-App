let advPropertiesData = [];
let advCurrentType = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // 1. جلب البيانات فور تحميل الصفحة
    fetchAdvProperties();

    // 2. ربط الأحداث (Events) بالفلاتر الجديدة
    const inputs = ['adv-search-input', 'adv-rooms-select', 'adv-price-min', 'adv-price-max'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', applyAdvFilters); // التحديث عند الكتابة فوراً
    });
});

// دالة جلب البيانات من الـ API
async function fetchAdvProperties() {
    const container = document.getElementById('adv-properties-container');
    
    try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        
        if (Array.isArray(data)) {
            advPropertiesData = data;
            
            // التحقق لو جاي من الصفحة الرئيسية ببحث معين
            const urlParams = new URLSearchParams(window.location.search);
            const keyword = urlParams.get('keyword');
            const type = urlParams.get('type');

            if (keyword) document.getElementById('adv-search-input').value = keyword;
            if (type) {
                if (type === 'بيع' || type === 'buy') updateAdvType('buy');
                else if (type === 'إيجار' || type === 'rent') updateAdvType('rent');
                else applyAdvFilters();
            } else {
                applyAdvFilters();
            }
        }
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = '<div class="adv-loader" style="color:#ff4444;"><i class="fas fa-exclamation-triangle fa-2x"></i><br><br>حدث خطأ في الاتصال بالسيرفر</div>';
    }
}

// دالة تحديث النوع (التبويبات)
window.updateAdvType = function(type) {
    advCurrentType = type;

    // تحديث شكل الزراير
    document.querySelectorAll('.adv-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`adv-btn-${type}`).classList.add('active');

    applyAdvFilters();
}

// دالة الفلترة الرئيسية
function applyAdvFilters() {
    const keyword = document.getElementById('adv-search-input').value.toLowerCase();
    const rooms = document.getElementById('adv-rooms-select').value;
    const minPrice = parseFloat(document.getElementById('adv-price-min').value) || 0;
    const maxPrice = parseFloat(document.getElementById('adv-price-max').value) || Infinity;

    const filtered = advPropertiesData.filter(prop => {
        // 1. النوع
        let typeMatch = true;
        if (advCurrentType === 'buy') typeMatch = (prop.type === 'بيع' || prop.type === 'buy');
        if (advCurrentType === 'rent') typeMatch = (prop.type === 'إيجار' || prop.type === 'rent');

        // 2. البحث (العنوان أو الكود)
        const searchMatch = !keyword || 
                            (prop.title && prop.title.toLowerCase().includes(keyword)) || 
                            (prop.hiddenCode && prop.hiddenCode.toLowerCase().includes(keyword));

        // 3. الغرف
        let roomsMatch = true;
        if (rooms) {
            const propRooms = parseInt(prop.rooms) || 0;
            if (rooms === '4') roomsMatch = propRooms >= 4;
            else roomsMatch = propRooms == rooms;
        }

        // 4. السعر
        // نحاول نجيب السعر الرقمي من كذا مكان عشان نضمن الدقة
        let priceVal = prop.numericPrice; 
        if (!priceVal && prop.price) {
            priceVal = parseFloat(prop.price.toString().replace(/[^0-9.]/g, ''));
        }
        priceVal = priceVal || 0;
        
        const priceMatch = priceVal >= minPrice && priceVal <= maxPrice;

        return typeMatch && searchMatch && roomsMatch && priceMatch;
    });

    renderAdvGrid(filtered);
}

// دالة رسم الكروت الجديدة
function renderAdvGrid(properties) {
    const container = document.getElementById('adv-properties-container');
    container.innerHTML = '';

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="adv-loader" style="color: #888;">
                <i class="fas fa-ghost fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>لا توجد نتائج!</h3>
                <p>جرب تغيير خيارات البحث.</p>
            </div>
        `;
        return;
    }

    properties.forEach(prop => {
        const bgImage = prop.imageUrl || 'logo.png';
        const priceText = prop.price ? parseInt(prop.price.toString().replace(/[^0-9]/g, '')).toLocaleString() : '0';
        
        const isSale = (prop.type === 'بيع' || prop.type === 'buy');
        const typeClass = isSale ? 'is-sale' : 'is-rent';
        const typeText = isSale ? 'للبيع' : 'للإيجار';

        // شريط المميزات (غرف - حمام - مساحة)
        const roomsHtml = prop.rooms ? `<span class="adv-feat-item"><i class="fas fa-bed"></i> ${prop.rooms}</span>` : '';
        const bathsHtml = prop.bathrooms ? `<span class="adv-feat-item"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : '';
        const areaHtml = prop.area ? `<span class="adv-feat-item"><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>` : '';

        // بادجات إضافية
        let extraBadges = '';
        if (prop.isFeatured) extraBadges += `<span style="position:absolute; top:10px; right:10px; background:gold; color:black; padding:5px 8px; border-radius:5px; font-weight:bold; font-size:0.8rem; z-index:2;"><i class="fas fa-star"></i> مميز</span>`;

        const html = `
            <div class="adv-card" onclick="window.location.href='property-details?id=${prop.id}'" style="cursor: pointer;">
                
                <div class="adv-card-img-box">
                    <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                    <span class="adv-type-badge ${typeClass}">${typeText}</span>
                    <div class="adv-price-tag">${priceText} ج.م</div>
                    ${extraBadges}
                </div>

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
}

// زر إعادة التعيين
window.resetAdvFilters = function() {
    document.getElementById('adv-search-input').value = '';
    document.getElementById('adv-rooms-select').value = '';
    document.getElementById('adv-price-min').value = '';
    document.getElementById('adv-price-max').value = '';
    updateAdvType('all');
}
