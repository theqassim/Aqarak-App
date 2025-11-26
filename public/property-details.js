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

// --- نافذة العرض ---
window.openOfferModal = () => { document.getElementById('offer-modal').style.display = 'flex'; };
window.closeOfferModal = () => { document.getElementById('offer-modal').style.display = 'none'; };

// --- المفضلة ---
window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) { alert('يرجى تسجيل الدخول أولاً.'); return; }

    const isFavorite = btn.classList.contains('is-favorite');
    const method = isFavorite ? 'DELETE' : 'POST';
    const url = isFavorite ? `/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userEmail)}` : `/api/favorites`;
    const body = isFavorite ? null : JSON.stringify({ userEmail, propertyId });
    
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        if (response.ok || response.status === 409) { 
            if (isFavorite) {
                btn.classList.remove('is-favorite'); favIcon.className = 'far fa-heart'; alert('تمت الإزالة من المفضلة.');
            } else {
                btn.classList.add('is-favorite'); favIcon.className = 'fas fa-heart'; alert('تمت الإضافة للمفضلة.');
            }
        }
    } catch (error) { console.error('Favorite Error:', error); }
};

// --- المشاركة ---
window.shareProperty = async (title) => {
    const shareData = { title: `عقارك - ${title}`, text: `شاهد هذا العقار: ${title}`, url: window.location.href };
    try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط!'); } } catch (err) {}
};

// --- عقارات مشابهة ---
async function loadSimilarProperties(currentProperty) {
    const container = document.getElementById('similar-properties-container');
    if(!container) return;
    try {
        const { data: similar, error } = await supabase.rpc('get_similar_properties', {
            p_id: currentProperty.id, p_type: currentProperty.type, p_price: currentProperty.price,
            p_rooms: currentProperty.rooms, p_bathrooms: currentProperty.bathrooms, p_area: currentProperty.area
        });
        if (error) throw error;
        if (!similar || similar.length === 0) { container.innerHTML = '<p style="text-align:center; color:#777;">لا توجد عقارات مشابهة.</p>'; return; }
        container.innerHTML = ''; 
        similar.forEach(prop => {
            const price = window.formatPrice(prop.price, prop.type);
            container.innerHTML += `
                <div class="property-card neon-glow" onclick="window.location.href='property-details?id=${prop.id}'">
                    <img src="${prop.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${prop.title}">
                    <div class="card-content">
                        <h4>${prop.title}</h4> <p class="price">${price}</p>
                    </div>
                </div>`;
        });
    } catch (e) { console.error("Error similar:", e); }
}

// --- التحميل الرئيسي ---
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('property-detail-container');
    const loadingMessage = document.getElementById('loading-message');
    let currentImageIndex = 0;
    let imageUrls = [];

    const updateMainImage = (mainImage) => {
        if (imageUrls.length > 0) {
            mainImage.src = imageUrls[currentImageIndex];
            document.querySelectorAll('.thumbnail-image').forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentImageIndex);
            });
        }
    };

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id'); 
        if (!propertyId) throw new Error('رابط غير صالح.');
        
        const response = await fetch(`/api/property/${propertyId}`);
        if (!response.ok) throw new Error('العقار غير موجود.');
        
        const property = await response.json(); 

        // 🛠️ إصلاح مشكلة الصور (هنا التعديل المهم) 🛠️
        imageUrls = [];
        
        // 1. حاول قراءة المصفوفة imageUrls
        if (property.imageUrls) {
            if (Array.isArray(property.imageUrls)) {
                imageUrls = property.imageUrls;
            } else if (typeof property.imageUrls === 'string') {
                try {
                    imageUrls = JSON.parse(property.imageUrls);
                } catch (e) {
                    console.error("JSON Parse Error for images, using main image only.");
                    imageUrls = [property.imageUrl];
                }
            }
        }

        // 2. لو المصفوفة فاضية، استخدم الصورة الرئيسية
        if (!imageUrls || imageUrls.length === 0) {
            if (property.imageUrl) imageUrls = [property.imageUrl];
            else imageUrls = ['https://via.placeholder.com/800x500.png?text=No+Image'];
        }

        // 3. تنظيف الروابط (إزالة الفراغات)
        imageUrls = imageUrls.filter(url => url && url.trim() !== '');

        loadingMessage.style.display = 'none';
        
        const whatsappLink = `https://wa.me/201008102237?text=${encodeURIComponent(`مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`)}`;
        const favClass = (localStorage.getItem('userEmail')) ? '' : ''; // سيتم تحديثها لاحقاً
        const favIcon = 'far fa-heart';

        container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>
                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info">
                            <p class="detail-price">${window.formatPrice(property.price, property.type)}</p>
                            <button onclick="openOfferModal()" class="btn-offer"><i class="fas fa-hand-holding-usd"></i> قدم عرضك</button>
                        </div>

                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#000000; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <p><strong>المالك:</strong> <span id="admin-owner-name">${property.sellerName || property.ownerName || '-'}</span></p>
                            <p><strong>الهاتف:</strong> <span id="admin-owner-phone">${property.sellerPhone || property.ownerPhone || '-'}</span></p>
                            <p><strong>الكود:</strong> ${property.hiddenCode}</p>
                        </div>

                        <div class="property-specs">
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
                                <i class="fab fa-whatsapp"></i> تواصل واتساب
                            </a>
                            <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--main-secondary); color:#fff; flex:1;">
                                <i class="fas fa-share-alt"></i> مشاركة
                            </button>
                            <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth" style="flex:1;">
                                <i id="favIcon" class="far fa-heart"></i>
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
                        <i class="fas fa-home"></i> عقارات مشابهة
                    </h2>
                    <div id="similar-properties-container" class="listings-container">
                        <p>جاري البحث...</p>
                    </div>
                </div>
            </div>
        `;

        if (localStorage.getItem('userRole') === 'admin') {
            const box = document.getElementById('admin-secret-box');
            if(box) box.style.display = 'block';
        }

        // ✅ تشغيل معرض الصور (Thumbnails + Arrows)
        const mainImg = document.getElementById('property-main-image');
        const thumbsContainer = document.getElementById('image-thumbnails');
        const update = () => updateMainImage(mainImg);
        
        // إظهار/إخفاء الأسهم حسب عدد الصور
        if (imageUrls.length > 1) {
            document.getElementById('prev-image').onclick = () => { currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length; update(); };
            document.getElementById('next-image').onclick = () => { currentImageIndex = (currentImageIndex + 1) % imageUrls.length; update(); };
        } else {
            document.querySelectorAll('.gallery-nav-btn').forEach(b => b.style.display = 'none');
        }

        // ✅ رسم الصور المصغرة
        thumbsContainer.innerHTML = ''; // تنظيف
        imageUrls.forEach((url, i) => {
            const img = document.createElement('img');
            img.src = url;
            img.className = `thumbnail-image ${i===0?'active':''}`;
            img.onclick = () => { currentImageIndex = i; update(); };
            thumbsContainer.appendChild(img);
        });

        // التحقق من المفضلة (بعد الرسم)
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            const favRes = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            if(favRes.ok) {
                const favs = await favRes.json();
                if (favs.some(f => f.id === property.id)) {
                    document.getElementById('favoriteBtn').classList.add('is-favorite');
                    document.getElementById('favIcon').className = 'fas fa-heart';
                }
            }
        }
        document.getElementById('favoriteBtn').onclick = () => window.toggleFavorite(property.id);

        // بقية الوظائف
        loadSimilarProperties(property);
        if(window.setupLightbox) window.setupLightbox(imageUrls);

        // تشغيل فورم العرض
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
                    const res = await fetch('/api/make-offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const resData = await res.json();
                    if (res.ok) { alert('✅ ' + resData.message); window.closeOfferModal(); offerForm.reset(); }
                    else { throw new Error(resData.message); }
                } catch (error) { alert('❌ خطأ: ' + error.message); } 
                finally { btn.innerHTML = originalText; btn.disabled = false; }
            });
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error">خطأ: ${error.message}</p>`;
        loadingMessage.style.display = 'none';
    }
});

// --- Lightbox ---
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
    if (mainImage) { mainImage.style.cursor = 'zoom-in'; mainImage.addEventListener('click', () => open(images.findIndex(img => img === mainImage.src) || 0)); }
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % images.length; update(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + images.length) % images.length; update(); });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if (lightbox.style.display === 'flex') { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') nextBtn.click(); if (e.key === 'ArrowRight') prevBtn.click(); } });
};