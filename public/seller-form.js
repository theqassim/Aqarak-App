// seller-form.js (معدل لدعم اختيار صور متعدد الجلسات)

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    // 🚨 1. مصفوفة عالمية لحفظ جميع الملفات المختارة من جميع الجلسات
    let allSelectedFiles = []; 

    // --- الدوال المساعدة ---

    // دالة لعرض جميع الملفات في المعرض
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
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image');
                
                // زر حذف الصورة
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-preview-btn');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.setAttribute('data-index', index); // لتحديد الملف المراد حذفه

                removeBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    removeFileByIndex(index);
                });

                imgWrapper.appendChild(img);
                imgWrapper.appendChild(removeBtn);
                previewContainer.appendChild(imgWrapper);
            }
            // قراءة الملف فقط إذا لم يتم قراءته مسبقًا
            if (file instanceof File) {
                 reader.readAsDataURL(file);
            }
        });
    }

    // دالة لحذف ملف من المصفوفة بناءً على الفهرس
    function removeFileByIndex(indexToRemove) {
        // إعادة بناء المصفوفة باستثناء الملف المراد حذفه
        allSelectedFiles = allSelectedFiles.filter((_, index) => index !== indexToRemove);
        renderPreviews(); // إعادة عرض المعرض
        
        // يجب تحديث فهرس زر الحذف بعد الحذف
        // أفضل طريقة هي إعادة تحميل المستمعات بعد إعادة العرض
        document.querySelectorAll('.remove-preview-btn').forEach((btn, newIndex) => {
             btn.setAttribute('data-index', newIndex);
        });
    }

    // --- منطق استعراض الصور ---

    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            const newFiles = Array.from(event.target.files);
            
            // 🚨 2. دمج الملفات الجديدة مع القديمة
            allSelectedFiles.push(...newFiles);
            
            // 🚨 3. مسح المدخل الأصلي لمنع تكرار الرفع والاعتماد على المصفوفة
            imageInput.value = ''; 
            
            renderPreviews(); // تحديث المعرض
        });
    }

    // --- منطق الإرسال إلى السيرفر ---

    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            messageEl.textContent = 'جاري إرسال البيانات والصور...';
            messageEl.className = 'info';

            const formData = new FormData(sellerForm);
            
            // 🚨 4. إزالة حقل الصور القديم الذي تم تفريغه
            formData.delete('images[]'); 
            
            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'يرجى اختيار صورة واحدة على الأقل.';
                messageEl.className = 'error';
                return;
            }
            
            // 🚨 5. إضافة الملفات من المصفوفة المجمعة إلى FormData
            for (let i = 0; i < allSelectedFiles.length; i++) {
                // يجب أن يطابق هذا الاسم ('images') الـ upload.array('images', ...) في server.js
                formData.append('images', allSelectedFiles[i]); 
            }

            // إزالة البيانات النصية التي قد تكررت
            ['sellerName', 'sellerPhone', 'propertyTitle', 'propertyType', 'propertyPrice', 'propertyArea', 'propertyRooms', 'propertyBathrooms', 'propertyDescription'].forEach(key => {
                 // نتأكد أن البيانات النصية لا تُضاف مرتين لو استخدمنا new FormData(form)
                 // إذا كنت قد أزلت إنشاء البيانات النصية هنا، فهذا السطر يمكن إزالته.
            });
            
            try {
                const response = await fetch('/api/submit-seller-property', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json(); 

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في إرسال البيانات.');
                }
                
                // النجاح: التحويل لصفحة الشكر
                window.location.href = 'thank-you.html'; 

            } catch (error) {
                messageEl.textContent = `فشل الإرسال. ${error.message}. يرجى التحقق من Terminal السيرفر.`;
                messageEl.className = 'error';
                console.error('Fetch Error:', error);
            }
        });
    }
    
    // 🚨 إضافة تنسيق زر الحذف ليتناسب مع المعرض الجديد (CSS مؤقت)
    // نضع التنسيق هنا لضمان عمله في المعرض المصغر
    const style = document.createElement('style');
    style.innerHTML = `
        .preview-image-wrapper {
            position: relative;
            width: 100px;
            height: 70px;
        }
        .remove-preview-btn {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--error-color);
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
});