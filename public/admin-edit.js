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
        if(!code) return showModal('error', 'تنبيه', 'يرجى إدخال الكود السري للعقار');
        
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

    // 3. الحفظ
    document.getElementById('edit-property-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showConfirm('حفظ التعديلات؟', 'هل أنت متأكد من حفظ البيانات الجديدة؟', async () => {
            showModal('loading', 'جاري الحفظ', 'يرجى الانتظار...');
            const id = document.getElementById('edit-property-id').value;
            try {
                const res = await fetch(`/api/update-property/${id}`, { method: 'PUT', body: new FormData(e.target) });
                const data = await res.json();
                if(res.ok) {
                    showModal('success', 'تم الحفظ', 'تم تحديث بيانات العقار بنجاح');
                    window.scrollTo(0,0);
                } else throw new Error(data.message);
            } catch(err) { showModal('error', 'فشل الحفظ', err.message); }
        });
    });

    // 4. الفيديوهات
    document.getElementById('add-video-btn').addEventListener('click', () => {
        const url = document.getElementById('video-url-input').value.trim();
        if(url) { currentVideoList.push(url); renderVideos(); document.getElementById('video-url-input').value = ''; }
    });
    
    // 5. الحذف
    document.getElementById('delete-property-btn').addEventListener('click', () => {
        showConfirm('حذف نهائي', '⚠️ سيتم مسح العقار من قاعدة البيانات ولن يمكن استعادته!', async () => {
            showModal('loading', 'جاري الحذف', '');
            try {
                await fetch(`/api/property/${document.getElementById('edit-property-id').value}`, { method: 'DELETE' });
                showModal('success', 'تم الحذف', 'تم مسح العقار بنجاح');
                setTimeout(() => location.reload(), 2000);
            } catch(e) { showModal('error', 'خطأ', 'فشل عملية الحذف'); }
        });
    });
});

// 🔥 دالة getVal لجلب البيانات بذكاء
function getVal(data, keys) {
    for (let key of keys) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== 'null') {
            return data[key];
        }
    }
    return ''; 
}

function loadData(data) {
    console.log("Full Data:", data); 

    document.getElementById('edit-property-id').value = data.id;
    
    // البيانات الأساسية
    document.getElementById('edit-title').value = getVal(data, ['title', 'propertyTitle']);
    document.getElementById('edit-hidden-code').value = getVal(data, ['hiddenCode']);
    document.getElementById('edit-price').value = getVal(data, ['price', 'propertyPrice']);
    document.getElementById('edit-area').value = getVal(data, ['area', 'propertyArea']);
    document.getElementById('edit-rooms').value = getVal(data, ['rooms', 'propertyRooms']);
    document.getElementById('edit-bathrooms').value = getVal(data, ['bathrooms', 'propertyBathrooms']);
    document.getElementById('edit-description').value = getVal(data, ['description', 'propertyDescription']);

    // القوائم (تم التأكد من server.js)
    document.getElementById('edit-category').value = getVal(data, ['category', 'propertyCategory']) || 'apartment';
    document.getElementById('edit-type').value = getVal(data, ['type', 'propertyType']) || 'بيع';
    
    // ⚠️ أسماء الأعمدة الدقيقة في الداتابيز
    document.getElementById('edit-finishing').value = getVal(data, ['finishing_type', 'finishing']);
    document.getElementById('edit-level').value = getVal(data, ['level', 'propertyLevel']);
    document.getElementById('edit-floors').value = getVal(data, ['floors_count', 'floors']);

    toggleEditFields(); 

    // الخريطة
    const lat = getVal(data, ['latitude', 'lat']);
    const lng = getVal(data, ['longitude', 'lng']);
    
    if(lat && lng) {
        updateMarker(lat, lng);
        map.setView([lat, lng], 16);
    } else {
        if(marker) map.removeLayer(marker);
        map.setView([30.0444, 31.2357], 13);
    }

    // الصور القديمة
    const imgContainer = document.getElementById('existing-images-container');
    imgContainer.innerHTML = '';
    let rawImages = getVal(data, ['imageUrls', 'images']);
    let urls = [];

    if (Array.isArray(rawImages)) {
        urls = rawImages;
    } else if (typeof rawImages === 'string') {
        try { urls = JSON.parse(rawImages); } catch(e) { urls = []; }
    }

    document.getElementById('existing-images-data').value = JSON.stringify(urls);
    
    urls.forEach(url => {
        imgContainer.innerHTML += `
            <div class="existing-image-wrapper">
                <img src="${url}" class="preview-image">
                <button type="button" class="remove-img-btn" onclick="removeImg(this, '${url}')">×</button>
            </div>
        `;
    });

    // 🔥 إصلاح الفيديوهات (عمود video_urls)
    let rawVideos = getVal(data, ['video_urls']);
    
    if (rawVideos) {
        if (Array.isArray(rawVideos)) {
            currentVideoList = rawVideos;
        } else if (typeof rawVideos === 'string') {
            try { 
                // معالجة صيغة Postgres Array {url1,url2}
                let cleanStr = rawVideos.replace('{','').replace('}','').replace(/"/g, '');
                if(cleanStr.includes(',')) currentVideoList = cleanStr.split(',');
                else if(cleanStr) currentVideoList = [cleanStr];
                else currentVideoList = [];
            } catch(e) { currentVideoList = []; }
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
        let cleanLink = link.replace(/"/g, ''); 
        list.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom:8px; background:#222; padding:10px; border-radius:8px; align-items:center;">
                <a href="${cleanLink}" target="_blank" style="color:#fff; text-decoration:none; overflow:hidden; text-overflow:ellipsis; max-width:80%; font-size:0.9rem;">
                    <i class="fab fa-youtube" style="color:red; margin-left:5px;"></i> ${cleanLink}
                </a>
                <span onclick="deleteVideo(${i})" style="color:red; cursor:pointer; font-weight:bold; font-size:1.1rem;">&times;</span>
            </li>
        `;
    });
    document.getElementById('hidden-video-urls-input').value = JSON.stringify(currentVideoList);
}

function deleteVideo(i) { currentVideoList.splice(i, 1); renderVideos(); }

function showModal(type, title, text) {
    const m = document.getElementById('adminModal');
    const i = document.getElementById('modalIcon');
    const b = document.getElementById('modalButtons');
    m.style.display = 'flex';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    b.innerHTML = `<button onclick="closeModal()" class="modal-btn" style="background:#333; border:1px solid #555;">إغلاق</button>`;
    
    if(type === 'success') { i.className = 'fas fa-check-circle'; i.style.color = '#fff'; }
    else if(type === 'error') { i.className = 'fas fa-times-circle'; i.style.color = '#ff3333'; }
    else { i.className = 'fas fa-spinner fa-spin'; i.style.color = '#ccc'; b.innerHTML=''; }
}

function showConfirm(title, text, onYes) {
    const m = document.getElementById('adminModal');
    m.style.display = 'flex';
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modalIcon').className = 'fas fa-question-circle';
    document.getElementById('modalIcon').style.color = '#fff';
    
    const b = document.getElementById('modalButtons');
    b.innerHTML = '';
    
    const yes = document.createElement('button');
    yes.textContent = 'نعم، نفذ'; yes.className = 'modal-btn'; yes.style.background = '#fff'; yes.style.color='black';
    yes.onclick = onYes;
    
    const no = document.createElement('button');
    no.textContent = 'إلغاء'; no.className = 'modal-btn'; no.style.background = '#333'; no.style.color='white';
    no.style.border = '1px solid #555';
    no.onclick = closeModal;
    
    b.append(yes, no);
}

function closeModal() { document.getElementById('adminModal').style.display = 'none'; }
