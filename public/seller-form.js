// مصفوفة لتخزين الملفات المختارة (عشان نعرف نمسح منها براحتنا)
let selectedFiles = []; 
let map, marker, circle;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب بيانات المستخدم وتعبئة الحقول تلقائياً
    await fetchUserData();

    // 2. تفعيل منطق الحقول (إظهار/إخفاء الحقول حسب نوع العقار)
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields(); // تشغيل مرة واحدة في البداية
    }

    // 3. 🌍 تهيئة الخريطة والبحث
    initMap();
});

// ==========================================================
// 🌍 منطق الخريطة والبحث الذكي (Map & Smart Search)
// ==========================================================
function initMap() {
    // إحداثيات افتراضية (القاهرة)
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    // استخدام CartoDB Voyager (خريطة عصرية ونظيفة)
    map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // عند الضغط على الخريطة يدوياً
    map.on('click', async function(e) {
        handleLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // تفعيل البحث عند الضغط على Enter
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // منع إرسال الفورم
                searchLocation();
            }
        });
        
        // إخفاء الاقتراحات عند الكتابة من جديد
        searchInput.addEventListener('input', function() {
            if(this.value.length < 3) document.getElementById('search-suggestions').style.display = 'none';
        });
    }
}

// دالة موحدة لاختيار الموقع (سواء بالبحث أو الكليك)
async function handleLocationSelect(lat, lng) {
    // 1. نقل الخريطة
    map.setView([lat, lng], 17); // زوم قريب
    
    // 2. وضع الدبوس والدائرة
    if (marker) map.removeLayer(marker);
    if (circle) map.removeLayer(circle);

    marker = L.marker([lat, lng]).addTo(map).bindPopup("الموقع المحدد ✅").openPopup();
    circle = L.circle([lat, lng], { color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.1, radius: 500 }).addTo(map);
    
    // 3. تخزين القيم في الحقول المخفية
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    // 4. إخفاء قائمة الاقتراحات
    document.getElementById('search-suggestions').style.display = 'none';

    // 5. تشغيل تحليل الخدمات الذكي 🧠
    await fetchNearbyServices(lat, lng);
}

// 🔍 دالة البحث عن مكان بالاسم (Nominatim API)
async function searchLocation() {
    const query = document.getElementById('map-search-input').value;
    const suggestionsBox = document.getElementById('search-suggestions');
    
    if (!query) return;

    // استخدام Nominatim API (مجاني) للبحث في مصر
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Egypt')}&addressdetails=1&limit=5&accept-language=ar`;

    try {
        suggestionsBox.innerHTML = '<div class="suggestion-item" style="justify-content:center;"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';
        suggestionsBox.style.display = 'block';

        const response = await fetch(url);
        const data = await response.json();

        suggestionsBox.innerHTML = ''; // مسح القديم

        if (data.length === 0) {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#ff4444; justify-content:center;">لم يتم العثور على نتائج.</div>';
            return;
        }

        data.forEach(place => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            // عرض اسم المكان بشكل منسق
            // نحاول ناخد الاسم الأول + اسم المدينة/الحي
            let displayName = place.display_name.split(',')[0];
            const address = place.address || {};
            if(address.city || address.town || address.suburb) {
                displayName += `، ${address.city || address.town || address.suburb}`;
            }

            div.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${displayName}</span>`;
            
            div.onclick = () => {
                document.getElementById('map-search-input').value = displayName; // وضع الاسم في الحقل
                handleLocationSelect(place.lat, place.lon); // الذهاب للموقع
            };
            suggestionsBox.appendChild(div);
        });

    } catch (error) {
        console.error("Search Error:", error);
        suggestionsBox.style.display = 'none';
    }
}

// زرار "موقعي الحالي"
window.locateUser = function() {
    const btn = document.querySelector('.locate-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديد...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            handleLocationSelect(latitude, longitude);
            btn.innerHTML = originalText;
        }, () => { 
            alert("تعذر تحديد الموقع. تأكد من تفعيل الـ GPS والسماح للمتصفح."); 
            btn.innerHTML = originalText;
        });
    } else { 
        alert("المتصفح لا يدعم تحديد الموقع."); 
        btn.innerHTML = originalText;
    }
};

// 🤖 البحث الذكي عن الخدمات (Overpass API)
async function fetchNearbyServices(lat, lng) {
    const statusMsg = document.getElementById('map-status-text');
    statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري مسح المنطقة والبحث عن الخدمات القريبة (مدارس، جوامع، ماركت)...';
    statusMsg.style.color = '#00d4ff';

    // استعلام موسع يشمل الخدمات الحيوية في مصر
    const query = `
        [out:json];
        (
          node["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          way["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          node["shop"~"supermarket|mall|bakery|clothes|convenience"](around:800, ${lat}, ${lng});
          way["shop"~"supermarket|mall|bakery|clothes|convenience"](around:800, ${lat}, ${lng});
          node["leisure"~"park|fitness_centre|sports_centre"](around:800, ${lat}, ${lng});
        );
        out center 15; 
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        const data = await response.json();
        
        const services = new Set();
        data.elements.forEach(el => {
            let name = el.tags['name:ar'] || el.tags.name || null;
            let type = el.tags.amenity || el.tags.shop || el.tags.leisure;

            // ترجمة بسيطة للأنواع لو الاسم مش موجود
            if (!name && type) {
                if(type === 'place_of_worship') name = 'مسجد/كنيسة';
                else if(type === 'school') name = 'مدرسة';
                else if(type === 'pharmacy') name = 'صيدلية';
                else if(type === 'supermarket' || type === 'convenience') name = 'سوبر ماركت';
                else if(type === 'bakery') name = 'مخبز';
                else name = type;
            }

            if (name) services.add(name);
        });

        // تحويلها لنص
        const servicesArray = Array.from(services).slice(0, 12); // ناخد أهم 12
        const servicesString = servicesArray.join(', ');
        
        document.getElementById('nearby_services').value = servicesString;

        if (servicesArray.length > 0) {
            statusMsg.innerHTML = `✅ تم العثور على ${servicesArray.length} خدمات: (${servicesArray.slice(0, 3).join('، ')}...)`;
            statusMsg.style.color = '#00ff88';
        } else {
            statusMsg.innerHTML = '⚠️ لم يتم العثور على خدمات مسجلة قريبة، سيتم الاعتماد على الموقع فقط.';
            statusMsg.style.color = '#ff9800';
        }

    } catch (error) {
        console.error("Error fetching services:", error);
        statusMsg.innerText = "فشل التحليل التلقائي. سيتم حفظ الموقع فقط.";
    }
}

// ==========================================================
// 👤 دالة جلب بيانات المستخدم
// ==========================================================
async function fetchUserData() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            const nameField = document.getElementById('seller-name');
            if (nameField) nameField.value = data.name || 'مستخدم عقارك';
            const phoneField = document.getElementById('seller-phone');
            if (phoneField) phoneField.value = data.phone || '';
        } else {
            window.location.href = 'index'; 
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// ==========================================================
// 📸 منطق الصور (معاينة + حذف)
// ==========================================================
const imgInput = document.getElementById('property-images');

if (imgInput) {
    imgInput.addEventListener('change', function(event) {
        const newFiles = Array.from(event.target.files);
        
        newFiles.forEach(file => {
            selectedFiles.push(file);
        });

        if (selectedFiles.length > 10) {
            alert("⚠️ الحد الأقصى 10 صور فقط. تم الاحتفاظ بأول 10 صور.");
            selectedFiles = selectedFiles.slice(0, 10);
        }

        renderPreviews();
        this.value = ''; 
    });
}

function renderPreviews() {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = ''; 

    selectedFiles.forEach((file, index) => {
        const isTooBig = file.size > 10 * 1024 * 1024;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative; display:inline-block; margin:10px; width:100px; height:100px;';

        const img = document.createElement('img');
        img.style.cssText = `width:100%; height:100%; object-fit:cover; border-radius:8px; border:${isTooBig ? "2px solid #ff4444" : "1px solid #00ff88"};`;
        
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        
        wrapper.appendChild(img);

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.cssText = 'position:absolute; top:-8px; right:-8px; background:#ff4444; color:white; border:2px solid white; border-radius:50%; width:24px; height:24px; cursor:pointer; display:flex; justify-content:center; align-items:center; font-size:12px; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.3);';
        
        removeBtn.onclick = (e) => {
            e.preventDefault(); 
            selectedFiles.splice(index, 1); 
            renderPreviews(); 
        };

        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

// ==========================================================
// 🚀 دالة الإرسال (Submit)
// ==========================================================
document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    // التحقق من تحديد الموقع
    if (!document.getElementById('lat').value) {
        alert("📍 من فضلك حدد موقع العقار على الخريطة!");
        document.querySelector('.map-wrapper').scrollIntoView({ behavior: 'smooth', block: 'center' });
        // وميض للخريطة للفت الانتباه
        document.querySelector('.map-wrapper').style.borderColor = 'red';
        setTimeout(() => document.querySelector('.map-wrapper').style.borderColor = '#333', 2000);
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع والتحليل...';
    btn.disabled = true;
    if(msg) { msg.textContent = ''; msg.className = 'message'; }

    const formData = new FormData(form);
    formData.delete('images[]'); 
    formData.delete('images'); 

    let validImagesCount = 0;
    selectedFiles.forEach(file => {
        if (file.size <= 10 * 1024 * 1024) { 
            formData.append('images', file); 
            validImagesCount++;
        }
    });

    if (validImagesCount === 0 && selectedFiles.length > 0) {
        alert("⚠️ جميع الصور المختارة حجمها كبير جداً.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const response = await fetch('/api/submit-seller-property', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // عرض رسالة نجاح جميلة
            const successDiv = document.createElement('div');
            successDiv.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; justify-content:center; align-items:center;">
                    <div class="neon-glow" style="background:#1c2630; padding:40px; border-radius:20px; width:90%; max-width:400px; text-align:center; border:1px solid #00ff88; box-shadow: 0 0 30px rgba(0,255,136,0.2);">
                        <div style="font-size:4rem; color:#00ff88; margin-bottom:20px;"><i class="fas fa-check-circle"></i></div>
                        <h2 style="color:white; margin-bottom:10px;">تم نشر عقارك بنجاح! 🚀</h2>
                        <p style="color:#ccc; margin-bottom:20px;">تم حفظ الموقع والخدمات القريبة.</p>
                        
                        ${data.status !== 'approved' ? `
                        <div style="background:rgba(255,152,0,0.1); border:1px solid #ff9800; padding:10px; border-radius:10px; margin-bottom:20px;">
                            <p style="color:#ff9800; font-size:0.9rem; margin:0;"><i class="fas fa-clock"></i> العقار قيد المراجعة اليدوية</p>
                        </div>
                        ` : ''}

                        <button onclick="window.location.href='home'" class="btn-neon-auth" style="width:100%;">العودة للرئيسية</button>
                    </div>
                </div>
            `;
            document.body.appendChild(successDiv);
            
            form.reset();
            selectedFiles = [];
            renderPreviews();

        } else {
            throw new Error(data.message || 'حدث خطأ ما');
        }

    } catch (error) {
        console.error(error);
        if(msg) {
            msg.textContent = '❌ ' + error.message;
            msg.className = 'message error';
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// تفعيل الحقول الإضافية (Toggle Fields)
function toggleFields() {
    const catElement = document.getElementById('property-category');
    if(!catElement) return;
    
    const cat = catElement.value;
    const levelGroup = document.getElementById('level-group');
    const floorsGroup = document.getElementById('floors-count-group');

    if(levelGroup && floorsGroup) {
        if(cat === 'apartment' || cat === 'office' || cat === 'store') {
            levelGroup.style.display = 'block';
            floorsGroup.style.display = 'none';
        } 
        else if (cat === 'villa' || cat === 'building' || cat === 'warehouse') {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'block';
        } else {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'none';
        }
    }
}