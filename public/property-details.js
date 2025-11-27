// 1. استدعاء مكتبة Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 2. إعدادات الاتصال
const supabaseUrl = 'https://scncapmhnshjpocenqpm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmNhcG1obnNoanBvY2VucXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQyNTcsImV4cCI6MjA3OTM3MDI1N30.HHyZ73siXlTCVrp9I8qxAm4aMfx3R9r1sYvNWzBh9dI'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- دوال مساعدة (Global) ---
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

// --- نوافذ العرض (Modal) ---
window.openOfferModal = () => { document.getElementById('offer-modal').style.display = 'flex'; };
window.closeOfferModal = () => { document.getElementById('offer-modal').style.display = 'none'; };

// --- منطق المفضلة ---
window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');
    
    // قراءة الإيميل مباشرة
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        // حماية إضافية (لن يصل لها المستخدم العادي لأن الزر مخفي، لكن للأمان)
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

// --- زر الواتساب (محمي) ---
window.handleWhatsappClick = (link) => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert('يجب تسجيل الدخول أولاً.');
        return;
    }
    window.open(link, '_blank');
};

// --- عقارات مشابهة (Supabase) ---
async function loadSimilarProperties(currentProperty) {
    const container = document.getElementById('similar-properties-container');
    if(!container) return;

    try {
        const { data: similar, error } = await supabase.rpc('get_similar_properties', {
            p_id: parseInt(currentProperty.id),
            p_type: currentProperty.type,
            p_price: parseFloat(String(currentProperty.price).replace(/[^0-9.]/g, '')),
            p_rooms: parseInt(currentProperty.rooms || 0),
            p_bathrooms: parseInt(currentProperty.bathrooms || 0),
            p_area: parseInt(currentProperty.area || 0)
        });

        if (error) throw error;

        if (!similar || similar.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777;">لا توجد عقارات مشابهة حالياً.</p>';
            return;
        }

        container.innerHTML = ''; 
        
        similar.forEach(prop => {
            const price = window.formatPrice(prop.price, prop.type);
            let badges = '';
            if(prop.isFeatured) badges = '<span style="position:absolute; top:10px; right:10px; background:#ffc107; color:black; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">مميز</span>';

            const card = `
                <div class="property-card neon-glow" onclick="window.location.href='property-details.html?id=${prop.id}'" style="position:relative; cursor:pointer;">
                    ${badges}
                    <img src="${prop.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${prop.title}">
                    <div class="card-content">
                        <h4 style="font-size:1.1em; margin-bottom:5px;">${prop.title}</h4>
                        <p class="price" style="font-size:1.1em;">${price}</p>
                        <p style="font-size:0.85em; color:#888;">
                            <i class="fas fa-bed"></i> ${prop.rooms} | <i class="fas fa-bath"></i> ${prop.bathrooms} | ${prop.area} م²
                        </p>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (e) {
        console.error("Error loading similar:", e);
        container.innerHTML = '<p>خطأ في تحميل الاقتراحات.</p>';
    }
}

// --- التحميل الرئيسي للصفحة ---
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
        // 1. التحقق من المستخدم
        const userEmail = localStorage.getItem('userEmail');
        const isLoggedIn = userEmail !== null;

        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id'); 
        if (!propertyId) throw new Error('رابط غير صالح.');
        
        const response = await fetch(`/api/property/${propertyId}`);
        if (!response.ok) throw new Error('العقار غير موجود.');
        
        const property = await response.json(); 

        // معالجة الصور
        imageUrls = [];
        if (property.imageUrls) {
            if (Array.isArray(property.imageUrls)) imageUrls = property.imageUrls;
            else if (typeof property.imageUrls === 'string') {
                try { imageUrls = JSON.parse(property.imageUrls); } 
                catch (e) { imageUrls = [property.imageUrl]; }
            }
        }
        if (!imageUrls || imageUrls.length === 0) {
            imageUrls = property.imageUrl ? [property.imageUrl] : ['https://via.placeholder.com/800x500.png?text=No+Image'];
        }
        imageUrls = imageUrls.filter(u => u && u.trim() !== '');

        loadingMessage.style.display = 'none';
        
        const whatsappLink = `https://wa.me/201008102237?text=${encodeURIComponent(`مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`)}`;
        
        // التحقق من المفضلة
        let isFav = false;
        if (isLoggedIn) {
            try {
                const favRes = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
                if(favRes.ok) {
                    const favs = await favRes.json();
                    isFav = favs.some(f => f.id === property.id);
                }
            } catch(e) {}
        }

        const favClass = isFav ? 'is-favorite' : '';
        const favIcon = isFav ? 'fas fa-heart' : 'far fa-heart';


        // 🔥🔥🔥 2. تجهيز الأزرار (المنطق الجديد) 🔥🔥🔥
        
        let actionSectionHTML = '';
        let makeOfferButtonHTML = '';

        if (isLoggedIn) {
            // ✅ حالة: مسجل دخول (عرض الأزرار كاملة)
            
            makeOfferButtonHTML = `<button onclick="openOfferModal()" class="btn-offer"><i class="fas fa-hand-holding-usd"></i> قدم عرضك</button>`;
            
            actionSectionHTML = `
                <div class="action-buttons-group">
                    <button onclick="window.handleWhatsappClick('${whatsappLink}')" class="whatsapp-btn btn-neon-auth" style="flex:2; background-color: #25d366; color: white; border: none; box-shadow: 0 0 8px #25d366;">
                        <i class="fab fa-whatsapp"></i> تواصل واتساب
                    </button>
                    
                    <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--main-secondary); color:#fff; flex:1;">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                    
                    <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth ${favClass}" style="flex:1;">
                        <i id="favIcon" class="${favIcon}"></i>
                    </button>
                </div>
            `;
        } else {
            // 🔒 حالة: زائر (إخفاء الأزرار وعرض القفل)
            
            // لا يوجد زر "قدم عرضك"
            makeOfferButtonHTML = ''; 
            
            actionSectionHTML = `
                <div class="login-prompt-box">
                    <div class="prompt-content">
                        <div class="lock-icon"><i class="fas fa-lock"></i></div>
                        <h3 class="prompt-title">هذه الميزات حصرية للأعضاء</h3>
                        <p class="prompt-text">
                            للتواصل ، معرفة السعر النهائي، أو إضافة العقار للمفضلة، يرجى تسجيل الدخول.
                        </p>
                        <a href="index?mode=login" class="btn-login-prompt">
                            <i class="fas fa-sign-in-alt"></i> تسجيل الدخول / حساب جديد
                        </a>
                    </div>
                    <div style="margin-top:15px;">
                        <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--main-secondary); color:#fff; flex:1;">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                    </div>
                </div>
            `;
        }

        // رسم الصفحة
        container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>

                ${property.isLegal ? `
                <div class="legal-trust-box neon-glow">
                    <div class="legal-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="legal-content">
                        <h4>عقار تم الفحص القانوني له ✅</h4>
                        <p>تمت مراجعة أوراق هذا العقار والتسلسل الملكي الخاص به بواسطة فريقنا القانوني.</p>
                    </div>
                </div>` : ''}

                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info">
                            <p class="detail-price">${window.formatPrice(property.price, property.type)}</p>
                            ${makeOfferButtonHTML}
                        </div>

                        <div id="savings-calculator-box" class="savings-box-modern" style="display: none;">
                            <div class="savings-header-modern"><i class="fas fa-wallet"></i> ليه تدفع أكتر؟</div>
                            <div class="savings-body">
                                <div class="compare-row bad"><div class="label-col"><span class="icon">❌</span><span class="text">عمولة المكاتب العادية (2.5%)</span></div><div class="value-col" id="broker-fee">0 ج.م</div></div>
                                <div class="compare-row good"><div class="label-col"><span class="icon">✅</span><span class="text">عمولة موقع عقارك (1%)</span></div><div class="value-col" id="aqarak-fee">0 ج.م</div></div>
                            </div>
                            <div class="savings-footer"><span class="saved-label">💰 إجمالي توفيرك معنا:</span><span class="saved-value" id="total-saved-amount">0 ج.م</span></div>
                        </div>

                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#fff0f0; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <div style="color:#333; font-size:0.95rem;">
                                <p><strong>المالك:</strong> <span id="admin-owner-name">${property.sellerName || property.ownerName || '-'}</span></p>
                                <p><strong>الهاتف:</strong> <span id="admin-owner-phone">${property.sellerPhone || property.ownerPhone || '-'}</span></p>
                                <p><strong>الكود:</strong> <span style="background:#333; color:#fff; padding:2px 5px; border-radius:3px;">${property.hiddenCode}</span></p>
                            </div>
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
                        
                        ${actionSectionHTML}

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

        // تشغيل الحاسبة
        const priceNum = parseFloat(String(property.price).replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNum) && priceNum > 0) {
            const broker = priceNum * 0.025;
            const aqarak = priceNum * 0.01;
            const saved = broker - aqarak;
            document.getElementById('broker-fee').textContent = Math.round(broker).toLocaleString() + ' ج.م';
            document.getElementById('aqarak-fee').textContent = Math.round(aqarak).toLocaleString() + ' ج.م';
            document.getElementById('total-saved-amount').textContent = Math.round(saved).toLocaleString() + ' ج.م';
            document.getElementById('savings-calculator-box').style.display = 'block';
        }

        // تشغيل الأدمن
        if (localStorage.getItem('userRole') === 'admin') {
            const box = document.getElementById('admin-secret-box');
            if(box) {
                box.style.display = 'block';
                
                const controlsDiv = document.createElement('div');
                controlsDiv.style.marginTop = '10px'; controlsDiv.style.display = 'flex'; controlsDiv.style.gap = '10px';
                
                const createBadgeBtn = (text, isActive, color, onClick) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-neon-auth';
                    btn.style.fontSize = '0.7rem'; btn.style.padding = '5px 10px';
                    btn.style.background = isActive ? color : '#555';
                    btn.innerHTML = isActive ? `<i class="fas fa-check"></i> ${text}` : `تفعيل ${text}`;
                    btn.onclick = onClick;
                    return btn;
                };

                controlsDiv.appendChild(createBadgeBtn('مميز', property.isFeatured, '#ffc107', async () => {
                    if(!confirm('تغيير حالة التميز؟')) return;
                    await fetch(`/api/admin/toggle-badge/${property.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'isFeatured', value: !property.isFeatured }) });
                    location.reload();
                }));

                controlsDiv.appendChild(createBadgeBtn('قانوني', property.isLegal, '#28a745', async () => {
                    if(!confirm('تغيير حالة الفحص القانوني؟')) return;
                    await fetch(`/api/admin/toggle-badge/${property.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'isLegal', value: !property.isLegal }) });
                    location.reload();
                }));

                box.appendChild(controlsDiv);
            }
        }

        // تشغيل الصور
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

        // تشغيل زر المفضلة (إذا كان موجوداً)
        const favBtn = document.getElementById('favoriteBtn');
        if (favBtn) {
            favBtn.onclick = () => window.toggleFavorite(property.id);
        }

        loadSimilarProperties(property);
        if(window.setupLightbox) window.setupLightbox(imageUrls);

        // تشغيل فورم العرض (إذا كان موجوداً)
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

// --- Lightbox Function ---
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
    document.addEventListener('keydown', (e) => { 
        if (lightbox.style.display === 'flex') { 
            if (e.key === 'Escape') close(); 
            if (e.key === 'ArrowLeft') nextBtn.click(); 
            if (e.key === 'ArrowRight') prevBtn.click(); 
        } 
    });
};