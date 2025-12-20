// مصفوفة لتخزين الملفات المختارة (عشان نعرف نمسح منها براحتنا)
let selectedFiles = []; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب بيانات المستخدم وتعبئة الحقول تلقائياً
    await fetchUserData();

    // 2. تفعيل منطق الحقول (إظهار/إخفاء الحقول حسب نوع العقار)
    const catSelect = document.getElementById('property-category');
    if (catSelect) {
        catSelect.addEventListener('change', toggleFields);
        toggleFields(); // تشغيل مرة واحدة في البداية
    }
});

// دالة جلب بيانات المستخدم
async function fetchUserData() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            // تعبئة الاسم
            const nameField = document.getElementById('seller-name');
            if (nameField) nameField.value = data.name || 'مستخدم عقارك';

            // تعبئة الهاتف
            const phoneField = document.getElementById('seller-phone');
            if (phoneField) phoneField.value = data.phone || '';
        } else {
            // لو مش مسجل دخول، حوله لصفحة الدخول
            window.location.href = 'index'; 
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// ==========================================================
// 📸 منطق الصور الجديد (معاينة + حذف + تظليل الحجم الكبير)
// ==========================================================
const imgInput = document.getElementById('property-images');

if (imgInput) {
    imgInput.addEventListener('change', function(event) {
        const newFiles = Array.from(event.target.files);
        
        // إضافة الملفات الجديدة للمصفوفة (مع منع التكرار البسيط)
        newFiles.forEach(file => {
            // إضافة الملف للقائمة
            selectedFiles.push(file);
        });

        if (selectedFiles.length > 10) {
            alert("⚠️ الحد الأقصى 10 صور فقط. تم الاحتفاظ بأول 10 صور.");
            selectedFiles = selectedFiles.slice(0, 10);
        }

        renderPreviews();
        
        // تفريغ الـ Input عشان لو اخترت نفس الملف تاني يشتغل
        this.value = ''; 
    });
}

function renderPreviews() {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = ''; // مسح القديم

    selectedFiles.forEach((file, index) => {
        const isTooBig = file.size > 10 * 1024 * 1024; // أكبر من 10 ميجا

        // 1. الغلاف (Wrapper)
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.margin = '10px';
        wrapper.style.width = '100px';
        wrapper.style.height = '100px';

        // 2. الصورة
        const img = document.createElement('img');
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        img.style.border = isTooBig ? "2px solid #ff4444" : "1px solid #00ff88"; // أحمر لو كبير
        
        // قراءة الملف للعرض
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        
        wrapper.appendChild(img);

        // 3. طبقة تظليل لو الحجم كبير (Overlay)
        if (isTooBig) {
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0, 0, 0, 0.7)'; // لون أسود شفاف
            overlay.style.color = '#ff4444';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.fontSize = '0.8rem';
            overlay.style.fontWeight = 'bold';
            overlay.style.borderRadius = '8px';
            overlay.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>حجم كبير</span><span>>10MB</span>';
            wrapper.appendChild(overlay);
        }

        // 4. زر الحذف (X)
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '-8px';
        removeBtn.style.right = '-8px';
        removeBtn.style.background = '#ff4444';
        removeBtn.style.color = 'white';
        removeBtn.style.border = '2px solid white';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '24px';
        removeBtn.style.height = '24px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.display = 'flex';
        removeBtn.style.justifyContent = 'center';
        removeBtn.style.alignItems = 'center';
        removeBtn.style.fontSize = '12px';
        removeBtn.style.zIndex = '10';
        removeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        // وظيفة الحذف
        removeBtn.onclick = (e) => {
            e.preventDefault(); // منع إرسال الفورم
            selectedFiles.splice(index, 1); // حذف من المصفوفة
            renderPreviews(); // إعادة الرسم
        };

        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

// ==========================================================
// 🚀 دالة الإرسال المعدلة (تبعت الصور من المصفوفة)
// ==========================================================
document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص والرفع...';
    btn.disabled = true;
    if(msg) { msg.textContent = ''; msg.className = 'message'; }

    // إنشاء FormData
    const formData = new FormData(form);

    // ⚠️ مهم: مسح الصور القديمة اللي جاية من الـ Input العادي
    // لأننا هنضيف الصور من مصفوفتنا selectedFiles يدوياً
    formData.delete('images[]'); 
    formData.delete('images'); // للاحتياط حسب اسم الحقل

    // إضافة الصور الصالحة فقط (أقل من 10 ميجا)
    let validImagesCount = 0;
    selectedFiles.forEach(file => {
        if (file.size <= 10 * 1024 * 1024) { // 10MB
            // اسم الحقل لازم يكون 'images' عشان يطابق multer في server.js
            formData.append('images', file); 
            validImagesCount++;
        }
    });

    if (validImagesCount === 0 && selectedFiles.length > 0) {
        alert("⚠️ جميع الصور المختارة حجمها كبير جداً. يرجى اختيار صور أقل من 10 ميجا.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const response = await fetch('/api/submit-seller-property', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            if (data.status === 'approved') {
                if(msg) {
                    msg.textContent = '🎉 ' + data.message;
                    msg.className = 'message success';
                }
                form.reset();
                selectedFiles = []; // تصفير المصفوفة
                renderPreviews();   // تصفير المعاينة
                
                setTimeout(() => window.location.href = 'home', 2000);
            } 
            else {
                // عرض رسالة المراجعة
                let aiReasonHtml = '';
                if (data.aiReason) {
                    aiReasonHtml = `
                        <div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.1); border-radius:5px; border-right:3px solid #ff9800; text-align:right;">
                            <strong>💡 ملحوظة المراجعة:</strong><br>
                            ${data.aiReason}
                        </div>
                    `;
                }

                const alertDiv = document.createElement('div');
                alertDiv.innerHTML = `
                    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center;">
                        <div class="neon-glow" style="background:#1c2630; padding:30px; border-radius:15px; max-width:90%; width:400px; text-align:center; border:1px solid #ff9800;">
                            <i class="fas fa-clipboard-check" style="font-size:3rem; color:#ff9800; margin-bottom:15px;"></i>
                            <h3 style="color:#fff; margin-bottom:10px;">تم استلام الطلب</h3>
                            <p style="color:#ccc;">عقارك الآن قيد المراجعة اليدوية.</p>
                            ${aiReasonHtml}
                            <button onclick="window.location.href='home'" class="btn-neon-auth" style="margin-top:20px; width:100%;">عودة للرئيسية</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(alertDiv);
                form.reset();
                selectedFiles = [];
                renderPreviews();
            }

        } else {
            throw new Error(data.message || 'حدث خطأ ما');
        }

    } catch (error) {
        console.error(error);
        if(msg) {
            msg.textContent = '❌ ' + error.message;
            msg.className = 'message error';
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// تفعيل الحقول الإضافية (Toggle Fields)
function toggleFields() {
    const catElement = document.getElementById('property-category');
    if(!catElement) return;
    
    const cat = catElement.value;
    const levelGroup = document.getElementById('level-group');
    const floorsGroup = document.getElementById('floors-count-group');

    if(levelGroup && floorsGroup) {
        if(cat === 'apartment' || cat === 'office' || cat === 'store') {
            levelGroup.style.display = 'block';
            floorsGroup.style.display = 'none';
        } 
        else if (cat === 'villa' || cat === 'building' || cat === 'warehouse') {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'block';
        } else {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'none';
        }
    }
}