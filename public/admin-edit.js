let map, marker;
let currentVideoList = [];

document.addEventListener('DOMContentLoaded', () => {
    // تهيئة الخريطة
    map = L.map('map').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'OSM' }).addTo(map);
    map.on('click', (e) => updateMarker(e.latlng.lat, e.latlng.lng));

    const searchForm = document.getElementById('search-property-form');
    const editArea = document.getElementById('property-edit-area');
    const editForm = document.getElementById('edit-property-form');
    
    // البحث
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('search-code').value.trim();
        if(!code) return alert("أدخل الكود");
        
        try {
            const res = await fetch(`/api/property-by-code/${code}`);
            if(!res.ok) throw new Error('لم يتم العثور على العقار');
            const data = await res.json();
            loadData(data);
            editArea.style.display = 'block';
        } catch(err) { alert(err.message); }
    });

    // الحفظ
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!confirm('حفظ التعديلات؟')) return;
        
        const id = document.getElementById('edit-property-id').value;
        const formData = new FormData(editForm);
        
        try {
            const res = await fetch(`/api/update-property/${id}`, { method: 'PUT', body: formData });
            const data = await res.json();
            if(res.ok) alert('✅ تم الحفظ بنجاح');
            else alert('❌ ' + data.message);
        } catch(e) { alert('خطأ في الاتصال'); }
    });

    // حذف العقار
    document.getElementById('delete-property-btn').addEventListener('click', async () => {
        const id = document.getElementById('edit-property-id').value;
        if(!confirm('⚠️ هل أنت متأكد من المسح النهائي؟')) return;
        
        try {
            await fetch(`/api/property/${id}`, { method: 'DELETE' });
            alert('تم المسح');
            location.reload();
        } catch(e) { alert('خطأ'); }
    });

    // منطق الفيديوهات
    document.getElementById('add-video-btn').addEventListener('click', () => {
        const url = document.getElementById('video-url-input').value;
        if(url) { currentVideoList.push(url); renderVideos(); document.getElementById('video-url-input').value = ''; }
    });
});

function loadData(data) {
    document.getElementById('edit-property-id').value = data.id;
    document.getElementById('edit-title').value = data.title;
    document.getElementById('edit-hidden-code').value = data.hiddenCode;
    document.getElementById('edit-price').value = data.price;
    document.getElementById('edit-area').value = data.area;
    document.getElementById('edit-rooms').value = data.rooms || '';
    document.getElementById('edit-bathrooms').value = data.bathrooms || '';
    document.getElementById('edit-description').value = data.description;
    
    // الحقول الجديدة
    document.getElementById('edit-category').value = data.category || 'apartment';
    document.getElementById('edit-type').value = data.type;
    document.getElementById('edit-finishing').value = data.finishing || '';
    document.getElementById('edit-level').value = data.level || '';
    document.getElementById('edit-floors').value = data.floors || '';

    toggleEditFields(); // تحديث الحقول الظاهرة بناءً على الفئة

    // الخريطة
    if(data.latitude && data.longitude) {
        updateMarker(data.latitude, data.longitude);
        map.setView([data.latitude, data.longitude], 15);
    }
    setTimeout(() => map.invalidateSize(), 500); // إصلاح مشكلة تحميل الخريطة في العناصر المخفية

    // الصور القديمة
    const imgContainer = document.getElementById('existing-images-container');
    imgContainer.innerHTML = '';
    const urls = data.imageUrls || [];
    document.getElementById('existing-images-data').value = JSON.stringify(urls);
    
    urls.forEach(url => {
        const div = document.createElement('div');
        div.innerHTML = `
            <img src="${url}" style="width:60px; height:60px; border-radius:5px;">
            <span onclick="removeImg(this, '${url}')" style="color:red; cursor:pointer; font-weight:bold;">×</span>
        `;
        imgContainer.appendChild(div);
    });

    // الفيديوهات
    currentVideoList = data.video_urls || [];
    renderVideos();
}

function updateMarker(lat, lng) {
    if(marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    document.getElementById('edit-lat').value = lat;
    document.getElementById('edit-lng').value = lng;
}

function removeImg(el, url) {
    el.parentElement.remove();
    let urls = JSON.parse(document.getElementById('existing-images-data').value);
    urls = urls.filter(u => u !== url);
    document.getElementById('existing-images-data').value = JSON.stringify(urls);
}

function renderVideos() {
    const list = document.getElementById('video-list-container');
    list.innerHTML = '';
    currentVideoList.forEach((v, i) => {
        list.innerHTML += `<li><a href="${v}" target="_blank" style="color:#00d4ff;">${v}</a> <span onclick="deleteVideo(${i})" style="color:red; cursor:pointer;">[حذف]</span></li>`;
    });
    document.getElementById('hidden-video-urls-input').value = JSON.stringify(currentVideoList);
}

function deleteVideo(i) {
    currentVideoList.splice(i, 1);
    renderVideos();
}

function toggleEditFields() {
    const cat = document.getElementById('edit-category').value;
    const levelGroup = document.getElementById('edit-level-group');
    const floorsGroup = document.getElementById('edit-floors-group');
    
    if(cat === 'apartment' || cat === 'office' || cat === 'store') {
        levelGroup.style.display = 'block'; floorsGroup.style.display = 'none';
    } else if (cat === 'villa' || cat === 'building' || cat === 'warehouse') {
        levelGroup.style.display = 'none'; floorsGroup.style.display = 'block';
    } else {
        levelGroup.style.display = 'none'; floorsGroup.style.display = 'none';
    }
}