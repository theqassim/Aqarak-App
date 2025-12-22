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
        if(!code) return showModal('error', 'خطأ', 'يرجى إدخال كود العقار');
        
        showModal('loading', 'جاري البحث...', 'لحظات من فضلك');
        
        try {
            const res = await fetch(`/api/property-by-code/${code}`);
            if(!res.ok) throw new Error('لم يتم العثور على العقار.');
            
            const data = await res.json();
            loadData(data);
            closeModal(); // إغلاق مودال التحميل
            document.getElementById('property-edit-area').style.display = 'block';
            setTimeout(() => map.invalidateSize(), 500);

        } catch(err) {
            showModal('error', 'خطأ', err.message);
            document.getElementById('property-edit-area').style.display = 'none';
        }
    });

    // 3. الحفظ (استبدال confirm بـ modal)
    document.getElementById('edit-property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        showConfirm('تأكيد الحفظ', 'هل أنت متأكد من حفظ التعديلات؟', async () => {
            showModal('loading', 'جاري الحفظ...', 'يرجى الانتظار');
            
            const id = document.getElementById('edit-property-id').value;
            const formData = new FormData(document.getElementById('edit-property-form'));
            
            try {
                const res = await fetch(`/api/update-property/${id}`, { method: 'PUT', body: formData });
                const data = await res.json();
                
                if(res.ok) {
                    showModal('success', 'تم!', 'تم تحديث بيانات العقار بنجاح.');
                    window.scrollTo(0,0);
                } else {
                    throw new Error(data.message);
                }
            } catch(err) {
                showModal('error', 'فشل الحفظ', err.message);
            }
        });
    });

    // 4. الحذف (استبدال confirm بـ modal)
    document.getElementById('delete-property-btn').addEventListener('click', () => {
        showConfirm('حذف نهائي', '⚠️ سيتم مسح العقار ولن يمكن استعادته. هل أنت متأكد؟', async () => {
            showModal('loading', 'جاري الحذف...', '');
            const id = document.getElementById('edit-property-id').value;
            try {
                await fetch(`/api/property/${id}`, { method: 'DELETE' });
                showModal('success', 'تم الحذف', 'تم مسح العقار بنجاح.');
                setTimeout(() => location.reload(), 2000);
            } catch(e) { showModal('error', 'خطأ', 'فشل الحذف'); }
        });
    });

    // 5. الفيديوهات
    document.getElementById('add-video-btn').addEventListener('click', () => {
        const url = document.getElementById('video-url-input').value.trim();
        if(url) {
            currentVideoList.push(url);
            renderVideos();
            document.getElementById('video-url-input').value = '';
        }
    });
});

// --- دوال المودال ---
function showModal(type, title, text) {
    const modal = document.getElementById('adminModal');
    const icon = document.getElementById('modalIcon');
    const titleEl = document.getElementById('modalTitle');
    const textEl = document.getElementById('modalText');
    const btnContainer = document.getElementById('modalButtons');

    modal.style.display = 'flex';
    titleEl.textContent = title;
    textEl.textContent = text;
    btnContainer.innerHTML = ''; // تنظيف الأزرار

    if (type === 'success') {
        icon.className = 'modal-icon fas fa-check-circle'; icon.style.color = '#00ff88';
        btnContainer.innerHTML = `<button onclick="closeModal()" class="modal-btn modal-btn-success">تمام</button>`;
    } else if (type === 'error') {
        icon.className = 'modal-icon fas fa-times-circle'; icon.style.color = '#ff4444';
        btnContainer.innerHTML = `<button onclick="closeModal()" class="modal-btn modal-btn-error">إغلاق</button>`;
    } else if (type === 'loading') {
        icon.className = 'modal-icon fas fa-spinner fa-spin'; icon.style.color = '#00d4ff';
    }
}

function showConfirm(title, text, onYes) {
    const modal = document.getElementById('adminModal');
    document.getElementById('modalIcon').className = 'modal-icon fas fa-question-circle';
    document.getElementById('modalIcon').style.color = '#e91e63';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    
    const btnContainer = document.getElementById('modalButtons');
    btnContainer.innerHTML = '';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'modal-btn modal-btn-success';
    yesBtn.textContent = 'نعم، نفذ';
    yesBtn.onclick = () => { onYes(); }; // لا نغلق المودال هنا، نترك دالة التنفيذ تقرر (مثل إظهار اللودينج)

    const noBtn = document.createElement('button');
    noBtn.className = 'modal-btn modal-btn-cancel';
    noBtn.textContent = 'إلغاء';
    noBtn.onclick = closeModal;

    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('adminModal').style.display = 'none'; }

// --- باقي الدوال (تحميل البيانات، الخريطة، الصور) ---
function loadData(data) {
    document.getElementById('edit-property-id').value = data.id;
    document.getElementById('edit-title').value = data.title;
    document.getElementById('edit-hidden-code').value = data.hiddenCode;
    document.getElementById('edit-price').value = data.price;
    document.getElementById('edit-area').value = data.area;
    document.getElementById('edit-rooms').value = data.rooms || '';
    document.getElementById('edit-bathrooms').value = data.bathrooms || '';
    // إصلاح الوصف (تجربة أكثر من اسم)
    document.getElementById('edit-description').value = data.description || data.propertyDescription || '';

    // القوائم
    document.getElementById('edit-category').value = data.category || 'apartment';
    document.getElementById('edit-type').value = data.type;
    document.getElementById('edit-finishing').value = data.finishing || '';
    document.getElementById('edit-level').value = data.level || '';
    document.getElementById('edit-floors').value = data.floors || '';
    toggleEditFields();

    // الخريطة
    if(data.latitude && data.longitude) {
        updateMarker(data.latitude, data.longitude);
        map.setView([data.latitude, data.longitude], 16);
    } else {
        if(marker) map.removeLayer(marker);
        map.setView([30.0444, 31.2357], 13);
    }

    // الصور
    const imgContainer = document.getElementById('existing-images-container');
    imgContainer.innerHTML = '';
    const urls = data.imageUrls || [];
    document.getElementById('existing-images-data').value = JSON.stringify(urls);
    urls.forEach(url => {
        imgContainer.innerHTML += `<div class="existing-image-wrapper"><img src="${url}" class="preview-image"><button type="button" class="remove-image-btn" onclick="removeImg(this, '${url}')">×</button></div>`;
    });

    // الفيديوهات (إصلاح المصفوفة)
    if (data.video_urls) {
        currentVideoList = Array.isArray(data.video_urls) ? data.video_urls : JSON.parse(data.video_urls);
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
    const levelGroup = document.getElementById('edit-level-group');
    const floorsGroup = document.getElementById('edit-floors-group');
    if (cat === 'villa' || cat === 'building' || cat === 'warehouse') {
        levelGroup.style.display = 'none'; floorsGroup.style.display = 'block';
    } else if (cat === 'land') {
        levelGroup.style.display = 'none'; floorsGroup.style.display = 'none';
    } else {
        levelGroup.style.display = 'block'; floorsGroup.style.display = 'none';
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
            <li style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #444; align-items:center;">
                <a href="${link}" target="_blank" style="color:#00d4ff; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">${link}</a>
                <span onclick="deleteVideo(${i})" style="color:#ff4444; cursor:pointer; font-weight:bold;"><i class="fas fa-trash"></i></span>
            </li>
        `;
    });
    document.getElementById('hidden-video-urls-input').value = JSON.stringify(currentVideoList);
}

function deleteVideo(index) {
    currentVideoList.splice(index, 1);
    renderVideos();
}