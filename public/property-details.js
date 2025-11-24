// property-details.js

// 🚨 دوال مساعدة
window.formatPrice = (price, type) => {
    if (!price) return 'N/A';
    const formatted = parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 });
    return `<span class="detail-price">${formatted}</span> ${type === 'rent' || type === 'إيجار' ? '/ شهرياً' : ''}`;
};

window.getTypeTag = (type) => {
    if (type === 'buy' || type === 'شراء') {
        return `<span class="property-type sale">للبيع</span>`;
    } else if (type === 'rent' || type === 'إيجار') {
        return `<span class="property-type rent">للإيجار</span>`;
    }
    return '';
};

// 🚨 منطق المفضلة
window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        alert('يرجى تسجيل الدخول أولاً لإضافة العقارات للمفضلة.');
        return;
    }
    if (!propertyId) {
        alert('خطأ: لم يتم تحديد رقم العقار.');
        return;
    }

    const isFavorite = btn.classList.contains('is-favorite');
    const method = isFavorite ? 'DELETE' : 'POST';
    const url = isFavorite 
        ? `/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userEmail)}`
        : `/api/favorites`;

    const body = isFavorite ? null : JSON.stringify({ userEmail, propertyId: propertyId });
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        
        if (response.ok || response.status === 409) { 
            if (isFavorite) {
                btn.classList.remove('is-favorite');
                favIcon.className = 'far fa-heart';
                alert('تمت الإزالة من المفضلة.');
            } else {
                btn.classList.add('is-favorite');
                favIcon.className = 'fas fa-heart';
                alert('تمت الإضافة إلى المفضلة.');
            }
        } else {
            const data = await response.json();
            throw new Error(data.message || 'فشل في الاتصال بالخادم.');
        }

    } catch (error) {
        alert(`خطأ في المفضلة: ${error.message}`);
        console.error('Favorite Toggle Error:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('property-detail-container');
    const loadingMessage = document.getElementById('loading-message');

    let currentImageIndex = 0;
    let imageUrls = [];

    // --- الدوال المساعدة للمرئيات والتنقل ---
    const updateMainImage = (mainImage, thumbnailsContainer) => {
        mainImage.src = imageUrls[currentImageIndex];
        document.querySelectorAll('.thumbnail-image').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentImageIndex);
        });
    };

    const renderThumbnails = (thumbnailsContainer, updateMainImage) => {
        thumbnailsContainer.innerHTML = '';
        imageUrls.forEach((url, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = url;
            thumbnail.classList.add('thumbnail-image');
            if (index === currentImageIndex) { thumbnail.classList.add('active'); }
            thumbnail.addEventListener('click', () => {
                currentImageIndex = index;
                updateMainImage();
            });
            thumbnailsContainer.appendChild(thumbnail);
        });
    };
    
    // --- منطق جلب البيانات وربطها ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id'); 

        if (!propertyId) {
            throw new Error('لم يتم تحديد كود العقار (id) في الرابط.');
        }
        
        const url = `/api/property/${propertyId}`; 
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = { message: `فشل جلب البيانات: ${response.status} ${response.statusText}` };
            try {
                const jsonResponse = await response.json();
                errorData.message = jsonResponse.message || errorData.message;
            } catch (e) { }
            throw new Error(errorData.message || 'العقار غير منشور أو غير موجود.');
        }
        
        const property = await response.json(); 
        
        if (!property || property.message) { 
            throw new Error(property.message || 'العقار غير موجود في قاعدة البيانات.');
        }

        // 🚨 التحقق من حالة المفضلة
        const userEmail = localStorage.getItem('userEmail');
        let isCurrentlyFavorite = false;
        
        if (userEmail) {
            const favCheckResponse = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            if (favCheckResponse.ok) {
                const favorites = await favCheckResponse.json();
                isCurrentlyFavorite = favorites.some(fav => fav.id === property.id);
            }
        }
        
        
        if (property.imageUrls) {
            try {
                imageUrls = property.imageUrls;
            } catch (e) {
                imageUrls = property.imageUrl ? [property.imageUrl] : [];
            }
        }
        if (imageUrls.length === 0) {
            imageUrls.push('https://via.placeholder.com/800x500.png?text=صورة+بديلة');
        }

        loadingMessage.style.display = 'none';
        
        const whatsappNumber = "201008102237"; 
        const message = `أنا مهتم بالعقار: ${property.title} (الكود السري: ${property.hiddenCode})`;
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        const favClass = isCurrentlyFavorite ? 'is-favorite' : '';
        const favIconClass = isCurrentlyFavorite ? 'fas fa-heart' : 'far fa-heart';
        const favText = isCurrentlyFavorite ? ' تمت الإضافة' : ' أضف إلى المفضلة';

        // 🚨 بناء الهيكل
        const detailHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>

                <div class="details-layout">
                    
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info">
                            <p class="detail-price">${window.formatPrice(property.price, property.type)}</p>
                        </div>

                       <div id="admin-secret-box" style="display: none; margin: 20px 0; background: #180f0fff; border: 2px dashed #dc3545; padding: 15px; border-radius: 10px;">
    <h3 style="color: #dc3545; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; font-size: 1.1em;">
        <i class="fas fa-user-shield"></i> بيانات خاصة للإدارة
    </h3>
    <div style="display: grid; gap: 10px; font-size: 1em; color: #333;">
        <p><strong>👤 اسم المالك:</strong> <span id="admin-seller-name">-</span></p>
        <p><strong>📞 رقم الهاتف:</strong> <span id="admin-seller-phone">-</span></p>
        <p><strong>🔑 الكود السري:</strong> <span id="admin-hidden-code" style="background: #333; color: #fff; padding: 2px 8px; border-radius: 4px;">-</span></p>
    </div>
</div>

                        <div class="property-specs">
                            <h3>المواصفات الرئيسية</h3>
                            <ul class="specs-list">
                                <li><span>المساحة:</span> ${property.area || 'N/A'} م² <i class="fas fa-ruler-combined"></i></li>
                                <li><span>عدد الغرف:</span> ${property.rooms || 'N/A'} <i class="fas fa-bed"></i></li>
                                <li><span>عدد الحمامات:</span> ${property.bathrooms || 'N/A'} <i class="fas fa-bath"></i></li>
                            </ul>
                        </div>
                        
                        <div class="property-description-box">
                            <h3>الوصف التفصيلي</h3>
                            <p>${property.description || 'لا يوجد وصف متوفر حالياً.'}</p>
                        </div>
                        
                        <div class="action-buttons-group">
                            <a href="${whatsappLink}" target="_blank" class="whatsapp-btn btn-neon-auth" style="background-color: #25d366; box-shadow: 0 0 8px #25d366; color: white;">
                                <i class="fab fa-whatsapp"></i> تواصل معنا للمعاينة
                            </a>
                            <button class="favorite-button btn-neon-auth ${favClass}" id="favoriteBtn" data-id="${property.id}" style="background-color: #c0392b; box-shadow: 0 0 8px #e74c3c; color: white;">
                                <i id="favIcon" class="${favIconClass}"></i> ${favText}
                            </button>
                        </div>
                    </div>
                    
                    <div class="image-gallery-frame neon-glow">
                        <div class="gallery-inner">
                            <div class="main-image-container">
                                <img id="property-main-image" src="${imageUrls[0]}" alt="${property.title}" class="main-image">
                                <button id="prev-image" class="gallery-nav-btn prev-btn"><i class="fas fa-chevron-left"></i></button>
                                <button id="next-image" class="gallery-nav-btn next-btn"><i class="fas fa-chevron-right"></i></button>
                            </div>
                            <div id="image-thumbnails" class="image-thumbnails"></div>
                        </div>
                    </div>

                </div>
            </div>
        `;
        
        container.innerHTML = detailHTML;
        
        // 4. ربط العناصر للـ JS
        const mainImage = document.getElementById('property-main-image');
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        const favoriteButtonEl = document.getElementById('favoriteBtn'); 

        const updateMainImageWithElements = () => updateMainImage(mainImage, thumbnailsContainer);

        // --- منطق التنقل ---
        if(imageUrls.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length; 
            updateMainImageWithElements();
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % imageUrls.length;
            updateMainImageWithElements();
        });
        
        if (favoriteButtonEl) {
             favoriteButtonEl.addEventListener('click', () => {
                window.toggleFavorite(favoriteButtonEl.dataset.id);
             });
        }
        
        updateMainImageWithElements();
        renderThumbnails(thumbnailsContainer, updateMainImageWithElements);

        // ============================================================
        // ✅ الجزء الجديد: ملء وإظهار الصندوق السري للأدمن فقط
        // ============================================================
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'admin') {
            const adminBox = document.getElementById('admin-secret-box');
            if (adminBox) {
                // ✅ هنا نقرأ من property.sellerName ونضعها في العنصر admin-seller-name
                // لاحظ أننا استخدمنا || لدعم العقارات القديمة (owner) والجديدة (seller) مؤقتاً
                document.getElementById('admin-seller-name').textContent = property.sellerName || property.ownerName || 'غير مسجل';
                document.getElementById('admin-seller-phone').textContent = property.sellerPhone || property.ownerPhone || 'غير مسجل';
                document.getElementById('admin-hidden-code').textContent = property.hiddenCode || 'لا يوجد';
                
                adminBox.style.display = 'block'; 
            }
        }
    } catch (error) {
        console.error('Error fetching property details:', error);
        loadingMessage.style.display = 'none';
        container.innerHTML = `<div class="empty-message">
                                     <h1 style="color: #e74c3c;">🛑 خطأ في العرض: ${error.message}</h1>
                                     <p>يرجى التأكد من تشغيل الخادم وأن الرقم التعريفي صحيح.</p>
                                    </div>`;
    }
});