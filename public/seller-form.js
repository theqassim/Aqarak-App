document.addEventListener('DOMContentLoaded', async () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    // 🆕 دالة التحكم في الحقول (ديناميكي)
    window.toggleFields = function() {
        const category = document.getElementById('property-category').value;
        const roomsGroup = document.getElementById('rooms-group');
        const bathGroup = document.getElementById('bath-group');
        const roomsInput = document.getElementById('property-rooms');
        const bathInput = document.getElementById('property-bathrooms');

        // الحالة 1: أرض أو مخزن (نخفي الغرف والحمامات)
        if (category === 'land' || category === 'warehouse') {
            roomsGroup.style.display = 'none';
            bathGroup.style.display = 'none';
            roomsInput.value = 0; // تصفير القيم
            bathInput.value = 0;
            roomsInput.removeAttribute('required'); // إلغاء الإجبار
            bathInput.removeAttribute('required');
        }
        // الحالة 2: محل (نخفي الغرف فقط - اختياري، أو نخليها مخزن)
        else if (category === 'store') {
            roomsGroup.style.display = 'none'; // المحل عادة مساحة مفتوحة
            bathGroup.style.display = 'block'; // ممكن يكون فيه حمام
            roomsInput.value = 0;
            roomsInput.removeAttribute('required');
            bathInput.setAttribute('required', 'true');
        }
        // الحالة 3: شقة/فيلا/عمارة (نظهر الكل)
        else {
            roomsGroup.style.display = 'block';
            bathGroup.style.display = 'block';
            // لو القيم صفر، نمسحها عشان يكتب
            if(roomsInput.value == 0) roomsInput.value = '';
            if(bathInput.value == 0) bathInput.value = '';
            roomsInput.setAttribute('required', 'true');
            bathInput.setAttribute('required', 'true');
        }
    };

    // تشغيل الدالة مرة عند التحميل لضبط الوضع الافتراضي
    toggleFields();

    // 🔒 1. جلب بيانات المستخدم
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        if (userData.isAuthenticated) {
            const nameField = document.getElementById('seller-name');
            const phoneField = document.getElementById('seller-phone');
            nameField.value = userData.name || userData.username || 'مستخدم عقارك';
            phoneField.value = userData.phone;
            nameField.setAttribute('readonly', true);
            phoneField.setAttribute('readonly', true);
        } else {
            alert('يجب تسجيل الدخول أولاً لعرض عقارك!');
            window.location.href = 'login';
            return;
        }
    } catch (error) {
        window.location.href = 'index';
        return;
    }

    // ... (باقي كود الصور والـ Upload زي ما هو بدون تغيير) ...
    const MAX_SIZE = 10 * 1024 * 1024;
    let allSelectedFiles = []; 

    function renderPreviews() {
        previewContainer.innerHTML = ''; 
        if (allSelectedFiles.length === 0) {
            previewContainer.style.border = "1px dashed rgba(255, 255, 255, 0.3)";
            return;
        }
        previewContainer.style.border = "1px solid var(--success-color)";

        allSelectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'preview-image-wrapper';
                if (file.size > MAX_SIZE) {
                    imgWrapper.classList.add('invalid-file');
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'error-overlay'; errorOverlay.textContent = 'حجم كبير';
                    imgWrapper.appendChild(errorOverlay);
                }
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image');
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.onclick = (e) => { e.preventDefault(); removeFileByIndex(index); };
                imgWrapper.appendChild(img); imgWrapper.appendChild(removeBtn);
                previewContainer.appendChild(imgWrapper);
            }
            if (file instanceof File) reader.readAsDataURL(file);
        });
    }

    function removeFileByIndex(indexToRemove) {
        allSelectedFiles = allSelectedFiles.filter((_, index) => index !== indexToRemove);
        renderPreviews(); 
    }

    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            allSelectedFiles.push(...Array.from(event.target.files));
            imageInput.value = ''; renderPreviews(); 
        });
    }

    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            messageEl.textContent = 'جاري التحقق...'; messageEl.className = 'info';

            if (allSelectedFiles.some(file => file.size > MAX_SIZE)) {
                messageEl.textContent = '⚠️ صور كبيرة الحجم، يرجى حذفها.'; messageEl.className = 'error'; return;
            }
            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'اختر صورة واحدة على الأقل.'; messageEl.className = 'error'; return;
            }

            messageEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

            const formData = new FormData(sellerForm);
            formData.delete('images[]'); 
            allSelectedFiles.forEach(file => formData.append('images', file));

            try {
                const response = await fetch('/api/submit-seller-property', { method: 'POST', body: formData });
                const data = await response.json(); 
                if (!response.ok) throw new Error(data.message);
                
                // عرض رسالة النجاح حسب رد السيرفر (هل تم النشر فوراً أم مراجعة)
                if (data.message.includes('تمت الموافقة')) {
                    alert('🎉 مبروك! عقارك تم نشره فوراً بنجاح.');
                } else {
                    alert('✅ تم استلام طلبك وسيتم مراجعته قريباً.');
                }
                window.location.href = 'thank-you';
            } catch (error) {
                messageEl.textContent = `فشل: ${error.message}`; messageEl.className = 'error';
            }
        });
    }
});