document.addEventListener('DOMContentLoaded', async () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');
    
    // 🔒 1. جلب بيانات المستخدم وملء الحقول تلقائياً
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        if (userData.isAuthenticated) {
            // ملء الحقول وجعلها للقراءة فقط (زيادة تأكيد)
            const nameField = document.getElementById('seller-name');
            const phoneField = document.getElementById('seller-phone');
            
            // نحاول نجيب الاسم من الـ response، لو مش موجود نستخدم "مستخدم عقارك"
            // ملاحظة: تأكد إن api/auth/me بيرجع الـ name (عدلناها في السيرفر قبل كده)
            nameField.value = userData.name || userData.username || 'مستخدم عقارك';
            phoneField.value = userData.phone;
            
            nameField.setAttribute('readonly', true);
            phoneField.setAttribute('readonly', true);
        } else {
            // لو مش مسجل، حوله لصفحة الدخول
            alert('يجب تسجيل الدخول أولاً لعرض عقارك!');
            window.location.href = 'login';
            return;
        }
    } catch (error) {
        console.error("Auth Check Error:", error);
        window.location.href = 'index'; // أمان إضافي
        return;
    }

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

            // تأكد إن الاسم والرقم مبعوتين صح حتى لو الـ input disabled
            // (المتصفحات أحياناً مش بتبعت الـ disabled inputs، بس readonly بتبعتها عادي)
            
            try {
                const response = await fetch('/api/submit-seller-property', { method: 'POST', body: formData });
                const data = await response.json(); 
                if (!response.ok) throw new Error(data.message);
                window.location.href = 'thank-you';
            } catch (error) {
                messageEl.textContent = `فشل: ${error.message}`; messageEl.className = 'error';
            }
        });
    }

    // Styles (نفس الستايل القديم)
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