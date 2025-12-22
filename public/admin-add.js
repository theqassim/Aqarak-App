let map, marker;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    toggleFields();
    document.getElementById('property-category').addEventListener('change', toggleFields);

    // معاينة الصور
    document.getElementById('property-images').addEventListener('change', (e) => {
        const container = document.getElementById('image-preview-container');
        container.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                container.innerHTML += `<img src="${ev.target.result}" style="width:60px; height:60px; border-radius:5px; border:1px solid #555;">`;
            };
            reader.readAsDataURL(file);
        });
    });

    // الإرسال
    document.getElementById('add-property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        showModal('loading', 'جاري النشر', 'يرجى الانتظار...');
        
        try {
            const res = await fetch('/api/add-property', { method: 'POST', body: new FormData(e.target) });
            const data = await res.json();
            
            if(res.ok) {
                showModal('success', 'تم بنجاح', data.message);
                e.target.reset();
                document.getElementById('image-preview-container').innerHTML = '';
                if(marker) map.removeLayer(marker);
            } else { throw new Error(data.message); }
        } catch(err) {
            showModal('error', 'خطأ', err.message);
        }
    });
});

function toggleFields() {
    const cat = document.getElementById('property-category').value;
    const levelGroup = document.getElementById('level-group');
    const floorsGroup = document.getElementById('floors-count-group');
    
    if(levelGroup && floorsGroup) {
        if (['villa', 'building', 'warehouse'].includes(cat)) {
            levelGroup.style.display = 'none'; floorsGroup.style.display = 'block';
        } else if (cat === 'land') {
            levelGroup.style.display = 'none'; floorsGroup.style.display = 'none';
        } else {
            levelGroup.style.display = 'block'; floorsGroup.style.display = 'none';
        }
    }
}

function initMap() {
    map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'OSM' }).addTo(map);
    map.on('click', (e) => {
        if(marker) map.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        document.getElementById('lat').value = e.latlng.lat;
        document.getElementById('lng').value = e.latlng.lng;
    });
}

function showModal(type, title, text) {
    const modal = document.getElementById('adminModal');
    const icon = document.getElementById('modalIcon');
    modal.style.display = 'flex';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    
    if(type === 'success') { icon.className = 'fas fa-check-circle'; icon.style.color = '#00ff88'; }
    else if(type === 'error') { icon.className = 'fas fa-times-circle'; icon.style.color = '#ff4444'; }
    else { icon.className = 'fas fa-spinner fa-spin'; icon.style.color = '#00d4ff'; }
}