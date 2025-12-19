import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://scncapmhnshjpocenqpm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmNhcG1obnNoanBvY2VucXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQyNTcsImV4cCI6MjA3OTM3MDI1N30.HHyZ73siXlTCVrp9I8qxAm4aMfx3R9r1sYvNWzBh9dI'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- 1. ستايل الزرار ---
const style = document.createElement('style');
style.innerHTML = `
    .video-btn-modern {
        background: linear-gradient(135deg, #ff0000, #c0392b);
        color: white; border: none; padding: 12px 30px; border-radius: 50px;
        display: flex; align-items: center; gap: 15px; cursor: pointer;
        font-size: 1.1rem; font-weight: bold; box-shadow: 0 10px 20px rgba(192, 57, 43, 0.4);
        transition: all 0.3s ease; margin: 20px auto; width: fit-content; text-decoration: none;
    }
    .video-btn-modern:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(192, 57, 43, 0.6); }
    .video-btn-modern .icon-pulse {
        background: white; color: #c0392b; width: 32px; height: 32px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 14px; animation: pulse-glow 2s infinite;
    }
    .video-btn-modern .badge { background: rgba(0,0,0,0.2); padding: 2px 10px; border-radius: 10px; font-size: 0.9rem; }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
`;
document.head.appendChild(style);

// --- دوال المساعدة ---
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

window.openOfferModal = () => { document.getElementById('offer-modal').style.display = 'flex'; };
window.closeOfferModal = () => { document.getElementById('offer-modal').style.display = 'none'; };

window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');

    // لم نعد بحاجة للتحقق من localStorage هنا، السيرفر سيتحقق من الكوكيز
    // لكن ممكن نتحقق شكلياً لتوجيه المستخدم
    if (!localStorage.getItem('userPhone')) {
        alert('يجب تسجيل الدخول لإضافة العقار للمفضلة.');
        window.location.href = 'login';
        return;
    }

    const isFavorite = btn.classList.contains('is-favorite');
    const method = isFavorite ? 'DELETE' : 'POST';
    // لا نرسل userEmail في الرابط أو الـ Body
    const url = isFavorite ? `/api/favorites/${propertyId}` : `/api/favorites`;
    const body = isFavorite ? null : JSON.stringify({ propertyId });

    try {
        const response = await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' }, 
            body 
        });

        if (response.status === 401) {
            alert('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.');
            window.location.href = 'login';
            return;
        }

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
window.shareProperty = async (title) => {
    const shareData = { title: `عقارك - ${title}`, text: `شاهد هذا العقار المميز على موقع عقارك: ${title}`, url: window.location.href };
    try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط!'); } } catch (err) { console.error('Error sharing:', err); }
};

window.handleWhatsappClick = async (link) => { window.open(link, '_blank'); };

// --- تحميل المشابه ---
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
        if (!similar || similar.length === 0) { container.innerHTML = '<p style="text-align:center; color:#777;">لا توجد عقارات مشابهة حالياً.</p>'; return; }
        container.innerHTML = ''; 
        similar.forEach(prop => {
            const price = window.formatPrice(prop.price, prop.type);
            let badges = ''; if(prop.isFeatured) badges = '<span style="position:absolute; top:10px; right:10px; background:#ffc107; color:black; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">مميز</span>';
            const card = `<div class="property-card neon-glow" onclick="window.location.href='property-details.html?id=${prop.id}'" style="position:relative; cursor:pointer;">${badges}<img src="${prop.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${prop.title}"><div class="card-content"><h4 style="font-size:1.1em; margin-bottom:5px;">${prop.title}</h4><p class="price" style="font-size:1.1em;">${price}</p><p style="font-size:0.85em; color:#888;"><i class="fas fa-bed"></i> ${prop.rooms} | <i class="fas fa-bath"></i> ${prop.bathrooms} | ${prop.area} م²</p></div></div>`;
            container.innerHTML += card;
        });
    } catch (e) { console.error("Error loading similar:", e); container.innerHTML = '<p>خطأ في تحميل الاقتراحات.</p>'; }
}

// === التنفيذ الرئيسي ===
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('property-detail-container');
    const loadingMessage = document.getElementById('loading-message');
    let currentImageIndex = 0;
    let imageUrls = [];

    const updateMainImage = (mainImage) => {
        if (imageUrls.length > 0) {
            mainImage.src = imageUrls[currentImageIndex];
            document.querySelectorAll('.thumbnail-image').forEach((thumb, index) => { thumb.classList.toggle('active', index === currentImageIndex); });
        }
    };

    try {
        let userRole = 'guest';
        // 🆕 جلب رقم المستخدم الحالي للمقارنة
        let currentUserPhone = localStorage.getItem('userPhone');

        try {
            const authRes = await fetch('/api/auth/me');
            const authData = await authRes.json();
            if (authData.isAuthenticated) {
                userRole = authData.role; 
                currentUserPhone = authData.phone; // تحديث الرقم من السيرفر للتأكد
            }
        } catch (e) { console.log("Guest"); }

        const userEmail = localStorage.getItem('userEmail');
        const canViewDetails = !!userEmail; 

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
            else if (typeof property.imageUrls === 'string') { try { imageUrls = JSON.parse(property.imageUrls); } catch (e) { imageUrls = [property.imageUrl]; } }
        }
        if (!imageUrls || imageUrls.length === 0) imageUrls = property.imageUrl ? [property.imageUrl] : ['https://via.placeholder.com/800x500.png?text=No+Image'];
        imageUrls = imageUrls.filter(u => u && u.trim() !== '');

        loadingMessage.style.display = 'none';

        // 🆕 منطق الواتساب: استخدام رقم المالك (sellerPhone)
        const ownerPhone = property.sellerPhone || "01008102237"; // fallback لرقمنا لو مفيش رقم
        const formattedOwnerPhone = ownerPhone.replace(/\D/g, '').startsWith('0') ? '2' + ownerPhone : ownerPhone;
        const whatsappLink = `https://wa.me/${formattedOwnerPhone}?text=${encodeURIComponent(`أنا مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`)}`;

        // 🆕 منطق زر التحكم للمالك
        let ownerControlsHTML = '';
        if (currentUserPhone && property.sellerPhone && currentUserPhone === property.sellerPhone) {
            const editMsg = encodeURIComponent(`السلام عليكم، أنا صاحب العقار كود (${property.hiddenCode}). أرغب في تعديله أو حذفه.`);
            const adminWaLink = `https://wa.me/201008102237?text=${editMsg}`;
            ownerControlsHTML = `
                <div style="margin-top: 15px; padding: 10px; border: 1px dashed #ff4444; border-radius: 8px; text-align: center;">
                    <p style="color: #ff4444; font-weight: bold; margin-bottom: 5px;">أنت صاحب هذا العقار 👑</p>
                    <a href="${adminWaLink}" target="_blank" class="btn-neon-red" style="display: block; text-decoration: none; padding: 10px;">
                        <i class="fas fa-cog"></i> تواصل للتعديل أو الحذف
                    </a>
                </div>
            `;
        }

        // 🆕 منطق "تم النشر بواسطة"
        let publisherHTML = '';
        if (property.publisherUsername) {
            publisherHTML = `
                <div class="publisher-info" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
                    <p style="color: #ccc;">
                        <i class="fas fa-user-circle"></i> تم النشر بواسطة: 
                        <a href="user-profile.html?u=${property.publisherUsername}" style="color: #00ff88; text-decoration: none; font-weight: bold;">${property.sellerName || 'مستخدم عقارك'}</a>
                    </p>
                </div>
            `;
        } else {
            publisherHTML = `
                <div class="publisher-info" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
                    <p style="color: #ccc;"><i class="fas fa-user-circle"></i> تم النشر بواسطة: ${property.sellerName || 'عقارك'}</p>
                </div>
            `;
        }

        let isFav = false;
        if (canViewDetails) {
            try {
                const favRes = await fetch(`/api/favorites`);
                if(favRes.ok) { const favs = await favRes.json(); isFav = favs.some(f => f.id === property.id); }
            } catch(e) {}
        }

        const favClass = isFav ? 'is-favorite' : '';
        const favIcon = isFav ? 'fas fa-heart' : 'far fa-heart';

        let actionSectionHTML = '';
        let makeOfferButtonHTML = '';

        if (canViewDetails) {
            makeOfferButtonHTML = `<button onclick="openOfferModal()" class="btn-offer"><i class="fas fa-hand-holding-usd"></i> قدم عرضك</button>`;
            actionSectionHTML = `
                <div class="action-buttons-group">
                    <button onclick="window.handleWhatsappClick('${whatsappLink}')" class="whatsapp-btn btn-neon-auth" style="flex:2; background-color: #25d366; color: white; border: none; box-shadow: 0 0 8px #25d366;">
                        <i class="fab fa-whatsapp"></i> تواصل مع المالك
                    </button>
                    <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--main-secondary); color:#fff; flex:1;">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                    <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth ${favClass}" style="flex:1;">
                        <i id="favIcon" class="${favIcon}"></i>
                    </button>
                </div>
                ${ownerControlsHTML}
            `;
        } else {
            actionSectionHTML = `<div class="login-prompt-box"><p>جاري تحميل الصلاحيات...</p></div>`;
        }

        // فيديو
        let videoSectionHTML = '';
        const videoList = Array.isArray(property.video_urls) ? property.video_urls : [];
        if (videoList.length > 0) {
            videoSectionHTML = `<div style="width: 100%; display: flex; justify-content: center; margin-bottom: 20px;"><button onclick="goToCinemaMode()" class="video-btn-modern"><div class="icon-pulse">▶</div><span>مشاهدة فيديو العقار</span><span class="badge">${videoList.length}</span></button></div>`;
            window.goToCinemaMode = () => { localStorage.setItem('activePropertyVideos', JSON.stringify(videoList)); window.location.href = 'video-player'; };
        }

        container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>
                ${property.isLegal ? `<div class="legal-trust-box neon-glow"><div class="legal-icon"><i class="fas fa-shield-alt"></i></div><div class="legal-content"><h4>عقار تم الفحص القانوني له ✅</h4><p>تمت مراجعة أوراق هذا العقار والتسلسل الملكي الخاص به بواسطة فريقنا القانوني.</p></div></div>` : ''}
                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info">
                            <p class="detail-price">${window.formatPrice(property.price, property.type)}</p>
                            ${makeOfferButtonHTML}
                        </div>
                        <div id="savings-calculator-box" class="savings-box-modern" style="display: none;">
                            <div class="savings-header-modern"><i class="fas fa-wallet"></i> ليه تدفع أكتر؟</div>
                            <div class="savings-body">
                                <div class="compare-row bad"><div class="label-col"><span class="icon">❌</span><span class="text" id="broker-label">عمولة المكاتب العادية (2.5%)</span></div><div class="value-col" id="broker-fee">0 ج.م</div></div>
                                <div class="compare-row good"><div class="label-col"><span class="icon">✅</span><span class="text" id="aqarak-label">عمولة موقع عقارك (1%)</span></div><div class="value-col" id="aqarak-fee">0 ج.م</div></div>
                            </div>
                            <div class="savings-footer"><span class="saved-label">💰 إجمالي توفيرك معنا:</span><span class="saved-value" id="total-saved-amount">0 ج.م</span></div>
                        </div>
                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#fff0f0; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <div style="color:#333; font-size:0.95rem;">
                                <p><strong>المالك:</strong> <span id="admin-owner-name">${property.sellerName || '-'}</span></p>
                                <p><strong>الهاتف:</strong> <span id="admin-owner-phone">${property.sellerPhone || '-'}</span></p>
                                <p><strong>الكود:</strong> <span>${property.hiddenCode}</span></p>
                            </div>
                        </div>
                        <div class="property-specs">
                            <ul class="specs-list">
                                <li><span>المساحة:</span> ${property.area} م² <i class="fas fa-ruler-combined"></i></li>
                                <li><span>الغرف:</span> ${property.rooms} <i class="fas fa-bed"></i></li>
                                <li><span>الحمامات:</span> ${property.bathrooms} <i class="fas fa-bath"></i></li>
                            </ul>
                        </div>
                        ${videoSectionHTML}
                        <div class="property-description-box"><h3>الوصف</h3><p>${property.description || 'لا يوجد وصف.'}</p></div>
                        ${publisherHTML}
                        ${actionSectionHTML}
                    </div>
                    <div class="image-gallery-frame neon-glow">
                        <div class="gallery-inner">
                            <div class="main-image-container"><img id="property-main-image" src="${imageUrls[0]}" class="main-image"><button id="prev-image" class="gallery-nav-btn prev-btn"><i class="fas fa-chevron-right"></i></button><button id="next-image" class="gallery-nav-btn next-btn"><i class="fas fa-chevron-left"></i></button></div>
                            <div id="image-thumbnails" class="image-thumbnails"></div>
                        </div>
                    </div>
                </div>
                <div class="similar-properties-section" style="margin-top: 50px;"><h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--main-secondary); display:inline-block; padding-bottom:5px;"><i class="fas fa-home"></i> عقارات مشابهة</h2><div id="similar-properties-container" class="listings-container"><p>جاري البحث...</p></div></div>
            </div>
        `;

        // حسابات التوفير
        const priceNum = parseFloat(String(property.price).replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNum) && priceNum > 0) {
            const expiryDate = new Date('2026-03-03'); const today = new Date();
            let aqarakRate = (today < expiryDate) ? 0 : 0.01;
            let aqarakLabelText = (today < expiryDate) ? 'عمولة موقع عقارك (0%) 🔥' : 'عمولة موقع عقارك (1%)';
            const propType = String(property.type || "").toLowerCase(); 
            const isRent = propType.includes('ايجار') || propType.includes('إيجار') || propType.includes('rent');
            let broker = isRent ? priceNum : priceNum * 0.025; 
            let brokerLabelText = isRent ? "عمولة السماسرة (شهر كامل)" : "عمولة المكاتب العادية (2.5%)";
            const aqarak = priceNum * aqarakRate; const saved = broker - aqarak;        
            document.getElementById('broker-fee').textContent = Math.round(broker).toLocaleString() + ' ج.م';
            document.getElementById('aqarak-fee').textContent = Math.round(aqarak).toLocaleString() + ' ج.م';
            document.getElementById('total-saved-amount').textContent = Math.round(saved).toLocaleString() + ' ج.م';
            document.getElementById('aqarak-label').textContent = aqarakLabelText;
            document.getElementById('broker-label').textContent = brokerLabelText;
            document.getElementById('savings-calculator-box').style.display = 'block';
        }

        // لوحة الأدمن
        if (userRole === 'admin') {
            const box = document.getElementById('admin-secret-box');
            if(box) {
                box.style.display = 'block';
                const controlsDiv = document.createElement('div');
                controlsDiv.style.marginTop = '10px'; controlsDiv.style.display = 'flex'; controlsDiv.style.gap = '10px';
                const createBadgeBtn = (text, isActive, color, onClick) => {
                    const btn = document.createElement('button'); btn.className = 'btn-neon-auth';
                    btn.style.fontSize = '0.7rem'; btn.style.padding = '5px 10px'; btn.style.background = isActive ? color : '#555';
                    btn.innerHTML = isActive ? `<i class="fas fa-check"></i> ${text}` : `تفعيل ${text}`; btn.onclick = onClick; return btn;
                };
                controlsDiv.appendChild(createBadgeBtn('مميز', property.isFeatured, '#ffc107', async () => { if(!confirm('تغيير حالة التميز؟')) return; await fetch(`/api/admin/toggle-badge/${property.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'isFeatured', value: !property.isFeatured }) }); location.reload(); }));
                controlsDiv.appendChild(createBadgeBtn('قانوني', property.isLegal, '#28a745', async () => { if(!confirm('تغيير حالة الفحص القانوني؟')) return; await fetch(`/api/admin/toggle-badge/${property.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'isLegal', value: !property.isLegal }) }); location.reload(); }));
                box.appendChild(controlsDiv);
            }
        }

        const mainImg = document.getElementById('property-main-image');
        const thumbsContainer = document.getElementById('image-thumbnails');
        const update = () => updateMainImage(mainImg);

        if (imageUrls.length > 1) {
            document.getElementById('prev-image').onclick = () => { currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length; update(); };
            document.getElementById('next-image').onclick = () => { currentImageIndex = (currentImageIndex + 1) % imageUrls.length; update(); };
        } else { document.querySelectorAll('.gallery-nav-btn').forEach(b => b.style.display = 'none'); }

        imageUrls.forEach((url, i) => {
            const img = document.createElement('img'); img.src = url; img.className = `thumbnail-image ${i===0?'active':''}`;
            img.onclick = () => { currentImageIndex = i; update(); }; thumbsContainer.appendChild(img);
        });

        const favBtn = document.getElementById('favoriteBtn');
        if (favBtn) favBtn.onclick = () => window.toggleFavorite(property.id);

        loadSimilarProperties(property);
        if(window.setupLightbox) window.setupLightbox(imageUrls);

        const offerForm = document.getElementById('offer-form');
        if (offerForm) {
            offerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = offerForm.querySelector('button'); const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...'; btn.disabled = true;
                const data = { propertyId: property.id, buyerName: document.getElementById('offer-name').value, buyerPhone: document.getElementById('offer-phone').value, offerPrice: document.getElementById('offer-price').value };
                try {
                    const res = await fetch('/api/make-offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const resData = await res.json();
                    if (res.ok) { alert('✅ ' + resData.message); window.closeOfferModal(); offerForm.reset(); } else { throw new Error(resData.message); }
                } catch (error) { alert('❌ خطأ: ' + error.message); } finally { btn.innerHTML = originalText; btn.disabled = false; }
            });
        }

    } catch (error) { console.error(error); container.innerHTML = `<p class="error">خطأ: ${error.message}</p>`; loadingMessage.style.display = 'none'; }
});

window.setupLightbox = (images) => {
    const lightbox = document.getElementById('lightbox-modal'); const lightboxImg = document.getElementById('lightbox-img');
    const counter = document.querySelector('.lightbox-counter'); const closeBtn = document.querySelector('.close-lightbox');
    const nextBtn = document.querySelector('.next-lightbox'); const prevBtn = document.querySelector('.prev-lightbox');
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