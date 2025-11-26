// 1. استدعاء مكتبة Supabase (للعقارات المشابهة فقط)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://scncapmhnshjpocenqpm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmNhcG1obnNoanBvY2VucXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQyNTcsImV4cCI6MjA3OTM3MDI1N30.HHyZ73siXlTCVrp9I8qxAm4aMfx3R9r1sYvNWzBh9dI'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- دوال مساعدة ---
window.formatPrice = (price, type) => {
    if (!price) return 'N/A';
    const formatted = parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 });
    return `<span class="detail-price">${formatted}</span> ${type === 'rent' || type === 'إيجار' ? '/ شهرياً' : ''}`;
};

window.getTypeTag = (type) => {
    if (type === 'buy' || type === 'شراء') return `<span class="property-type sale">للبيع</span>`;
    else if (type === 'rent' || type === 'إيجار') return `<span class="property-type rent">للإيجار</span>`;
    return '';
};

// --- دوال نافذة العرض (Make Offer) ---
window.openOfferModal = () => {
    document.getElementById('offer-modal').style.display = 'flex';
};
window.closeOfferModal = () => {
    document.getElementById('offer-modal').style.display = 'none';
};

// --- منطق المفضلة ---
window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        alert('يرجى تسجيل الدخول أولاً.');
        return;
    }
    const isFavorite = btn.classList.contains('is-favorite');
    const method = isFavorite ? 'DELETE' : 'POST';
    const url = isFavorite ? `/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userEmail)}` : `/api/favorites`;
    const body = isFavorite ? null : JSON.stringify({ userEmail, propertyId });
    
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        if (response.ok || response.status === 409) { 
            if (isFavorite) {
                btn.classList.remove('is-favorite');
                favIcon.className = 'far fa-heart';
                alert('تمت الإزالة من المفضلة.');
            } else {
                btn.classList.add('is-favorite');
                favIcon.className = 'fas fa-heart';
                alert('تمت الإضافة للمفضلة.');
            }
        }
    } catch (error) { console.error('Favorite Error:', error); }
};

// --- منطق المشاركة ---
window.shareProperty = async (title) => {
    const shareData = {
        title: `عقارك - ${title}`,
        text: `شاهد هذا العقار المميز على موقع عقارك: ${title}`,
        url: window.location.href
    };
    try {
        if (navigator.share) await navigator.share(shareData);
        else {
            await navigator.clipboard.writeText(window.location.href);
            alert('تم نسخ الرابط!');
        }
    } catch (err) { console.error('Error sharing:', err); }
};

// --- منطق العقارات المشابهة ---
async function loadSimilarProperties(currentProperty) {
    const container = document.getElementById('similar-properties-container');
    if(!container) return;
    try {
        const { data: similar, error } = await supabase.rpc('get_similar_properties', {
            p_id: currentProperty.id, p_type: currentProperty.type, p_price: currentProperty.price,
            p_rooms: currentProperty.rooms, p_bathrooms: currentProperty.bathrooms, p_area: currentProperty.area
        });
        if (error) throw error;
        if (!similar || similar.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777;">لا توجد عقارات مشابهة حالياً.</p>';
            return;
        }
        container.innerHTML = ''; 
        similar.forEach(prop => {
            const price = window.formatPrice(prop.price, prop.type);
            const card = `
                <div class="property-card neon-glow" onclick="window.location.href='property-details.html?id=${prop.id}'">
                    <img src="${prop.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${prop.title}">
                    <div class="card-content">
                        <h4 style="font-size:1.1em; margin-bottom:5px;">${prop.title}</h4>
                        <p class="price" style="font-size:1.1em;">${price}</p>
                        <p style="font-size:0.85em; color:#888;">
                            <i class="fas fa-bed"></i> ${prop.rooms} | <i class="fas fa-bath"></i> ${prop.bathrooms} | ${prop.area} م²
                        </p>
                    </div>
                </div>`;
            container.innerHTML += card;
        });
    } catch (e) { console.error("Error loading similar:", e); }
}

// --- التحميل الرئيسي ---
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('property-detail-container');
    const loadingMessage = document.getElementById('loading-message');
    let currentImageIndex = 0;
    let imageUrls = [];

    const updateMainImage = (mainImage) => {
        mainImage.src = imageUrls[currentImageIndex];
        document.querySelectorAll('.thumbnail-image').forEach((thumb, index) => thumb.classList.toggle('active', index === currentImageIndex));
    };

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id'); 
        if (!propertyId) throw new Error('رابط غير صالح.');
        
        const response = await fetch(`/api/property/${propertyId}`);
        if (!response.ok) throw new Error('العقار غير موجود.');
        
        const property = await response.json(); 

        // التحقق من المفضلة
        const userEmail = localStorage.getItem('userEmail');
        let isFav = false;
        if (userEmail) {
            const favRes = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            if(favRes.ok) {
                const favs = await favRes.json();
                isFav = favs.some(f => f.id === property.id);
            }
        }

        // الصور
        try { imageUrls = JSON.parse(property.imageUrls || '[]'); } catch { imageUrls = [property.imageUrl]; }
        if (!imageUrls.length) imageUrls = ['https://via.placeholder.com/800x500'];

        loadingMessage.style.display = 'none';
        
        const whatsappLink = `https://wa.me/201008102237?text=${encodeURIComponent(`مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`)}`;
        const favClass = isFav ? 'is-favorite' : '';
        const favIcon = isFav ? 'fas fa-heart' : 'far fa-heart';

        // HTML
        container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>

                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info">
                            <p class="detail-price">${window.formatPrice(property.price, property.type)}</p>
                            
                            <button onclick="openOfferModal()" class="btn-neon-auth" style="background: linear-gradient(45deg, #ff9800, #ff5722); color: white; font-size: 0.9rem; padding: 8px 15px; width: auto; margin-right: auto;">
                                <i class="fas fa-hand-holding-usd"></i> قدم عرضك
                            </button>
                        </div>

                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#000000; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <p><strong>المالك:</strong> <span id="admin-owner-name">${property.sellerName || property.ownerName || '-'}</span></p>
                            <p><strong>الهاتف:</strong> <span id="admin-owner-phone">${property.sellerPhone || property.ownerPhone || '-'}</span></p>
                            <p><strong>الكود:</strong> ${property.hiddenCode}</p>
                        </div>

                        <div class="property-specs">
                            <h3>المواصفات</h3>
                            <ul class="specs-list">
                                <li><span>المساحة:</span> ${property.area} م² <i class="fas fa-ruler-combined"></i></li>
                                <li><span>الغرف:</span> ${property.rooms} <i class="fas fa-bed"></i></li>
                                <li><span>الحمامات:</span> ${property.bathrooms} <i class="fas fa-bath"></i></li>
                            </ul>
                        </div>
                        
                        <div class="property-description-box">
                            <h3>الوصف</h3>
                            <p>${property.description || 'لا يوجد وصف.'}</p>
                        </div>
                        
                        <div class="action-buttons-group">
                            <a href="${whatsappLink}" target="_blank" class="whatsapp-btn btn-neon-auth" style="flex:2;">
                                <i class="fab fa-whatsapp"></i> تواصل معنا للمعاينة
                            </a>
                            <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--main-secondary); color:#fff; flex:1;">
                                <i class="fas fa-share-alt"></i> مشاركة
                            </button>
                            <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth ${favClass}" style="flex:1;">
                                <i class="${favIcon}"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="image-gallery-frame neon-glow">
                        <div class="gallery-inner">
                            <div class="main-image-container">
                                <img id="property-main-image" src="${imageUrls[0]}" class="main-image">
                                <button id="prev-image" class="gallery-nav-btn prev-btn"><i class="fas fa-chevron-right"></i></button>
                                <button id="next-image" class="gallery-nav-btn next-btn"><i class="fas fa-chevron-left"></i></button>
                            </div>
                            <div id="image-thumbnails" class="image-thumbnails"></div>
                        </div>
                    </div>
                </div>

                <div class="similar-properties-section" style="margin-top: 50px;">
                    <h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--main-secondary); display:inline-block; padding-bottom:5px;">
                        <i class="fas fa-home"></i> عقارات مشابهة قد تعجبك
                    </h2>
                    <div id="similar-properties-container" class="listings-container">
                        <p>جاري البحث عن مقترحات...</p>
                    </div>
                </div>
            </div>
        `;

        if (localStorage.getItem('userRole') === 'admin') {
            const box = document.getElementById('admin-secret-box');
            if(box) box.style.display = 'block';
        }

        const mainImg = document.getElementById('property-main-image');
        const thumbsContainer = document.getElementById('image-thumbnails');
        const update = () => updateMainImage(mainImg);
        
        if (imageUrls.length > 1) {
            document.getElementById('prev-image').onclick = () => { currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length; update(); };
            document.getElementById('next-image').onclick = () => { currentImageIndex = (currentImageIndex + 1) % imageUrls.length; update(); };
        } else {
            document.querySelectorAll('.gallery-nav-btn').forEach(b => b.style.display = 'none');
        }

        imageUrls.forEach((url, i) => {
            const img = document.createElement('img');
            img.src = url;
            img.className = `thumbnail-image ${i===0?'active':''}`;
            img.onclick = () => { currentImageIndex = i; update(); };
            thumbsContainer.appendChild(img);
        });

        document.getElementById('favoriteBtn').onclick = () => window.toggleFavorite(property.id);

        loadSimilarProperties(property);

        // ✅ تشغيل Lightbox
        if(window.setupLightbox) window.setupLightbox(imageUrls);

        // ✅ تشغيل فورم "قدم عرضك"
        const offerForm = document.getElementById('offer-form');
        if (offerForm) {
            offerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btn = offerForm.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                btn.disabled = true;

                const data = {
                    propertyId: property.id,
                    buyerName: document.getElementById('offer-name').value,
                    buyerPhone: document.getElementById('offer-phone').value,
                    offerPrice: document.getElementById('offer-price').value
                };

                try {
                    const res = await fetch('/api/make-offer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const resData = await res.json();
                    if (res.ok) {
                        alert('✅ ' + resData.message);
                        window.closeOfferModal();
                        offerForm.reset();
                    } else {
                        throw new Error(resData.message);
                    }
                } catch (error) {
                    alert('❌ خطأ: ' + error.message);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error">خطأ: ${error.message}</p>`;
        loadingMessage.style.display = 'none';
    }
});

// --- دالة Lightbox ---
window.setupLightbox = (images) => {
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const counter = document.querySelector('.lightbox-counter');
    const closeBtn = document.querySelector('.close-lightbox');
    const nextBtn = document.querySelector('.next-lightbox');
    const prevBtn = document.querySelector('.prev-lightbox');
    const mainImage = document.getElementById('property-main-image');

    if (!lightbox) return;
    let currentIndex = 0;

    const open = (index) => { currentIndex = index; update(); lightbox.style.display = 'flex'; };
    const update = () => { lightboxImg.src = images[currentIndex]; counter.textContent = `${currentIndex + 1} / ${images.length}`; };
    const close = () => { lightbox.style.display = 'none'; };

    if (mainImage) {
        mainImage.style.cursor = 'zoom-in';
        mainImage.addEventListener('click', () => open(images.findIndex(img => img === mainImage.src) || 0));
    }

    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % images.length; update(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + images.length) % images.length; update(); });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
};