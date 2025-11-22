// admin-edit.js

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من صلاحية الأدمن
    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    const searchForm = document.getElementById('search-property-form');
    const editArea = document.getElementById('property-edit-area');
    const searchMessageEl = document.getElementById('search-message');
    const editForm = document.getElementById('edit-property-form');
    const deleteBtn = document.getElementById('delete-property-btn');
    const editMessageEl = document.getElementById('edit-form-message');
    let currentPropertyId = null; 

    // --- دالة مساعدة لجلب البيانات بأمان (تمنع خطأ JSON input) ---
    async function safeFetchJson(url, options = {}) {
        const response = await fetch(url, options);
        const text = await response.text(); // قراءة الرد كنص أولاً
        
        let data;
        try {
            data = text ? JSON.parse(text) : {}; // محاولة التحويل لـ JSON
        } catch (err) {
            throw new Error(`خطأ في استجابة السيرفر: لم يتم إرجاع بيانات JSON صالحة. (${response.status})`);
        }

        if (!response.ok) {
            throw new Error(data.message || `حدث خطأ: ${response.status}`);
        }

        return data;
    }

    // 1. منطق البحث بالكود السري (مصحح)
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
            // استخدام الدالة الآمنة بدلاً من fetch العادي
            const result = await safeFetchJson(`/api/property-by-code/${code}`);
            
            // جلب التفاصيل الكاملة باستخدام الـ ID
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

    // 2. دالة جلب البيانات وملء حقول التعديل (مصححة)
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

            renderExistingImages(property.imageUrls || []);
            
        } catch (error) {
            console.error("Load Details Error:", error);
            editMessageEl.textContent = 'فشل في تحميل تفاصيل العقار للتعديل.';
            editMessageEl.className = 'error';
        }
    }
    
    // 3. عرض الصور الحالية مع خيار الحذف
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

        // تحديث الحقل المخفي بالصور الحالية
        hiddenInput.value = JSON.stringify(imageUrls);

        // إضافة مستمعين لزر الحذف
        container.querySelectorAll('.remove-image-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // العثور على العنصر الأب في حالة الضغط على الأيقونة داخل الزر
                const btn = e.target.closest('.remove-image-btn');
                const urlToRemove = btn.dataset.url;
                
                btn.closest('.existing-image-wrapper').remove();
                
                // تحديث قائمة الصور المخفية
                let updatedUrls = JSON.parse(hiddenInput.value);
                updatedUrls = updatedUrls.filter(url => url !== urlToRemove);
                hiddenInput.value = JSON.stringify(updatedUrls);
                
                editMessageEl.textContent = 'تم إزالة الصورة من العرض (اضغط حفظ لتأكيد الحذف).';
                editMessageEl.className = 'info';
            });
        });
    }

    // 4. منطق حفظ التعديلات (PUT)
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const propertyId = document.getElementById('edit-property-id').value;
        editMessageEl.textContent = 'جاري حفظ التعديلات...';
        editMessageEl.className = '';

        const formData = new FormData(editForm);
        formData.append('existingImages', document.getElementById('existing-images-data').value);

        try {
            const response = await fetch(`/api/update-property/${propertyId}`, {
                method: 'PUT',
                body: formData,
            });

            // قراءة الرد يدوياً هنا أيضاً لأننا نستخدم fetch مباشرة للـ FormData
            const text = await response.text();
            let data;
            try { data = text ? JSON.parse(text) : {}; } catch(e) {}

            if (!response.ok) {
                throw new Error(data.message || 'فشل في حفظ التعديلات.');
            }
            
            editMessageEl.textContent = data.message;
            editMessageEl.className = 'success';
            
            // إعادة تحميل الصور لتحديث الواجهة
            loadPropertyDetailsForEdit(propertyId);

        } catch (error) {
            editMessageEl.textContent = `خطأ: ${error.message}`;
            editMessageEl.className = 'error';
        }
    });

    // 5. منطق مسح العقار (DELETE)
    deleteBtn.addEventListener('click', async () => {
        const propertyId = document.getElementById('edit-property-id').value;
        if (!confirm(`تحذير: هل أنت متأكد من مسح العقار رقم ${propertyId} نهائياً؟ سيتم مسح الصور من السيرفر.`)) {
            return;
        }

        editMessageEl.textContent = 'جاري مسح العقار...';
        editMessageEl.className = '';

        try {
            const data = await safeFetchJson(`/api/property/${propertyId}`, {
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