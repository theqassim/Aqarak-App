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

// دالة إرسال النموذج (كما هي مع التعديلات السابقة)
document.getElementById('seller-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const msg = document.getElementById('seller-form-message');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص والرفع...';
    btn.disabled = true;
    if(msg) { msg.textContent = ''; msg.className = 'message'; }

    const formData = new FormData(form);

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
                const preview = document.getElementById('image-preview-container');
                if(preview) preview.innerHTML = '';
                
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

// معاينة الصور
const imgInput = document.getElementById('property-images');
if(imgInput) {
    imgInput.addEventListener('change', function(event) {
        const container = document.getElementById('image-preview-container');
        container.innerHTML = '';
        const files = event.target.files;

        if (files.length > 10) {
            alert("الحد الأقصى 10 صور فقط");
            this.value = "";
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = "80px";
                img.style.height = "80px";
                img.style.objectFit = "cover";
                img.style.borderRadius = "5px";
                img.style.margin = "5px";
                img.style.border = "1px solid #00ff88";
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
}

// تفعيل الحقول الإضافية
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
        else if (cat === 'villa' || cat === 'building') {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'block';
        } else {
            levelGroup.style.display = 'none';
            floorsGroup.style.display = 'none';
        }
    }
}