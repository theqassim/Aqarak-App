document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    let allSelectedFiles = []; 

    // --- 1. منطق اختيار الفئة (Categories) ---
    window.selectCategory = (type) => {
        const selectionDiv = document.getElementById('category-selection');
        const formDiv = document.getElementById('form-container');
        const typeInput = document.getElementById('property-category');

        // إظهار الفورم
        selectionDiv.style.display = 'none';
        formDiv.style.display = 'block';

        const roomsContainer = document.getElementById('container-rooms');
        const bathsContainer = document.getElementById('container-bathrooms');
        const roomsInput = document.getElementById('property-rooms');
        const bathsInput = document.getElementById('property-bathrooms');
        const offerTypeContainer = document.getElementById('container-offer-type');
        const offerTypeSelect = document.getElementById('property-offer-type');

        if (type === 'land') {
            // أرض: إخفاء الغرف والحمامات ونوع العرض (إجباري بيع)
            typeInput.value = 'أرض';
            roomsContainer.style.display = 'none';
            bathsContainer.style.display = 'none';
            offerTypeContainer.style.display = 'none';
            
            roomsInput.removeAttribute('required');
            bathsInput.removeAttribute('required');
            roomsInput.value = 0;
            bathsInput.value = 0;
            offerTypeSelect.value = 'بيع'; // افتراضي للأرض

        } else {
            // شقق/محلات: إظهار الكل
            typeInput.value = (type === 'commercial') ? 'تجاري' : 'سكني';
            
            roomsContainer.style.display = 'block';
            bathsContainer.style.display = 'block';
            offerTypeContainer.style.display = 'block';

            roomsInput.setAttribute('required', 'true');
            bathsInput.setAttribute('required', 'true');
            roomsInput.value = '';
            bathsInput.value = '';
            
            if (type === 'commercial') {
                roomsContainer.querySelector('label').innerText = 'عدد الغرف / المكاتب';
            } else {
                roomsContainer.querySelector('label').innerText = 'عدد الغرف';
            }
        }
    };

    window.resetSelection = () => {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('category-selection').style.display = 'grid';
    };

    // --- 2. دوال المعاينة ---
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
            if (file instanceof File) reader.readAsDataURL(file);
        });
    }

    function removeFileByIndex(index) {
        allSelectedFiles = allSelectedFiles.filter((_, i) => i !== index);
        renderPreviews(); 
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            allSelectedFiles.push(...Array.from(e.target.files));
            imageInput.value = ''; 
            renderPreviews(); 
        });
    }

    // --- 3. الإرسال للسيرفر ---
    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            if (allSelectedFiles.length === 0) {
                messageEl.textContent = 'يرجى اختيار صورة واحدة على الأقل.';
                messageEl.className = 'error';
                return;
            }
            if (allSelectedFiles.some(file => file.size > MAX_SIZE)) {
                messageEl.textContent = '⚠️ يوجد صور تتخطى 10 ميجابايت.';
                messageEl.className = 'error';
                return;
            }

            messageEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            messageEl.className = 'info';
            messageEl.style.color = '#28a745';

            const formData = new FormData(sellerForm);
            
            // ✅ دمج النوع (شقة) مع العرض (بيع)
            const category = document.getElementById('property-category').value;
            const offerType = document.getElementById('property-offer-type').value;
            const finalType = (category === 'أرض') ? 'أرض (بيع)' : `${category} (${offerType})`;
            formData.set('propertyType', finalType);

            // الصور
            formData.delete('images[]'); 
            allSelectedFiles.forEach(file => formData.append('images', file));

            try {
                const response = await fetch('/api/submit-seller-property', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json(); 

                if (!response.ok) throw new Error(data.message || 'فشل الإرسال');
                
                // ✅ التحويل (بدون .html)
                window.location.href = 'thank-you'; 

            } catch (error) {
                messageEl.textContent = `خطأ: ${error.message}`;
                messageEl.className = 'error';
                messageEl.style.color = '#ff4444';
            }
        });
    }
    
    // CSS Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .image-preview-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; padding: 10px; border-radius: 8px; min-height: 50px; }
        .preview-image-wrapper { position: relative; width: 100px; height: 70px; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: all 0.3s ease; }
        .preview-image { width: 100%; height: 100%; object-fit: cover; }
        .preview-image-wrapper.invalid-file { border: 2px solid #ff4444; }
        .preview-image-wrapper.invalid-file img { filter: grayscale(100%) brightness(0.7); }
        .error-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(220, 53, 69, 0.9); color: white; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 3px; white-space: nowrap; z-index: 10; pointer-events: none; }
        .remove-preview-btn { position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; z-index: 20; display: flex; align-items: center; justify-content: center; }
        .remove-preview-btn:hover { background: #cc0000; }
    `;
    document.head.appendChild(style);
});