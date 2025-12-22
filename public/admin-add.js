let map, marker;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields();
    }

    const form = document.getElementById('add-property-form');
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');

    imageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        previewContainer.innerHTML = ''; 
        if (files.length > 0) {
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewContainer.innerHTML += `<img src="${e.target.result}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #444;">`;
                }
                reader.readAsDataURL(file);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // إظهار مودال التحميل
        showModal('loading', 'جاري النشر...', 'يرجى الانتظار بينما يتم رفع البيانات والصور.');

        const formData = new FormData(form); 
        
        try {
            const response = await fetch('/api/add-property', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'فشل النشر');
            
            // ✅ نجاح
            showModal('success', 'تم النشر بنجاح!', data.message);
            form.reset();
            previewContainer.innerHTML = '';
            if(marker) map.removeLayer(marker);
            
        } catch (error) {
            // ❌ خطأ
            showModal('error', 'حدث خطأ!', error.message);
        }
    });
});

// --- Modal Function ---
function showModal(type, title, text) {
    const modal = document.getElementById('adminModal');
    const icon = document.getElementById('modalIcon');
    const titleEl = document.getElementById('modalTitle');
    const textEl = document.getElementById('modalText');
    const btn = document.getElementById('modalBtn');

    modal.style.display = 'flex';
    titleEl.textContent = title;
    textEl.textContent = text;

    if (type === 'success') {
        icon.className = 'modal-icon fas fa-check-circle';
        icon.style.color = '#00ff88';
        btn.className = 'modal-btn modal-btn-success';
        btn.textContent = 'تمام';
        btn.style.display = 'inline-block';
    } else if (type === 'error') {
        icon.className = 'modal-icon fas fa-times-circle';
        icon.style.color = '#ff4444';
        btn.className = 'modal-btn modal-btn-error';
        btn.textContent = 'إغلاق';
        btn.style.display = 'inline-block';
    } else if (type === 'loading') {
        icon.className = 'modal-icon fas fa-spinner fa-spin';
        icon.style.color = '#00d4ff';
        btn.style.display = 'none'; // إخفاء الزر أثناء التحميل
    }
}

function closeModal() {
    document.getElementById('adminModal').style.display = 'none';
}

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

function initMap() {
    map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'OSM' }).addTo(map);
    map.on('click', function(e) {
        if (marker) map.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        document.getElementById('lat').value = e.latlng.lat;
        document.getElementById('lng').value = e.latlng.lng;
    });
}