document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    let allSelectedFiles = []; // لتخزين الملفات المختارة

    // ------------------------------------------------
    // دوال مساعدة لـ معاينة الصور
    // ------------------------------------------------

    function renderPreviews() {
        previewContainer.innerHTML = ''; // مسح القديم
        allSelectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.style.backgroundImage = `url(${e.target.result})`;
                
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-image-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => removeFileByIndex(index);

                previewItem.appendChild(removeBtn);
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    function removeFileByIndex(index) {
        // حذف الملف من مصفوفة التخزين
        allSelectedFiles.splice(index, 1);
        
        // إعادة تهيئة عرض الـ files input
        // ملاحظة: هذا الإجراء لا يعمل مباشرة. الطريقة الأكثر موثوقية هي إعادة عرض كل شيء.
        
        // إعادة بناء قائمة المعاينة
        renderPreviews();
    }

    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            const newFiles = Array.from(event.target.files);
            
            // إضافة الملفات الجديدة إلى المصفوفة
            allSelectedFiles.push(...newFiles);

            // تصفية الملفات المكررة (إذا لزم الأمر، ولكن ليس ضرورياً في هذه المرحلة)
            
            // عرض المعاينات الجديدة
            renderPreviews();

            // يجب إعادة تعيين قيمة input file لتمكين تحميل نفس الملف مرة أخرى
            // ولكننا نعتمد على allSelectedFiles للإرسال
            imageInput.value = '';
        });
    }

    // ------------------------------------------------
    // منطق الإرسال إلى السيرفر
    // ------------------------------------------------

    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // 🚨 تحديث رسالة التحميل بالنص المطلوب
            messageEl.textContent = 'برجاء الانتظار جاري ارسال البيانات';
            messageEl.className = 'info';
            
            const submitButton = sellerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true; // تعطيل الزر لمنع الإرسال المتعدد

            const formData = new FormData(sellerForm);
            
            // إزالة حقل الصور القديم وإضافة الملفات من مصفوفة التخزين
            formData.delete('images');
            allSelectedFiles.forEach((file) => {
                // اسم الحقل يجب أن يطابق ما يتوقعه multer في server.js (uploadSeller.array('images', 10))
                formData.append('images', file);
            });

            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'الرجاء إرفاق صورة واحدة على الأقل للعقار.';
                messageEl.className = 'error';
                submitButton.disabled = false;
                return;
            }

            try {
                const response = await fetch('/api/submit-seller-property', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json(); 

                if (!response.ok) {
                    // إذا كان هناك خطأ في السيرفر (مثل خطأ 500)
                    throw new Error(data.message || 'خطأ داخلي حرج في الخادم. يرجى مراجعة السجلات (Logs) في Render.');
                }
                
                // النجاح: التحويل لصفحة الشكر
                window.location.href = 'thank-you.html'; 

            } catch (error) {
                // التعامل مع أي خطأ أثناء الإرسال
                messageEl.textContent = `فشل الإرسال. ${error.message}`;
                messageEl.className = 'error';
                submitButton.disabled = false;
                console.error('Fetch Error:', error);
            }
        });
    }
});