import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// (Supabase Config)
const supabaseUrl = 'https://scncapmhnshjpocenqpm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmNhcG1obnNoanBvY2VucXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQyNTcsImV4cCI6MjA3OTM3MDI1N30.HHyZ73siXlTCVrp9I8qxAm4aMfx3R9r1sYvNWzBh9dI'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- 1. Style Injection (حقن الستايلات الخاصة بالجافاسكريبت) ---
const style = document.createElement('style');
style.innerHTML = `
    /* تصميم مودال الحالة (Success/Error) */
    .status-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); z-index: 10000; display: flex;
        justify-content: center; align-items: center; backdrop-filter: blur(5px);
    }
    .status-modal-content {
        background: #1c2630; padding: 30px; border-radius: 20px;
        width: 90%; max-width: 400px; text-align: center;
        border: 1px solid #333; position: relative;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    }
    .status-icon-box {
        font-size: 3.5rem; margin-bottom: 20px;
    }
    .status-note-box {
        background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;
        margin: 20px 0; text-align: right; border-right: 4px solid;
    }
    .btn-status-action {
        width: 100%; padding: 15px; border-radius: 50px; border: none;
        font-weight: bold; font-size: 1.1rem; cursor: pointer; margin-top: 10px;
    }
    
    /* زر الفيديو الحديث */
    .video-btn-modern {
        background: linear-gradient(135deg, #ff0000, #c0392b);
        color: white; border: none; padding: 12px 30px; border-radius: 50px;
        display: flex; align-items: center; gap: 15px; cursor: pointer;
        font-size: 1.1rem; font-weight: bold; box-shadow: 0 10px 20px rgba(192, 57, 43, 0.4);
        transition: all 0.3s ease; margin: 20px auto; width: fit-content; text-decoration: none;
    }
    .video-btn-modern:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(192, 57, 43, 0.6); }
    
    /* صندوق الزائر */
    .guest-action-box {
        text-align: center; padding: 30px 20px; background: rgba(255, 255, 255, 0.03);
        border: 1px dashed #00ff88; border-radius: 15px; margin-top: 20px;
    }
    .guest-btns-wrapper {
        display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap;
    }
    .btn-login-action {
        background: transparent; border: 2px solid #00ff88; color: #00ff88;
        padding: 10px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; transition: 0.3s;
    }
    .btn-login-action:hover { background: #00ff88; color: #000; }
    .btn-register-action {
        background: #00ff88; border: 2px solid #00ff88; color: #000;
        padding: 10px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; transition: 0.3s;
    }
    .btn-register-action:hover { background: transparent; color: #00ff88; }

    /* مودال التعديل والصور */
    .edit-modal-overlay {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    }
    .edit-modal-content {
        background: #1c2630; padding: 25px; border-radius: 15px; border: 1px solid #00ff88;
        width: 95%; max-width: 600px; box-shadow: 0 0 30px rgba(0, 255, 136, 0.15);
        max-height: 90vh; overflow-y: auto;
    }
    .edit-input-group { margin-bottom: 15px; }
    .edit-input-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 0.9rem; font-weight: bold; }
    .edit-input { 
        width: 100%; padding: 12px; background: #2a3b4c; border: 1px solid #444; 
        color: #fff; border-radius: 8px; outline: none; font-size: 1rem; transition: 0.3s;
    }
    .edit-input:focus { border-color: #00ff88; box-shadow: 0 0 8px rgba(0,255,136,0.2); }
    .edit-actions { display: flex; gap: 10px; margin-top: 25px; }
    .btn-save { background: linear-gradient(45deg, #00ff88, #00cc6a); color: #000; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 2; transition: 0.3s; }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,255,136,0.3); }
    .btn-cancel { background: #ff4444; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; transition: 0.3s; }
    .btn-cancel:hover { background: #cc0000; }

    /* شبكة الصور في التعديل */
    .img-grid-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .img-box { position: relative; width: 100px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #444; transition: 0.3s; }
    .img-box img { width: 100%; height: 100%; object-fit: cover; }
    .img-box:hover { border-color: #00ff88; }
    .delete-img-btn { 
        position: absolute; top: 2px; right: 2px; background: rgba(255,68,68,0.9); color: white; 
        border: none; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; z-index: 10;
    }
    .delete-img-btn:hover { background: #ff0000; transform: scale(1.1); }
`;
document.head.appendChild(style);

// --- 2. Helper Functions ---
window.formatPrice = (price, type) => {
    if (!price) return 'N/A';
    const formatted = parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 });
    return `<span class="detail-price">${formatted}</span> ${type === 'rent' || type === 'إيجار' ? '/ شهرياً' : ''}`;
};

window.getTypeTag = (type) => {
    if (type === 'buy' || type === 'شراء' || type === 'بيع') return `<span class="property-type sale">للبيع</span>`;
    else if (type === 'rent' || type === 'إيجار') return `<span class="property-type rent">للإيجار</span>`;
    return '';
};

window.openOfferModal = () => { document.getElementById('offer-modal').style.display = 'flex'; };
window.closeOfferModal = () => { document.getElementById('offer-modal').style.display = 'none'; };

// --- 3. Favorites Logic ---
window.toggleFavorite = async (propertyId) => {
    const btn = document.getElementById('favoriteBtn');
    const favIcon = btn.querySelector('i');
    const isFavorite = btn.classList.contains('is-favorite');
    const method = isFavorite ? 'DELETE' : 'POST';
    const url = isFavorite ? `/api/favorites/${propertyId}` : `/api/favorites`;
    const body = isFavorite ? null : JSON.stringify({ propertyId });

    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        if (response.status === 401) {
            alert('يجب تسجيل الدخول لإضافة العقار للمفضلة.');
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

// --- 4. Sharing Logic ---
window.shareProperty = async (title) => {
    const shareData = { title: `عقارك - ${title}`, text: `شاهد هذا العقار المميز على موقع عقارك: ${title}`, url: window.location.href };
    try { 
        if (navigator.share) await navigator.share(shareData); 
        else { await navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط!'); } 
    } catch (err) { console.error('Error sharing:', err); }
};

window.handleWhatsappClick = async (link) => { window.open(link, '_blank'); };

// --- 5. Similar Properties Logic ---
async function loadSimilarProperties(currentProperty) {
    const container = document.getElementById('similar-properties-container');
    if (!container) return;

    try {
        const response = await fetch(`/api/properties/similar/${currentProperty.id}`);
        if (!response.ok) throw new Error('فشل جلب البيانات');
        const similar = await response.json();

        if (!similar || similar.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777;">لا توجد عقارات مشابهة حالياً.</p>';
            return;
        }

        container.innerHTML = ''; 
        similar.forEach(prop => {
            const priceVal = prop.price ? Number(prop.price.replace(/[^0-9.]/g, '')).toLocaleString() : 'N/A';
            let badges = ''; 
            if(prop.isFeatured) badges = '<span style="position:absolute; top:10px; right:10px; background:#ffc107; color:black; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; z-index:2;">مميز</span>';

            const card = `
                <div class="property-card neon-glow" onclick="window.location.href='property-details.html?id=${prop.id}'" style="position:relative; cursor:pointer;">
                    ${badges}
                    <div style="height:200px; overflow:hidden;">
                        <img src="${prop.imageUrl || 'logo.png'}" alt="${prop.title}" style="width:100%; height:100%; object-fit:cover; transition:0.3s;">
                    </div>
                    <div class="card-content">
                        <h4 style="font-size:1.1em; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prop.title}</h4>
                        <p class="price" style="font-size:1.1em; color:#ffd700;">${priceVal} ج.م</p>
                        <p style="font-size:0.85em; color:#aaa; margin-top:5px;">
                            <i class="fas fa-map-marker-alt"></i> مشابه لمنطقتك
                        </p>
                        <hr style="border-color:#333; margin:10px 0;">
                        <p style="font-size:0.85em; color:#888; display:flex; justify-content:space-between;">
                            ${prop.rooms > 0 ? `<span><i class="fas fa-bed"></i> ${prop.rooms}</span>` : ''}
                            ${prop.bathrooms > 0 ? `<span><i class="fas fa-bath"></i> ${prop.bathrooms}</span>` : ''}
                            <span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>
                        </p>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (e) {
        console.error("Error loading similar:", e);
        container.innerHTML = '<p style="text-align:center; color:#777;">جاري البحث عن عقارات مشابهة...</p>';
    }
}

// --- 6. Auto-fill User Data ---
async function prefillUserData() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.isAuthenticated) {
            const nameInput = document.getElementById('offer-name');
            const phoneInput = document.getElementById('offer-phone');
            
            if (nameInput && data.name) nameInput.value = data.name;
            if (phoneInput && data.phone) phoneInput.value = data.phone;
        }
    } catch (e) { console.error("Error prefilling user data", e); }
}

// === 7. Main Execution (DOMContentLoaded) ===
document.addEventListener('DOMContentLoaded', async () => {
    prefillUserData();
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
        let currentUserPhone = null;
        let isAuthenticated = false;

        // Auth Check
        try {
            const authRes = await fetch('/api/auth/me');
            const authData = await authRes.json();
            if (authData.isAuthenticated) {
                userRole = authData.role; 
                currentUserPhone = authData.phone;
                isAuthenticated = true; 
            }
        } catch (e) { console.log("Guest User"); }

        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id'); 
        if (!propertyId) throw new Error('رابط غير صالح.');

        const response = await fetch(`/api/property/${propertyId}`);
        if (!response.ok) throw new Error('العقار غير موجود.');

        const property = await response.json(); 

        // Images Processing
        imageUrls = [];
        if (property.imageUrls) {
            if (Array.isArray(property.imageUrls)) imageUrls = property.imageUrls;
            else if (typeof property.imageUrls === 'string') { try { imageUrls = JSON.parse(property.imageUrls); } catch (e) { imageUrls = [property.imageUrl]; } }
        }
        if (!imageUrls || imageUrls.length === 0) imageUrls = property.imageUrl ? [property.imageUrl] : ['logo.png'];
        imageUrls = imageUrls.filter(u => u && u.trim() !== '');

        if (loadingMessage) loadingMessage.style.display = 'none';

        // Contact Info
        const ownerPhone = property.sellerPhone || "01008102237"; 
        const formattedOwnerPhone = ownerPhone.replace(/\D/g, '').startsWith('0') ? '2' + ownerPhone : ownerPhone;
        const whatsappLink = `https://wa.me/${formattedOwnerPhone}?text=${encodeURIComponent(`أنا مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`)}`;

       // Publisher Info
        let publisherHTML = '';
        let publisherStatsBadge = '';

        if (property.publisherUsername) {
            try {
                const statsRes = await fetch(`/api/public/profile/${property.publisherUsername}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    const count = statsData.properties ? statsData.properties.length : 0;
                    
                    publisherStatsBadge = `
                        <a href="user-profile.html?u=${property.publisherUsername}" style="
                            background: rgba(0, 255, 136, 0.1); 
                            color: #00ff88; 
                            padding: 2px 8px; 
                            border-radius: 12px; 
                            font-size: 0.8rem; 
                            margin-right: 10px; 
                            border: 1px solid #00ff88;
                            text-decoration: none;
                            cursor: pointer;
                            transition: 0.3s;">
                            <i class="fas fa-building"></i> ${count} عقار منشور
                        </a>
                    `;
                }
            } catch (e) { console.error("Error fetching publisher stats", e); }

            publisherHTML = `
                <div class="publisher-info" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
                    <p style="color: #ccc; display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <span><i class="fas fa-user-circle"></i> تم النشر بواسطة:</span>
                        <a href="user-profile.html?u=${property.publisherUsername}" style="color: #00ff88; text-decoration: none; font-weight: bold;">
                            ${property.sellerName || 'مستخدم عقارك'}
                        </a>
                        ${publisherStatsBadge}
                    </p>
                </div>
            `;
        } else {
            publisherHTML = `
                <div class="publisher-info" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
                    <p style="color: #ccc;">
                        <i class="fas fa-user-circle"></i> تم النشر بواسطة: ${property.sellerName || 'عقارك'}
                    </p>
                </div>
            `;
        }

        // Action Buttons Logic
        let actionSectionHTML = '';
        let makeOfferButtonHTML = '';

        if (isAuthenticated) {
            const negOwnerPhone = property.sellerPhone ? (property.sellerPhone.replace(/\D/g, '').startsWith('0') ? '2' + property.sellerPhone : property.sellerPhone) : "201008102237";
            const negLink = `https://wa.me/${negOwnerPhone}?text=${encodeURIComponent(`سلام عليكم، كنت محتاج أتفاوض بخصوص السعر للعقار: ${property.title}`)}`;

            makeOfferButtonHTML = `
                <button onclick="window.handleWhatsappClick('${negLink}')" class="btn-offer" style="background: linear-gradient(45deg, #ff9800, #ff5722); color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-handshake"></i> تفاوض
                </button>
            `;
            
            // Owner/Admin Controls
            let ownerControlsHTML = '';
            const isOwner = (currentUserPhone && property.sellerPhone && currentUserPhone === property.sellerPhone);
            const isAdmin = (userRole === 'admin');

            if (isOwner || isAdmin) {
                const controlTitle = isAdmin ? 'تحكم الإدارة 🛡️' : 'أنت صاحب هذا العقار 👑';
                ownerControlsHTML = `
                    <div style="margin-top: 20px; padding: 15px; border: 1px solid ${isAdmin ? '#e91e63' : '#00ff88'}; border-radius: 10px; background: rgba(0, 0, 0, 0.2); text-align: center;">
                        <p style="color: ${isAdmin ? '#e91e63' : '#00ff88'}; font-weight: bold; margin-bottom: 15px;">
                            ${controlTitle}
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="openEditPropertyModal()" class="btn-neon-auth" style="background: #2196F3; border-color: #2196F3; color: white; flex: 1;">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button onclick="deleteProperty(${property.id})" class="btn-neon-auth" style="background: #ff4444; border-color: #ff4444; color: white; flex: 1;">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                `;
                injectEditModal(property);
            }

            let isFav = false;
            try { const favRes = await fetch(`/api/favorites`); if(favRes.ok) { const favs = await favRes.json(); isFav = favs.some(f => f.id === property.id); } } catch(e) {}
            const favClass = isFav ? 'is-favorite' : '';
            const favIcon = isFav ? 'fas fa-heart' : 'far fa-heart';

            actionSectionHTML = `
                <div class="action-buttons-group">
                    <button onclick="window.handleWhatsappClick('${whatsappLink}')" class="whatsapp-btn btn-neon-auth" style="flex:2; background-color: #25d366; color: white; border: none; box-shadow: 0 0 8px #25d366;">
                        <i class="fab fa-whatsapp"></i> تواصل مع المالك
                    </button>
                    <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--neon-secondary); color:#fff; flex:1;">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                    <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth ${favClass}" style="flex:1;">
                        <i id="favIcon" class="${favIcon}"></i>
                    </button>
                </div>
                ${ownerControlsHTML}
            `;
        } else {
            actionSectionHTML = `
                <div class="guest-action-box">
                    <p style="color:#ccc; margin-bottom:15px; font-size:0.95rem;">
                        <i class="fas fa-lock" style="color:#00ff88; margin-left:5px;"></i> يجب تسجيل الدخول للتواصل مع المالك.
                    </p>
                    <div class="guest-btns-wrapper">
                        <a href="login" class="btn-login-action">تسجيل دخول</a>
                        <a href="register" class="btn-register-action">إنشاء حساب</a>
                    </div>
                </div>
            `;
        }

        // Video Section
        let videoSectionHTML = '';
        const videoList = Array.isArray(property.video_urls) ? property.video_urls : [];
        if (videoList.length > 0) {
            videoSectionHTML = `<div style="width: 100%; display: flex; justify-content: center; margin-bottom: 20px;"><button onclick="goToCinemaMode()" class="video-btn-modern"><div class="icon-pulse">▶</div><span>مشاهدة فيديو العقار</span><span class="badge" style="background:white; color:red; padding:2px 6px; border-radius:50%; font-size:0.8rem; margin-right:5px;">${videoList.length}</span></button></div>`;
            window.goToCinemaMode = () => { localStorage.setItem('activePropertyVideos', JSON.stringify(videoList)); window.location.href = 'video-player'; };
        }

        // Specs List
        let specsHTML = `<li><span>المساحة:</span> ${property.area} م² <i class="fas fa-ruler-combined"></i></li>`;
        if (property.rooms && parseInt(property.rooms) > 0) specsHTML += `<li><span>الغرف:</span> ${property.rooms} <i class="fas fa-bed"></i></li>`;
        if (property.bathrooms && parseInt(property.bathrooms) > 0) specsHTML += `<li><span>الحمامات:</span> ${property.bathrooms} <i class="fas fa-bath"></i></li>`;
        if (property.level && property.level !== 'undefined') specsHTML += `<li><span>الدور:</span> ${property.level} <i class="fas fa-layer-group"></i></li>`;
        if (property.floors_count && parseInt(property.floors_count) > 0) specsHTML += `<li><span>عدد الأدوار:</span> ${property.floors_count} <i class="fas fa-building"></i></li>`;
        if (property.finishing_type && property.finishing_type !== 'undefined') specsHTML += `<li><span>التشطيب:</span> ${property.finishing_type} <i class="fas fa-paint-roller"></i></li>`;

        // ✅ HTML Rendering
        container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(property.type)}</h1>
                ${property.isLegal ? `<div class="legal-trust-box neon-glow"><div class="legal-icon"><i class="fas fa-shield-alt"></i></div><div class="legal-content"><h4>عقار تم الفحص القانوني له ✅</h4><p>تمت مراجعة أوراق هذا العقار.</p></div></div>` : ''}
                
                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info" style="display:flex; justify-content:space-between; align-items:center;">
                            <p class="detail-price" style="margin:0;">${window.formatPrice(property.price, property.type)}</p>
                            ${makeOfferButtonHTML}
                        </div>

                         <div style="margin: 10px 0;">
                            ${property.isFeatured ? '<span class="badge-featured-main"><i class="fas fa-star"></i> عقار مميز</span>' : ''}
                        </div>
                        
                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#fff0f0; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <div style="color:#333; font-size:0.95rem;">
                                <p><strong>المالك:</strong> <span>${property.sellerName || '-'}</span></p>
                                <p><strong>الهاتف:</strong> <span>${property.sellerPhone || '-'}</span></p>
                                <p><strong>الكود:</strong> <span>${property.hiddenCode}</span></p>
                            </div>
                        </div>

                        <div class="property-specs">
                            <ul class="specs-list">
                                ${specsHTML}
                            </ul>
                        </div>

                        ${videoSectionHTML}
                        
                        <div class="property-description-box" style="margin-top:20px;">
                            <h3 style="color:#00ff88; margin-bottom:10px;">الوصف</h3>
                            <p style="color:#ccc; line-height:1.6;">${property.description || 'لا يوجد وصف.'}</p>
                        </div>
                        
                        ${publisherHTML}
                        ${actionSectionHTML}
                    </div>
                    
                    <div class="image-gallery-frame neon-glow">
                        <div class="gallery-inner">
                            <div class="main-image-container">
                                <img id="property-main-image" src="${imageUrls[0]}" class="main-image">
                                ${imageUrls.length > 1 ? `<button id="prev-image" class="gallery-nav-btn prev-btn"><i class="fas fa-chevron-right"></i></button><button id="next-image" class="gallery-nav-btn next-btn"><i class="fas fa-chevron-left"></i></button>` : ''}
                            </div>
                            <div id="image-thumbnails" class="image-thumbnails"></div>
                        </div>
                    </div>
                </div>
                
                <div class="similar-properties-section" style="margin-top: 50px;">
                    <h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--neon-secondary); display:inline-block; padding-bottom:5px; color:white;">
                        <i class="fas fa-home"></i> عقارات مشابهة
                    </h2>
                    <div id="similar-properties-container" class="listings-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
                        <p>جاري البحث...</p>
                    </div>
                </div>
            </div>
        `;

        // Admin Badge Controls
        if (userRole === 'admin') {
            const box = document.getElementById('admin-secret-box');
            if(box) {
                box.style.display = 'block';
                const controlsDiv = document.createElement('div');
                controlsDiv.style.marginTop = '10px'; controlsDiv.style.display = 'flex'; controlsDiv.style.gap = '10px';
                
                const createBadgeBtn = (text, isActive, color, onClick) => {
                    const btn = document.createElement('button'); btn.className = 'btn-neon-auth';
                    btn.style.fontSize = '0.7rem'; btn.style.padding = '5px 10px'; btn.style.background = isActive ? color : '#555';
                    btn.style.color = isActive ? '#000' : '#fff';
                    btn.innerHTML = isActive ? `<i class="fas fa-check"></i> ${text}` : `تفعيل ${text}`; btn.onclick = onClick; return btn;
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

        // Image Gallery Logic
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

        // Offer Form Logic
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

    } catch (error) { console.error(error); container.innerHTML = `<p class="error">خطأ: ${error.message}</p>`; if(loadingMessage) loadingMessage.style.display = 'none'; }
});

// ============================================================
// 🛠️ Edit Modal Functions (إدارة الصور والتعديل)
// ============================================================
let currentEditImages = []; 
let newEditFiles = [];

function injectEditModal(prop) {
    currentEditImages = [];
    newEditFiles = [];
    try {
        if(Array.isArray(prop.imageUrls)) currentEditImages = prop.imageUrls;
        else if(prop.imageUrls) currentEditImages = JSON.parse(prop.imageUrls);
        else if(prop.imageUrl) currentEditImages = [prop.imageUrl];
    } catch (e) { currentEditImages = []; }

    // إزالة أي مودال قديم
    const oldModal = document.getElementById('edit-modal');
    if(oldModal) oldModal.remove();

    const modalHTML = `
        <div id="edit-modal" class="edit-modal-overlay">
            <div class="edit-modal-content">
                <h3 style="color:#00ff88; margin-bottom:20px; text-align:center;">تعديل بيانات العقار</h3>
                
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px dashed #555;">
                    <label style="color: #00ff88; font-weight: bold; display: block; margin-bottom: 10px;">📸 صور العقار الحالية</label>
                    <div id="edit-images-container" class="img-grid-container"></div>
                    
                    <input type="file" id="new-images-input" multiple accept="image/*" style="display: none;">
                    <button type="button" onclick="document.getElementById('new-images-input').click()" 
                        class="btn-login-action" style="width: 100%; border-color: #2196F3; color: #2196F3; margin-top: 15px;">
                        <i class="fas fa-plus-circle"></i> إضافة صور جديدة
                    </button>
                </div>

                <form id="edit-property-form">
                    <div class="edit-input-group">
                        <label>العنوان</label>
                        <input type="text" name="title" class="edit-input" value="${prop.title}" required>
                    </div>
                    <div class="edit-input-group">
                        <label>السعر</label>
                        <input type="text" name="price" class="edit-input" value="${prop.price}" required>
                    </div>
                    <div class="edit-input-group" style="display:flex; gap:10px;">
                        <div style="flex:1;">
                            <label>المساحة</label>
                            <input type="number" name="area" class="edit-input" value="${prop.area}" required>
                        </div>
                        <div style="flex:1;">
                            <label>الغرف</label>
                            <input type="number" name="rooms" class="edit-input" value="${prop.rooms}">
                        </div>
                        <div style="flex:1;">
                            <label>الحمامات</label>
                            <input type="number" name="bathrooms" class="edit-input" value="${prop.bathrooms}">
                        </div>
                    </div>
                    <div class="edit-input-group">
                        <label>الوصف</label>
                        <textarea name="description" class="edit-input" rows="4">${prop.description}</textarea>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="btn-save">حفظ التعديلات</button>
                        <button type="button" onclick="closeEditModal()" class="btn-cancel">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    renderEditImages();

    document.getElementById('new-images-input').addEventListener('change', (e) => {
        newEditFiles = [...newEditFiles, ...Array.from(e.target.files)];
        renderEditImages();
        e.target.value = '';
    });

    document.getElementById('edit-property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-save');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...'; 
        btn.disabled = true;

        const formData = new FormData();
        formData.append('title', e.target.title.value);
        formData.append('price', e.target.price.value);
        formData.append('area', e.target.area.value);
        formData.append('rooms', e.target.rooms.value);
        formData.append('bathrooms', e.target.bathrooms.value);
        formData.append('description', e.target.description.value);
        
        formData.append('keptImages', JSON.stringify(currentEditImages));
        newEditFiles.forEach(file => formData.append('newImages', file));

        try {
            const res = await fetch(`/api/user/property/${prop.id}`, { method: 'PUT', body: formData });
            const data = await res.json();
            
            closeEditModal(); 

            if (res.ok) {
                window.showStatusModal('success', 'تم التعديل بنجاح!', 'تم تحديث بيانات العقار ونشره.');
            } else {
                if (data.status === 'rejected') {
                    window.showStatusModal('rejected', 'عذراً، التعديل مرفوض', 'يحتوي التعديل على مخالفة لسياسات النشر.', data.reason);
                } else {
                    alert('❌ ' + (data.message || 'حدث خطأ ما'));
                }
            }
        } catch (err) { console.error(err); alert('خطأ في الاتصال'); } 
        finally { if(document.querySelector('.btn-save')) { btn.innerHTML = originalText; btn.disabled = false; } }
    });
}

function renderEditImages() {
    const container = document.getElementById('edit-images-container');
    container.innerHTML = '';

    currentEditImages.forEach((url, index) => {
        const div = document.createElement('div'); div.className = 'img-box';
        div.innerHTML = `<img src="${url}"><button type="button" onclick="removeOldImage(${index})" class="delete-img-btn"><i class="fas fa-times"></i></button>`;
        container.appendChild(div);
    });

    newEditFiles.forEach((file, index) => {
        const div = document.createElement('div'); div.className = 'img-box';
        div.style.borderColor = '#00ff88';
        const img = document.createElement('img'); img.style.opacity = '0.7';
        div.appendChild(img);
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        div.innerHTML += `<button type="button" onclick="removeNewFile(${index})" class="delete-img-btn"><i class="fas fa-times"></i></button>`;
        container.appendChild(div);
    });
}

// Window scoped functions
window.removeOldImage = (index) => { currentEditImages.splice(index, 1); renderEditImages(); };
window.removeNewFile = (index) => { newEditFiles.splice(index, 1); renderEditImages(); };
window.openEditPropertyModal = () => { document.getElementById('edit-modal').style.display = 'flex'; };
window.closeEditModal = () => { document.getElementById('edit-modal').style.display = 'none'; };

window.deleteProperty = async (id) => {
    if (!confirm('هل أنت متأكد تماماً من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
        const res = await fetch(`/api/user/property/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) { alert('🗑️ تم حذف العقار بنجاح.'); window.location.href = 'home'; } 
        else { alert('❌ فشل الحذف: ' + data.message); }
    } catch (err) { alert('خطأ في الاتصال بالسيرفر'); }
};

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

// Show Status Modal Helper
window.showStatusModal = (type, title, subtitle, note = '') => {
    const isSuccess = type === 'success';
    const isRejected = type === 'rejected';
    const icon = isSuccess ? 'fas fa-check-circle' : (isRejected ? 'fas fa-times-circle' : 'fas fa-clipboard-check');
    const color = isSuccess ? '#00ff88' : (isRejected ? '#ff4444' : '#ff9800'); 
    
    const oldModal = document.getElementById('status-modal'); if (oldModal) oldModal.remove();

    const modalHTML = `
        <div id="status-modal" class="status-modal-overlay">
            <div class="status-modal-content" style="border-color: ${color};">
                <div class="status-icon-box" style="color: ${color};"><i class="${icon}"></i></div>
                <h2 style="color: white; margin-bottom: 10px;">${title}</h2>
                <p style="color: #ccc; font-size: 0.95rem; margin-bottom: 20px;">${subtitle}</p>
                ${note ? `<div class="status-note-box" style="border-color: ${color};"><strong style="color: #fff; display:block; margin-bottom:5px;">💡 ملحوظة:</strong><span style="color: #ddd; font-size: 0.9rem;">${note}</span></div>` : ''}
                <button onclick="document.getElementById('status-modal').remove(); window.location.reload();" class="btn-status-action" style="background: linear-gradient(90deg, ${color}, #444); color: white;">${isSuccess ? 'تم' : 'إغلاق'}</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};