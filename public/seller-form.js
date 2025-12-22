let selectedFiles = []; 
let map, marker, circle;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserData();
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields();
    }
    initMap();
});

// --- 🌍 إعدادات الخريطة الجديدة ---
function initMap() {
    // القاهرة كافتراضي
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    // استخدام CartoDB Voyager (خريطة عصرية ونظيفة)
    map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        setMarker(lat, lng);
        await fetchNearbyServices(lat, lng);
    });
}

function setMarker(lat, lng) {
    if (marker) map.removeLayer(marker);
    if (circle) map.removeLayer(circle);

    // إضافة الدبوس
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup("موقع العقار").openPopup();

    // إضافة دائرة توضح نطاق البحث (500 متر)
    circle = L.circle([lat, lng], {
        color: '#00ff88',
        fillColor: '#00ff88',
        fillOpacity: 0.1,
        radius: 500
    }).addTo(map);
    
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
}

// زرار "موقعي الحالي"
window.locateUser = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 16);
            setMarker(latitude, longitude);
            fetchNearbyServices(latitude, longitude);
        }, () => { alert("تعذر تحديد الموقع. تأكد من تفعيل الـ GPS."); });
    } else { alert("المتصفح لا يدعم تحديد الموقع."); }
};

// 🤖 البحث الذكي (محسن جداً لمصر)
async function fetchNearbyServices(lat, lng) {
    const statusMsg = document.getElementById('map-status-text');
    statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري مسح المنطقة والبحث عن الخدمات...';
    statusMsg.style.color = '#00d4ff';

    // استعلام موسع يشمل المساجد، السوبر ماركت، المولات، الجيم، المدارس، المستشفيات
    // بنبحث في دائرة نصف قطرها 800 متر
    const query = `
        [out:json];
        (
          node["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          way["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          node["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
          way["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
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
            // الأولوية للاسم العربي، ثم الإنجليزي، ثم نوع الخدمة
            let name = el.tags['name:ar'] || el.tags.name || null;
            let type = el.tags.amenity || el.tags.shop || el.tags.leisure;

            // ترجمة بسيطة للأنواع لو الاسم مش موجود
            if (!name && type) {
                if(type === 'place_of_worship') name = 'مسجد/كنيسة';
                else if(type === 'school') name = 'مدرسة';
                else if(type === 'pharmacy') name = 'صيدلية';
                else if(type === 'supermarket') name = 'سوبر ماركت';
                else name = type;
            }

            if (name) services.add(name);
        });

        // تحويلها لنص
        const servicesArray = Array.from(services).slice(0, 10); // ناخد أهم 10
        const servicesString = servicesArray.join(', ');
        
        document.getElementById('nearby_services').value = servicesString;

        if (servicesArray.length > 0) {
            statusMsg.innerHTML = `✅ تم العثور على ${servicesArray.length} خدمات قريبة: (${servicesArray.slice(0, 3).join('، ')}...)`;
            statusMsg.style.color = '#00ff88';
        } else {
            statusMsg.innerHTML = '⚠️ المنطقة جديدة أو هادئة، لم يتم العثور على خدمات مسجلة قريبة.';
            statusMsg.style.color = '#ff9800';
        }

    } catch (error) {
        console.error("Error fetching services:", error);
        statusMsg.innerText = "فشل التحليل التلقائي. سيتم الاعتماد على الموقع فقط.";
    }
}

// --- باقي دوال الفورم (الصور والبيانات) كما هي ---
async function fetchUserData() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.isAuthenticated) {
            document.getElementById('seller-name').value = data.name || 'مستخدم عقارك';
            document.getElementById('seller-phone').value = data.phone || '';
        } else { window.location.href = 'index'; }
    } catch (error) { console.error(error); }
}

// منطق الصور
const imgInput = document.getElementById('property-images');
if (imgInput) {
    imgInput.addEventListener('change', function(event) {
        const newFiles = Array.from(event.target.files);
        newFiles.forEach(file => selectedFiles.push(file));
        if (selectedFiles.length > 10) selectedFiles = selectedFiles.slice(0, 10);
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
        img.style.cssText = `width:100%; height:100%; object-fit:cover; border-radius:8px; border:${isTooBig ? "2px solid red" : "1px solid #00ff88"};`;
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText = 'position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:20px; height:20px; cursor:pointer; border:none; font-weight:bold;';
        removeBtn.onclick = (e) => { e.preventDefault(); selectedFiles.splice(index, 1); renderPreviews(); };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

// الإرسال
document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    if (!document.getElementById('lat').value) {
        alert("📍 من فضلك حدد الموقع على الخريطة!");
        document.querySelector('.map-container').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    btn.innerHTML = 'جاري النشر...';
    btn.disabled = true;
    if(msg) msg.textContent = '';

    const formData = new FormData(e.target);
    formData.delete('images[]'); 
    selectedFiles.forEach(file => { if (file.size <= 10 * 1024 * 1024) formData.append('images', file); });

    try {
        const response = await fetch('/api/submit-seller-property', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok) {
            alert('🎉 تم نشر العقار بنجاح!');
            window.location.href = 'home';
        } else { throw new Error(data.message); }
    } catch (error) {
        if(msg) { msg.textContent = '❌ ' + error.message; msg.className = 'message error'; }
    } finally {
        btn.innerHTML = originalText; btn.disabled = false;
    }
});

function toggleFields() {
    const cat = document.getElementById('property-category').value;
    const levelGroup = document.getElementById('level-group');
    const floorsGroup = document.getElementById('floors-count-group');
    if(levelGroup && floorsGroup) {
        if(cat === 'apartment' || cat === 'office' || cat === 'store') {
            levelGroup.style.display = 'block'; floorsGroup.style.display = 'none';
        } else if (cat === 'villa' || cat === 'building' || cat === 'warehouse') {
            levelGroup.style.display = 'none'; floorsGroup.style.display = 'block';
        } else {
            levelGroup.style.display = 'none'; floorsGroup.style.display = 'none';
        }
    }
}