let map, marker;
let currentVideoList = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. الخريطة
    map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'OSM' }).addTo(map);
    map.on('click', (e) => updateMarker(e.latlng.lat, e.latlng.lng));

    // 2. البحث
    document.getElementById('search-property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('search-code').value.trim();
        if(!code) return showModal('error', 'خطأ', 'يرجى إدخال الكود');
        
        showModal('loading', 'جاري البحث...', '');
        
        try {
            const res = await fetch(`/api/property-by-code/${code}`);
            if(!res.ok) throw new Error('لم يتم العثور على العقار.');
            
            const data = await res.json();
            loadData(data); // هنا الملء الفعلي
            
            closeModal();
            document.getElementById('property-edit-area').style.display = 'block';
            setTimeout(() => map.invalidateSize(), 500);

        } catch(err) {
            showModal('error', 'خطأ', err.message);
            document.getElementById('property-edit-area').style.display = 'none';
        }
    });

    // 3. الحفظ (زر المودال)
    document.getElementById('edit-property-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showConfirm('حفظ التعديلات؟', 'هل أنت متأكد من حفظ البيانات الجديدة؟', async () => {
            showModal('loading', 'جاري الحفظ', '');
            const id = document.getElementById('edit-property-id').value;
            try {
                const res = await fetch(`/api/update-property/${id}`, { method: 'PUT', body: new FormData(e.target) });
                const data = await res.json();
                if(res.ok) {
                    showModal('success', 'تم', 'تم التحديث بنجاح');
                    window.scrollTo(0,0);
                } else throw new Error(data.message);
            } catch(err) { showModal('error', 'فشل', err.message); }
        });
    });

    // 4. الفيديوهات
    document.getElementById('add-video-btn').addEventListener('click', () => {
        const url = document.getElementById('video-url-input').value.trim();
        if(url) { currentVideoList.push(url); renderVideos(); document.getElementById('video-url-input').value = ''; }
    });
    
    // 5. الحذف
    document.getElementById('delete-property-btn').addEventListener('click', () => {
        showConfirm('حذف نهائي', '⚠️ سيتم المسح بلا رجعة!', async () => {
            try {
                await fetch(`/api/property/${document.getElementById('edit-property-id').value}`, { method: 'DELETE' });
                showModal('success', 'تم', 'تم حذف العقار');
                setTimeout(() => location.reload(), 2000);
            } catch(e) { showModal('error', 'خطأ', 'فشل الحذف'); }
        });
    });
});

// 🔥 الدالة الأهم: ملء البيانات (مع فحص الأسماء المختلفة)
function loadData(data) {
    document.getElementById('edit-property-id').value = data.id;
    
    // استخدام || عشان لو الاسم جاي مختلف من السيرفر
    document.getElementById('edit-title').value = data.title || data.propertyTitle || '';
    document.getElementById('edit-hidden-code').value = data.hiddenCode || '';
    document.getElementById('edit-price').value = data.price || data.propertyPrice || '';
    document.getElementById('edit-area').value = data.area || data.propertyArea || '';
    document.getElementById('edit-rooms').value = data.rooms || data.propertyRooms || '';
    document.getElementById('edit-bathrooms').value = data.bathrooms || data.propertyBathrooms || '';
    
    // إصلاح الوصف
    document.getElementById('edit-description').value = data.description || data.propertyDescription || '';

    // القوائم
    document.getElementById('edit-category').value = data.category || data.propertyCategory || 'apartment';
    document.getElementById('edit-type').value = data.type || data.propertyType || 'بيع';
    document.getElementById('edit-finishing').value = data.finishing || data.propertyFinishing || '';
    document.getElementById('edit-level').value = data.level || data.propertyLevel || '';
    document.getElementById('edit-floors').value = data.floors || data.propertyFloors || '';

    toggleEditFields(); // تحديث الحقول الظاهرة

    // الخريطة
    if(data.latitude && data.longitude) {
        updateMarker(data.latitude, data.longitude);
        map.setView([data.latitude, data.longitude], 16);
    } else {
        if(marker) map.removeLayer(marker);
        map.setView([30.0444, 31.2357], 13);
    }

    // الصور القديمة
    const imgContainer = document.getElementById('existing-images-container');
    imgContainer.innerHTML = '';
    const urls = data.imageUrls || []; 
    document.getElementById('existing-images-data').value = JSON.stringify(urls);
    
    urls.forEach(url => {
        imgContainer.innerHTML += `
            <div class="existing-image-wrapper">
                <img src="${url}" class="preview-image">
                <button type="button" class="remove-img-btn" onclick="removeImg(this, '${url}')">×</button>
            </div>
        `;
    });

    // 🔥 إصلاح الفيديوهات (التأكد من نوع البيانات)
    if (data.video_urls) {
        if (Array.isArray(data.video_urls)) {
            currentVideoList = data.video_urls;
        } else if (typeof data.video_urls === 'string') {
            try { currentVideoList = JSON.parse(data.video_urls); } catch(e) { currentVideoList = []; }
        }
    } else {
        currentVideoList = [];
    }
    renderVideos();
}

function updateMarker(lat, lng) {
    if(marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    document.getElementById('edit-lat').value = lat;
    document.getElementById('edit-lng').value = lng;
}

function toggleEditFields() {
    const cat = document.getElementById('edit-category').value;
    const level = document.getElementById('edit-level-group');
    const floors = document.getElementById('edit-floors-group');
    
    if (['villa', 'building', 'warehouse'].includes(cat)) {
        level.style.display = 'none'; floors.style.display = 'block';
    } else if (cat === 'land') {
        level.style.display = 'none'; floors.style.display = 'none';
    } else {
        level.style.display = 'block'; floors.style.display = 'none';
    }
}

function removeImg(btn, url) {
    btn.parentElement.remove();
    let urls = JSON.parse(document.getElementById('existing-images-data').value);
    urls = urls.filter(u => u !== url);
    document.getElementById('existing-images-data').value = JSON.stringify(urls);
}

function renderVideos() {
    const list = document.getElementById('video-list-container');
    list.innerHTML = '';
    currentVideoList.forEach((link, i) => {
        list.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom:5px; background:#222; padding:5px; border-radius:5px;">
                <a href="${link}" target="_blank" style="color:#00d4ff; overflow:hidden; text-overflow:ellipsis;">${link}</a>
                <span onclick="deleteVideo(${i})" style="color:red; cursor:pointer;">[حذف]</span>
            </li>
        `;
    });
    document.getElementById('hidden-video-urls-input').value = JSON.stringify(currentVideoList);
}

function deleteVideo(i) { currentVideoList.splice(i, 1); renderVideos(); }

// Modal Helpers
function showModal(type, title, text) {
    const m = document.getElementById('adminModal');
    const i = document.getElementById('modalIcon');
    const b = document.getElementById('modalButtons');
    m.style.display = 'flex';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    b.innerHTML = `<button onclick="closeModal()" class="modal-btn" style="background:#555; color:white;">إغلاق</button>`;
    
    if(type === 'success') { i.className = 'fas fa-check-circle'; i.style.color = '#00ff88'; }
    else if(type === 'error') { i.className = 'fas fa-times-circle'; i.style.color = '#ff4444'; }
    else { i.className = 'fas fa-spinner fa-spin'; i.style.color = '#00d4ff'; b.innerHTML=''; }
}

function showConfirm(title, text, onYes) {
    const m = document.getElementById('adminModal');
    m.style.display = 'flex';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modalIcon').className = 'fas fa-question-circle';
    document.getElementById('modalIcon').style.color = '#ff9800';
    
    const b = document.getElementById('modalButtons');
    b.innerHTML = '';
    
    const yes = document.createElement('button');
    yes.textContent = 'نعم'; yes.className = 'modal-btn'; yes.style.background = '#00ff88'; yes.style.color='black';
    yes.onclick = onYes;
    
    const no = document.createElement('button');
    no.textContent = 'لا'; no.className = 'modal-btn'; no.style.background = '#555'; no.style.color='white';
    no.onclick = closeModal;
    
    b.append(yes, no);
}

function closeModal() { document.getElementById('adminModal').style.display = 'none'; }