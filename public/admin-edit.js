// admin-edit.js

document.addEventListener('DOMContentLoaded', () => {
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

    // 1. منطق البحث بالكود السري
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('search-code').value;
        searchMessageEl.textContent = 'جاري البحث...';
        searchMessageEl.className = '';
        editArea.style.display = 'none';

        try {
            // المسار الذي يبحث بالكود السري (موجود في server.js)
            const response = await fetch(`/api/property-by-code/${code}`);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل البحث.');
            }
            
            const result = await response.json();
            
            // جلب التفاصيل الكاملة باستخدام الـ ID
            await loadPropertyDetailsForEdit(result.id);
            searchMessageEl.textContent = 'تم العثور على العقار.';
            searchMessageEl.className = 'success';
            editArea.style.display = 'block';

        } catch (error) {
            searchMessageEl.textContent = `خطأ: ${error.message}`;
            searchMessageEl.className = 'error';
        }
    });

    // 2. دالة جلب البيانات وملء حقول التعديل
    async function loadPropertyDetailsForEdit(id) {
        currentPropertyId = id;
        try {
            const response = await fetch(`/api/property/${id}`);
            const property = await response.json();

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
                const urlToRemove = e.target.dataset.url;
                e.target.closest('.existing-image-wrapper').remove();
                
                // تحديث قائمة الصور المخفية
                let updatedUrls = JSON.parse(hiddenInput.value);
                updatedUrls = updatedUrls.filter(url => url !== urlToRemove);
                hiddenInput.value = JSON.stringify(updatedUrls);
                editMessageEl.textContent = 'تم إزالة الصورة. لا تنس حفظ التعديلات.';
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في حفظ التعديلات.');
            }
            
            editMessageEl.textContent = data.message;
            editMessageEl.className = 'success';
            
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
            const response = await fetch(`/api/property/${propertyId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'فشل في مسح العقار.');
            }
            
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