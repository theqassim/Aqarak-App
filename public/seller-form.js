document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    // الحد الأقصى: 10 ميجابايت
    const MAX_SIZE = 10 * 1024 * 1024;

    // مصفوفة لتخزين كل الملفات المختارة
    let allSelectedFiles = []; 

    // --- منطق اختيار الفئة (Category Logic) ---
    window.selectCategory = (type) => {
        const selectionDiv = document.getElementById('category-selection');
        const formDiv = document.getElementById('form-container');
        const typeInput = document.getElementById('property-type'); // الحقل المخفي

        // 1. إخفاء الاختيار وإظهار الفورم
        selectionDiv.style.display = 'none';
        formDiv.style.display = 'block';
        formDiv.classList.add('fade-in'); // أنيميشن بسيط لو حابب

        // 2. ضبط القيمة المخفية
        // سنستخدم الأسماء العربية المتوافقة مع قاعدة البيانات
        let dbType = 'بيع'; // افتراضي
        if (type === 'residential') dbType = 'سكني (شقة/فيلا)';
        if (type === 'commercial') dbType = 'تجاري (محل/مخزن)';
        if (type === 'land') dbType = 'أرض';
        
        typeInput.value = dbType;

        // 3. إظهار/إخفاء الحقول حسب النوع
        const roomsField = document.getElementById('field-rooms');
        const bathsField = document.getElementById('field-bathrooms');
        const roomsInput = document.getElementById('property-rooms');
        const bathsInput = document.getElementById('property-bathrooms');

        if (type === 'land') {
            // لو أرض: اخفي الغرف والحمامات
            roomsField.style.display = 'none';
            bathsField.style.display = 'none';
            // إزالة شرط required وتصفير القيمة عشان السيرفر ميضربش
            roomsInput.removeAttribute('required');
            bathsInput.removeAttribute('required');
            roomsInput.value = 0;
            bathsInput.value = 0;
        } else if (type === 'commercial') {
            // لو تجاري: ممكن نخلي الغرف (كـ عدد الغرف/المكاتب) ونخفي الحمامات أو نسيبها
            roomsField.style.display = 'block';
            bathsField.style.display = 'block'; // المحلات غالباً فيها حمام
            
            // تغيير الليبل (Label) ليناسب المحلات
            roomsField.querySelector('label').innerText = 'عدد الغرف / المكاتب';
        } else {
            // سكني: اظهر كل حاجة ورجع required
            roomsField.style.display = 'block';
            bathsField.style.display = 'block';
            roomsField.querySelector('label').innerText = 'عدد الغرف';
            
            roomsInput.setAttribute('required', 'true');
            bathsInput.setAttribute('required', 'true');
            // تفريغ القيم لو كانت صفر
            if(roomsInput.value == 0) roomsInput.value = '';
            if(bathsInput.value == 0) bathsInput.value = '';
        }
    };

    // زر العودة
    window.resetSelection = () => {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('category-selection').style.display = 'grid';
    };

    // --- دالة عرض المعاينة ---
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
                
                // فحص الحجم وتظليل الصورة
                if (file.size > MAX_SIZE) {
                    imgWrapper.classList.add('invalid-file');
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'error-overlay';
                    errorOverlay.textContent = 'حجم كبير جداً';
                    imgWrapper.appendChild(errorOverlay);
                }

                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image');
                
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.setAttribute('data-index', index);

                removeBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    removeFileByIndex(index);
                });

                imgWrapper.appendChild(img);
                imgWrapper.appendChild(removeBtn);
                previewContainer.appendChild(imgWrapper);
            }
            
            if (file instanceof File) {
                 reader.readAsDataURL(file);
            }
        });
    }

    // --- دالة حذف ملف ---
    function removeFileByIndex(indexToRemove) {
        allSelectedFiles = allSelectedFiles.filter((_, index) => index !== indexToRemove);
        renderPreviews(); 
    }

    // --- عند اختيار صور جديدة ---
    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            const newFiles = Array.from(event.target.files);
            allSelectedFiles.push(...newFiles);
            imageInput.value = '';
            renderPreviews(); 
        });
    }

    // --- عند إرسال النموذج ---
    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // إعادة تعيين الرسالة في البداية
            messageEl.textContent = 'جاري التحقق من الملفات...';
            messageEl.style.color = ''; // إعادة اللون للافتراضي
            messageEl.className = 'info';

            // 1. التحقق من الصور الكبيرة
            const hasLargeFiles = allSelectedFiles.some(file => file.size > MAX_SIZE);
            if (hasLargeFiles) {
                messageEl.textContent = '⚠️ لا يمكن الإرسال: يوجد صور تتخطى 10 ميجابايت (المظللة بالأحمر). يرجى حذفها.';
                messageEl.className = 'error';
                messageEl.style.color = '#ff4444';
                return;
            }

            // 2. التحقق من وجود صور
            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'يرجى اختيار صورة واحدة على الأقل.';
                messageEl.className = 'error';
                messageEl.style.color = '#ff4444';
                return;
            }

            // ✅ التغيير المطلوب: رسالة الانتظار باللون الأخضر
            messageEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> برجاء الانتظار جاري ارسال البيانات...';
            messageEl.className = 'info';
            messageEl.style.color = '#28a745'; // اللون الأخضر

            
            const formData = new FormData(sellerForm);
            
            formData.delete('images[]'); 
            for (let i = 0; i < allSelectedFiles.length; i++) {
                formData.append('images', allSelectedFiles[i]); 
            }

            try {
                const response = await fetch('/api/submit-seller-property', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json(); 

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في إرسال البيانات.');
                }
                
                window.location.href = 'thank-you';

            } catch (error) {
                messageEl.textContent = `فشل الإرسال: ${error.message}`;
                messageEl.className = 'error';
                messageEl.style.color = '#ff4444'; // إعادة اللون للأحمر عند الخطأ
            }
        });
    }

    // CSS Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .image-preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            padding: 10px;
            border-radius: 8px;
            min-height: 50px;
        }
        .preview-image-wrapper {
            position: relative;
            width: 100px;
            height: 70px;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .preview-image-wrapper.invalid-file {
            border: 2px solid #ff4444;
        }
        .preview-image-wrapper.invalid-file img {
            filter: grayscale(100%) brightness(0.7);
        }
        .error-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(220, 53, 69, 0.9);
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 3px;
            white-space: nowrap;
            z-index: 10;
            pointer-events: none;
        }

        .remove-preview-btn {
            position: absolute;
            top: 2px;
            right: 2px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            cursor: pointer;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .remove-preview-btn:hover {
            background: #cc0000;
        }
    `;
    document.head.appendChild(style);
});