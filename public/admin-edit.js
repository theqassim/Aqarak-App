document.addEventListener('DOMContentLoaded', () => {

    const searchForm = document.getElementById('search-property-form');
    const editArea = document.getElementById('property-edit-area');
    const searchMessageEl = document.getElementById('search-message');
    const editForm = document.getElementById('edit-property-form');
    const deleteBtn = document.getElementById('delete-property-btn');
    const editMessageEl = document.getElementById('edit-form-message');
    
    // متغيرات الفيديوهات
    const addVideoBtn = document.getElementById('add-video-btn');
    const videoInput = document.getElementById('video-url-input');
    const videoListContainer = document.getElementById('video-list-container');
    const hiddenVideoInput = document.getElementById('hidden-video-urls-input');
    
    let currentPropertyId = null; 
    let currentVideoList = []; // مصفوفة لتخزين الفيديوهات حالياً

    async function safeFetchJson(url, options = {}) {
        const response = await fetch(url, options);
        const text = await response.text(); 
        
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            console.error("Non-JSON response:", text);
            throw new Error(`خطأ في استجابة السيرفر: لم يتم إرجاع بيانات JSON صالحة.`);
        }

        if (!response.ok) {
            throw new Error(data.message || `حدث خطأ: ${response.status}`);
        }

        return data;
    }

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('search-code').value.trim();
        
        if (!code) {
            searchMessageEl.textContent = 'الرجاء إدخال كود للعقارات.';
            searchMessageEl.className = 'error';
            return;
        }

        searchMessageEl.textContent = 'جاري البحث...';
        searchMessageEl.className = '';
        editArea.style.display = 'none';

        try {
            const result = await safeFetchJson(`/api/property-by-code/${code}`);
            await loadPropertyDetailsForEdit(result.id);
            
            searchMessageEl.textContent = 'تم العثور على العقار.';
            searchMessageEl.className = 'success';
            editArea.style.display = 'block';

        } catch (error) {
            console.error("Search Error:", error);
            searchMessageEl.textContent = error.message;
            searchMessageEl.className = 'error';
        }
    });

    async function loadPropertyDetailsForEdit(id) {
        currentPropertyId = id;
        try {
            const property = await safeFetchJson(`/api/property/${id}`);

            document.getElementById('edit-property-id').value = property.id;
            document.getElementById('edit-property-title').textContent = property.title;
            document.getElementById('edit-title').value = property.title;
            document.getElementById('edit-hidden-code').value = property.hiddenCode;
            document.getElementById('edit-price').value = property.price;
            document.getElementById('edit-type').value = property.type;
            document.getElementById('edit-area').value = property.area;
            document.getElementById('edit-rooms').value = property.rooms;
            document.getElementById('edit-bathrooms').value = property.bathrooms;
            document.getElementById('edit-description').value = property.description;

            // 1. التعامل مع الصور القديمة
            renderExistingImages(property.imageUrls || []);

            // 2. التعامل مع الفيديوهات (التعديل الجديد) 🎥
            // نتأكد إنها مصفوفة، لو جاية null نخليها فاضية
            currentVideoList = Array.isArray(property.video_urls) ? property.video_urls : [];
            renderVideoListUI(); // رسم القائمة

        } catch (error) {
            console.error("Load Details Error:", error);
            editMessageEl.textContent = 'فشل في تحميل تفاصيل العقار للتعديل.';
            editMessageEl.className = 'error';
        }
    }
    
    // --- دوال الصور ---
    function renderExistingImages(imageUrls) {
        const container = document.getElementById('existing-images-container');
        const hiddenInput = document.getElementById('existing-images-data');
        container.innerHTML = '';
        
        imageUrls.forEach(url => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'existing-image-wrapper';
            imgWrapper.innerHTML = `
                <img src="${url}" class="preview-image" data-url="${url}" alt="صورة العقار">
                <button type="button" class="remove-image-btn" data-url="${url}"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(imgWrapper);
        });

        hiddenInput.value = JSON.stringify(imageUrls);
        container.querySelectorAll('.remove-image-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const btn = e.target.closest('.remove-image-btn');
                const urlToRemove = btn.dataset.url;
                
                btn.closest('.existing-image-wrapper').remove();
                
                let updatedUrls = JSON.parse(hiddenInput.value);
                updatedUrls = updatedUrls.filter(url => url !== urlToRemove);
                hiddenInput.value = JSON.stringify(updatedUrls);
                
                editMessageEl.textContent = 'تم إزالة الصورة من العرض (اضغط حفظ لتأكيد الحذف).';
                editMessageEl.className = 'info';
            });
        });
    }

    // --- دوال الفيديوهات (الجديدة) 🎥 ---

    // دالة لرسم قائمة الفيديوهات في الشاشة
    function renderVideoListUI() {
        videoListContainer.innerHTML = ''; // تفريغ القائمة
        
        currentVideoList.forEach((link, index) => {
            const li = document.createElement('li');
            li.style.cssText = "background: white; padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;";
            
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                    <span style="color: #e74c3c;"><i class="fab fa-youtube"></i></span>
                    <a href="${link}" target="_blank" style="font-size: 13px; color: #333; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${link}</a>
                </div>
                <button type="button" class="remove-video-btn" data-index="${index}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            videoListContainer.appendChild(li);
        });

        // تحديث الحقل المخفي اللي هيروح للداتابيز
        // بنحول المصفوفة لنص JSON عشان تتبعت صح
        hiddenVideoInput.value = JSON.stringify(currentVideoList);

        // تفعيل زرار الحذف لكل فيديو
        document.querySelectorAll('.remove-video-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                removeVideo(index);
            });
        });
    }

    // إضافة فيديو جديد
    if(addVideoBtn) {
        addVideoBtn.addEventListener('click', () => {
            const url = videoInput.value.trim();
            if (url) {
                currentVideoList.push(url); // إضافة للمصفوفة
                renderVideoListUI(); // تحديث الشاشة
                videoInput.value = ''; // تنظيف الخانة
            }
        });
    }

    // حذف فيديو
    function removeVideo(index) {
        currentVideoList.splice(index, 1); // حذف من المصفوفة
        renderVideoListUI(); // تحديث الشاشة
    }


    // --- إرسال الفورم وحفظ التعديلات ---
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const propertyId = document.getElementById('edit-property-id').value;
        editMessageEl.textContent = 'جاري حفظ التعديلات...';
        editMessageEl.className = '';
        
        const formData = new FormData(editForm);

        // ملحوظة: formData هيسحب قيمة hidden-video-urls-input أوتوماتيك
        // لأننا اديناه name="video_urls"

        try {
            const response = await fetch(`/api/update-property/${propertyId}`, {
                method: 'PUT',
                body: formData,
            });

            const text = await response.text();
            let data;
            try { data = text ? JSON.parse(text) : {}; } catch(e) {}

            if (!response.ok) {
                throw new Error(data.message || 'فشل في حفظ التعديلات.');
            }
            
            editMessageEl.textContent = data.message;
            editMessageEl.className = 'success';
            
            // إعادة تحميل البيانات للتأكيد
            loadPropertyDetailsForEdit(propertyId);

        } catch (error) {
            console.error(error);
            editMessageEl.textContent = `خطأ: ${error.message}`;
            editMessageEl.className = 'error';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        const propertyId = document.getElementById('edit-property-id').value;
        if (!confirm(`تحذير: هل أنت متأكد من مسح العقار رقم ${propertyId} نهائياً؟`)) {
            return;
        }

        editMessageEl.textContent = 'جاري مسح العقار...';
        editMessageEl.className = '';

        try {
            await safeFetchJson(`/api/property/${propertyId}`, {
                method: 'DELETE',
            });
            
            editMessageEl.textContent = 'تم مسح العقار بنجاح!';
            editMessageEl.className = 'success';
            editArea.style.display = 'none';
            searchForm.reset();
            searchMessageEl.textContent = '';

        } catch (error) {
            editMessageEl.textContent = `خطأ في المسح: ${error.message}`;
            editMessageEl.className = 'error';
        }
    });
});