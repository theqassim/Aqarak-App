let map, marker, circle;

document.addEventListener('DOMContentLoaded', () => {
    
    // تشغيل الخريطة والمنطق
    initMap();
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields(); // تشغيل أولي
    }

    const form = document.getElementById('add-property-form');
    const messageEl = document.getElementById('add-form-message');
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');

    // معاينة الصور
    imageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        previewContainer.innerHTML = ''; 
        if (files.length > 0) {
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.cssText = "width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #444;";
                    previewContainer.appendChild(img); 
                }
                reader.readAsDataURL(file);
            }
        }
    });

    // الإرسال
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = 'جاري نشر العقار...';
        messageEl.className = '';
        messageEl.style.color = '#00d4ff';

        const formData = new FormData(form); 
        
        try {
            const response = await fetch('/api/add-property', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'فشل النشر');
            
            messageEl.textContent = '✅ ' + data.message;
            messageEl.style.color = '#00ff88';
            form.reset();
            previewContainer.innerHTML = '';
            // إعادة ضبط الخريطة
            if(marker) map.removeLayer(marker);
            
        } catch (error) {
            messageEl.textContent = `❌ خطأ: ${error.message}`;
            messageEl.style.color = '#ff4444';
        }
    });
});

// --- دوال الواجهة (Toggle Fields) ---
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

// --- دوال الخريطة (Map Logic) ---
function initMap() {
    // إحداثيات القاهرة الافتراضية
    map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 20
    }).addTo(map);

    map.on('click', function(e) {
        updateMarker(e.latlng.lat, e.latlng.lng);
    });
}

function updateMarker(lat, lng) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    fetchNearbyServices(lat, lng);
}

async function searchLocation() {
    const query = document.getElementById('map-search-input').value;
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Egypt')}&addressdetails=1&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
            const { lat, lon } = data[0];
            map.setView([lat, lon], 16);
            updateMarker(lat, lon);
        } else { alert('لم يتم العثور على الموقع'); }
    } catch (e) { console.error(e); }
}

async function fetchNearbyServices(lat, lng) {
    // كود جلب الخدمات (اختياري للأدمن، يتم تخزينه كبيانات)
    const query = `[out:json];(node["amenity"](around:500, ${lat}, ${lng}););out;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
        const data = await res.json();
        const services = data.elements.map(el => el.tags.name).filter(n => n).slice(0, 5).join(', ');
        document.getElementById('nearby_services').value = services;
    } catch(e) {}
}