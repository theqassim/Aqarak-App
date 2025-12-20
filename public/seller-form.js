document.addEventListener('DOMContentLoaded', async () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    // ==========================================================
    // 🛠️ 1. التحكم الديناميكي في الحقول (إخفاء/إظهار)
    // ==========================================================
    window.toggleFields = function() {
        const category = document.getElementById('property-category').value;
        
        // المجموعات (Containers)
        const roomsGroup = document.getElementById('rooms-group');
        const bathGroup = document.getElementById('bath-group');
        const levelGroup = document.getElementById('level-group');        
        const floorsCountGroup = document.getElementById('floors-count-group'); 
        const finishingGroup = document.getElementById('finishing-group');

        // وصف (لتغيير الـ Placeholder)
        const descInput = document.getElementById('property-description');

        // دالة مساعدة للإظهار والإخفاء مع التحكم في required
        const show = (el, isRequired = false) => {
            el.style.display = 'block';
            const input = el.querySelector('input, select');
            if(isRequired && input) input.setAttribute('required', 'true');
        };

        const hide = (el) => {
            el.style.display = 'none';
            const input = el.querySelector('input, select');
            if(input) { 
                input.removeAttribute('required'); 
                input.value = ''; // تصفير القيمة عشان متبعتش داتا غلط
            }
        };

        // 🔄 تصفير الحالة (إخفاء الكل مبدئياً)
        hide(roomsGroup); hide(bathGroup); hide(levelGroup); hide(floorsCountGroup); hide(finishingGroup);
        descInput.placeholder = "اكتب تفاصيل العقار والمميزات...";

        // --- تطبيق المنطق ---

        if (category === 'apartment') {
            // شقة: غرف + حمام + دور كام + تشطيب
            show(roomsGroup, true);
            show(bathGroup, true);
            show(levelGroup, true);
            show(finishingGroup, true);
            descInput.placeholder = "تشطيب سوبر لوكس، فيو حديقة، بحري...";
        } 
        else if (category === 'villa') {
            // فيلا: غرف + حمام + عدد أدوار المبنى + تشطيب
            show(roomsGroup, true);
            show(bathGroup, true);
            show(floorsCountGroup, true);
            show(finishingGroup, true);
            descInput.placeholder = "حديقة خاصة، حمام سباحة، جراج خاص...";
        }
        else if (category === 'office') {
            // مكتب/عيادة: دور كام + تشطيب (حمام اختياري)
            show(bathGroup); // اختياري (ممكن ميكونش فيه)
            show(levelGroup, true);
            show(finishingGroup, true);
            descInput.placeholder = "مساحة مفتوحة، مرخصة إداري، تكييف مركزي...";
        }
        else if (category === 'store') {
            // محل: تشطيب (ممكن حمام)
            show(bathGroup); 
            show(finishingGroup, true);
            descInput.placeholder = "واجهة زجاجية، رخصة تجاري، منطقة حيوية...";
        }
        else if (category === 'building') {
            // عمارة: عدد الأدوار + تشطيب
            show(floorsCountGroup, true);
            show(finishingGroup); // ممكن تكون طوب أحمر
            descInput.placeholder = "عدد الشقق، مساحة الأرض، الدخل الشهري المتوقع...";
        }
        else if (category === 'land') {
            // أرض: مساحة وسعر فقط (تم إخفاء الباقي)
            descInput.placeholder = "تراخيص البناء، واجهة على الشارع، صرف ومياه...";
        }
        else if (category === 'warehouse') {
            // مخزن: مساحة وسعر
            descInput.placeholder = "ارتفاع السقف، دخول سيارات نقل، كهرباء 3 فاز...";
        }
    };

    // تشغيل الدالة فوراً لضبط الوضع الافتراضي
    toggleFields();


    // ==========================================================
    // 🔒 2. التحقق من المستخدم
    // ==========================================================
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        if (userData.isAuthenticated) {
            const nameField = document.getElementById('seller-name');
            const phoneField = document.getElementById('seller-phone');
            nameField.value = userData.name || userData.username || 'مستخدم عقارك';
            phoneField.value = userData.phone;
        } else {
            alert('يجب تسجيل الدخول أولاً لعرض عقارك!');
            window.location.href = 'login';
            return;
        }
    } catch (error) {
        window.location.href = 'index';
        return;
    }


    // ==========================================================
    // 📸 3. معالجة الصور (رفع ومعاينة)
    // ==========================================================
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
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

    // ==========================================================
    // 🚀 4. إرسال النموذج
    // ==========================================================
    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            messageEl.textContent = 'جاري التحقق...'; messageEl.className = 'info';

            // تحقق بسيط من الصور
            if (allSelectedFiles.some(file => file.size > MAX_SIZE)) {
                messageEl.textContent = '⚠️ صور كبيرة الحجم، يرجى حذفها.'; messageEl.className = 'error'; return;
            }
            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'اختر صورة واحدة على الأقل.'; messageEl.className = 'error'; return;
            }

            messageEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري رفع الصور ومعالجة الطلب...';

            const formData = new FormData(sellerForm);
            // حذف الصور الفارغة وإضافة الصور الحقيقية من المصفوفة
            formData.delete('images[]'); 
            allSelectedFiles.forEach(file => formData.append('images', file));

            try {
                const response = await fetch('/api/submit-seller-property', { method: 'POST', body: formData });
                const data = await response.json(); 
                
                if (!response.ok) throw new Error(data.message);
                
                // التوجيه أو رسالة النجاح
                if (data.message && data.message.includes('تمت الموافقة')) {
                    alert('🎉 مبروك! عقارك تم فحصه ونشره فوراً.');
                } else {
                    alert('✅ تم استلام طلبك، سيتم مراجعته قريباً.');
                }
                window.location.href = 'home'; // أو صفحة الشكر
                
            } catch (error) {
                messageEl.textContent = `فشل: ${error.message}`; messageEl.className = 'error';
            }
        });
    }

    // Styles for Preview (CSS Injected)
    const style = document.createElement('style');
    style.innerHTML = `
        .image-preview-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; padding: 10px; border-radius: 8px; min-height: 50px; }
        .preview-image-wrapper { position: relative; width: 100px; height: 70px; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .preview-image { width: 100%; height: 100%; object-fit: cover; }
        .preview-image-wrapper.invalid-file { border: 2px solid #ff4444; }
        .preview-image-wrapper.invalid-file img { filter: grayscale(100%) brightness(0.7); }
        .error-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(220, 53, 69, 0.9); color: white; font-size: 10px; padding: 2px 5px; border-radius: 3px; pointer-events: none; }
        .remove-preview-btn { position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    `;
    document.head.appendChild(style);
});