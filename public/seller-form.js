// مصفوفة لتخزين الملفات المختارة
let selectedFiles = []; 
let map, marker;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب بيانات المستخدم
    await fetchUserData();

    // 2. تفعيل منطق الحقول
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields();
    }

    // 3. 🌍 تهيئة الخريطة
    initMap();
});

// --- دوال الخريطة والخدمات الذكية ---
function initMap() {
    // إحداثيات افتراضية (القاهرة)
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // محاولة جلب موقع المستخدم الحالي
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15);
        });
    }

    // عند الضغط على الخريطة
    map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        setMarker(lat, lng);
        
        // ✨ تشغيل التحليل الذكي للخدمات
        await fetchNearbyServices(lat, lng);
    });
}

function setMarker(lat, lng) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup("تم تحديد موقع العقار").openPopup();
    
    // تخزين الإحداثيات في الحقول المخفية
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
}

// 🤖 دالة جلب الخدمات المحيطة (AI Analysis)
async function fetchNearbyServices(lat, lng) {
    const statusMsg = document.querySelector('.map-note span');
    const originalText = statusMsg.innerText;
    statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تحليل المنطقة والبحث عن الخدمات...';
    statusMsg.style.color = '#00d4ff';

    // استعلام Overpass API لجلب (مدارس، مستشفيات، ماركت، بنوك) في دائرة 1000 متر
    const query = `
        [out:json];
        (
          node["amenity"~"school|hospital|university|bank|marketplace|pharmacy"](around:1000, ${lat}, ${lng});
          way["amenity"~"school|hospital|university|bank|marketplace|pharmacy"](around:1000, ${lat}, ${lng});
        );
        out center 5;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        const data = await response.json();
        
        // استخراج الأسماء الفريدة
        const services = new Set();
        data.elements.forEach(el => {
            if (el.tags.name) services.add(el.tags.name); // الاسم بالعربي أو الإنجليزي
            else if (el.tags.amenity) services.add(el.tags.amenity); // نوع الخدمة لو مفيش اسم
        });

        // تحويلها لنص وتخزينها
        const servicesArray = Array.from(services).slice(0, 8); // ناخد أول 8 خدمات بس
        const servicesString = servicesArray.join(', ');
        
        document.getElementById('nearby_services').value = servicesString;

        if (servicesArray.length > 0) {
            statusMsg.innerHTML = `✅ تم العثور على: ${servicesArray.length} خدمات قريبة (مدارس، مستشفيات، إلخ).`;
            statusMsg.style.color = '#00ff88';
        } else {
            statusMsg.innerHTML = '⚠️ المنطقة هادئة، لم يتم العثور على معالم رئيسية مسجلة.';
            statusMsg.style.color = '#ffd700';
        }

    } catch (error) {
        console.error("Error fetching POIs:", error);
        statusMsg.innerText = originalText; // استعادة النص الأصلي في حالة الخطأ
    }
}

// دالة جلب بيانات المستخدم
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
    } catch (error) { console.error(error); }
}

// ==========================================================
// 📸 منطق الصور (نفس الكود السابق مع الاحتفاظ به)
// ==========================================================
const imgInput = document.getElementById('property-images');
if (imgInput) {
    imgInput.addEventListener('change', function(event) {
        const newFiles = Array.from(event.target.files);
        newFiles.forEach(file => selectedFiles.push(file));
        if (selectedFiles.length > 10) {
            alert("⚠️ الحد الأقصى 10 صور فقط.");
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
        img.style.cssText = `width:100%; height:100%; object-fit:cover; border-radius:8px; border:${isTooBig ? "2px solid red" : "1px solid #00ff88"};`;
        
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.cssText = 'position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:24px; height:24px; cursor:pointer; border:2px solid white; display:flex; justify-content:center; align-items:center;';
        removeBtn.onclick = (e) => { e.preventDefault(); selectedFiles.splice(index, 1); renderPreviews(); };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

// ==========================================================
// 🚀 دالة الإرسال المعدلة (تشمل الإحداثيات والخدمات)
// ==========================================================
document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    // التحقق من تحديد الموقع
    if (!document.getElementById('lat').value) {
        alert("📍 من فضلك حدد موقع العقار على الخريطة لزيادة فرص البيع!");
        // سكرول للخريطة
        document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع والتحليل...';
    btn.disabled = true;
    if(msg) msg.textContent = '';

    const formData = new FormData(form);
    formData.delete('images[]'); 
    
    let validImagesCount = 0;
    selectedFiles.forEach(file => {
        if (file.size <= 10 * 1024 * 1024) { 
            formData.append('images', file); 
            validImagesCount++;
        }
    });

    if (validImagesCount === 0 && selectedFiles.length > 0) {
        alert("⚠️ الصور كبيرة جداً. اختر صور أقل من 10 ميجا.");
        btn.innerHTML = originalText; btn.disabled = false; return;
    }

    try {
        const response = await fetch('/api/submit-seller-property', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            const successDiv = document.createElement('div');
            successDiv.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center;">
                    <div class="neon-glow" style="background:#1c2630; padding:30px; border-radius:15px; width:400px; text-align:center; border:1px solid #00ff88;">
                        <i class="fas fa-check-circle" style="font-size:3rem; color:#00ff88; margin-bottom:15px;"></i>
                        <h3 style="color:#fff;">تم نشر عقارك بنجاح! 🚀</h3>
                        <p style="color:#ccc;">تم حفظ الموقع والخدمات القريبة.</p>
                        ${data.status !== 'approved' ? '<p style="color:#ff9800; font-size:0.9rem;">(قيد المراجعة)</p>' : ''}
                        <button onclick="window.location.href='home'" class="btn-neon-auth" style="margin-top:20px; width:100%;">العودة للرئيسية</button>
                    </div>
                </div>
            `;
            document.body.appendChild(successDiv);
            form.reset(); selectedFiles = []; renderPreviews();
        } else {
            throw new Error(data.message);
        }
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