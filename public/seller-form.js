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

// --- 🌍 إعدادات الخريطة والبحث ---
function initMap() {
    const defaultLat = 30.0444; 
    const defaultLng = 31.2357; 

    map = L.map('map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.on('click', async function(e) {
        handleLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                searchLocation();
            }
        });
        searchInput.addEventListener('input', function() {
            if(this.value.length < 3) document.getElementById('search-suggestions').style.display = 'none';
        });
    }
}

// 🔍 البحث
async function searchLocation() {
    const query = document.getElementById('map-search-input').value;
    const resultsBox = document.getElementById('search-suggestions');
    
    if (!query) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Egypt')}&addressdetails=1&limit=5&accept-language=ar`;

    try {
        resultsBox.innerHTML = '<div class="suggestion-item" style="justify-content:center;"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';
        resultsBox.style.display = 'block';

        const response = await fetch(url);
        const data = await response.json();

        resultsBox.innerHTML = ''; 

        if (data.length === 0) {
            resultsBox.innerHTML = '<div class="suggestion-item" style="color:#ff4444; justify-content:center;">لم يتم العثور على نتائج.</div>';
            return;
        }

        data.forEach(place => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            let displayName = place.display_name.split(',')[0];
            const addr = place.address || {};
            if(addr.city || addr.town || addr.suburb) {
                displayName += `، ${addr.city || addr.town || addr.suburb}`;
            }

            div.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${displayName}</span>`;
            
            div.onclick = () => {
                document.getElementById('map-search-input').value = displayName;
                handleLocationSelect(place.lat, place.lon);
            };
            resultsBox.appendChild(div);
        });

    } catch (error) {
        console.error("Search Error:", error);
        resultsBox.style.display = 'none';
    }
}

// اختيار الموقع
async function handleLocationSelect(lat, lng) {
    map.setView([lat, lng], 17);
    
    if (marker) map.removeLayer(marker);
    if (circle) map.removeLayer(circle);

    marker = L.marker([lat, lng]).addTo(map).bindPopup("الموقع المحدد").openPopup();
    circle = L.circle([lat, lng], { color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.1, radius: 500 }).addTo(map);
    
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    document.getElementById('search-suggestions').style.display = 'none';

    await fetchNearbyServices(lat, lng);
}

// 🤖 جلب الخدمات
async function fetchNearbyServices(lat, lng) {
    const statusMsg = document.getElementById('map-status-text');
    statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تحليل المنطقة...';
    statusMsg.style.color = '#00d4ff';

    const query = `
        [out:json];
        (
          node["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          way["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          node["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
          way["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
        );
        out center 15; 
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
        const data = await response.json();
        
        const services = new Set();
        data.elements.forEach(el => {
            let name = el.tags['name:ar'] || el.tags.name || null;
            if (name) services.add(name);
        });

        const servicesArray = Array.from(services).slice(0, 10);
        document.getElementById('nearby_services').value = servicesArray.join(', ');

        if (servicesArray.length > 0) {
            statusMsg.innerHTML = `✅ تم العثور على ${servicesArray.length} خدمات: (${servicesArray.slice(0, 3).join('، ')}...)`;
            statusMsg.style.color = '#00ff88';
        } else {
            statusMsg.innerHTML = '⚠️ المنطقة هادئة، سيتم الاعتماد على الموقع فقط.';
            statusMsg.style.color = '#ff9800';
        }
    } catch (error) { statusMsg.innerText = "فشل التحليل التلقائي."; }
}

window.locateUser = function() {
    const btn = document.querySelector('.locate-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
            btn.innerHTML = originalText;
        }, () => { alert("شغل الـ GPS!"); btn.innerHTML = originalText; });
    } else { alert("غير مدعوم"); btn.innerHTML = originalText; }
};

// --- البيانات والصور والإرسال ---
async function fetchUserData() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.isAuthenticated) {
            document.getElementById('seller-name').value = data.name || 'مستخدم عقارك';
            document.getElementById('seller-phone').value = data.phone || '';
        } else { window.location.href = 'index'; }
    } catch (e) {}
}

const imgInput = document.getElementById('property-images');
if (imgInput) {
    imgInput.addEventListener('change', function(e) {
        Array.from(e.target.files).forEach(file => selectedFiles.push(file));
        if (selectedFiles.length > 10) selectedFiles = selectedFiles.slice(0, 10);
        renderPreviews();
        this.value = ''; 
    });
}

function renderPreviews() {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative; display:inline-block; margin:10px; width:100px; height:100px;';
        
        const img = document.createElement('img');
        img.style.cssText = `width:100%; height:100%; object-fit:cover; border-radius:8px; border: 1px solid #00ff88;`;
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        
        const btn = document.createElement('button');
        btn.innerHTML = '×';
        btn.style.cssText = 'position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:20px; height:20px; border:none; cursor:pointer; font-weight:bold; display:flex; justify-content:center; align-items:center;';
        btn.onclick = (e) => { e.preventDefault(); selectedFiles.splice(index, 1); renderPreviews(); };

        wrapper.appendChild(img); wrapper.appendChild(btn);
        container.appendChild(wrapper);
    });
}

document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    if (!document.getElementById('lat').value) {
        alert("📍 حدد الموقع على الخريطة!");
        document.querySelector('.map-wrapper').scrollIntoView({ behavior: 'smooth' });
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
            alert('🎉 تم النشر بنجاح!');
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