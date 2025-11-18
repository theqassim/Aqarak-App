// property-details.js

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

// منطق المفضلة (تمت تحديثه لاستخدام API)
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
        
        // التحقق من النجاح أو التعارض (409)
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

    const updateMainImage = (mainImage, thumbnailsContainer) => {
        mainImage.src = imageUrls[currentImageIndex];
        thumbnailsContainer.querySelectorAll('.thumbnail-image').forEach((thumb, index) => {
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

        // 🚨 التحقق من حالة المفضلة عند تحميل الصفحة
        const userEmail = localStorage.getItem('userEmail');
        let isCurrentlyFavorite = false;
        
        if (userEmail) {
            // المسار يقوم بجلب قائمة المفضلة ويتم البحث داخلها
            const favCheckResponse = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            if (favCheckResponse.ok) {
                const favorites = await favCheckResponse.json();
                // التحقق مما إذا كان هذا العقار موجوداً في قائمة المفضلة
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

        container.innerHTML = detailHTML;
        
        // 4. ربط العناصر للـ JS (بعد حقن الـ HTML)
        const mainImage = document.getElementById('property-main-image');
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        const favoriteButtonEl = document.getElementById('favoriteBtn'); 

        const updateMainImageWithElements = () => updateMainImage(mainImage, thumbnailsContainer);

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
        
        // ربط زر المفضلة بالدالة
        if (favoriteButtonEl) {
             favoriteButtonEl.addEventListener('click', () => {
                window.toggleFavorite(favoriteButtonEl.dataset.id);
             });
        }
        
        updateMainImageWithElements();
        renderThumbnails(thumbnailsContainer, updateMainImageWithElements);

    } catch (error) {
        console.error('Error fetching property details:', error);
        loadingMessage.style.display = 'none';
        container.innerHTML = `<div class="empty-message">
                                     <h1 style="color: #e74c3c;">🛑 خطأ في العرض: ${error.message}</h1>
                                     <p>يرجى التأكد من تشغيل الخادم وأن الرقم التعريفي صحيح.</p>
                                    </div>`;
    }
});