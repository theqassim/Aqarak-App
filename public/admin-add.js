// admin-add.js

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    const form = document.getElementById('add-property-form');
    const messageEl = document.getElementById('add-form-message');
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    
    // 🚨 منطق تحميل البيانات المؤقتة (تم إبقاؤه لمرونة الكود)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('load') === 'true') {
        const tempSubmissionData = localStorage.getItem('tempSubmissionData');
        if (tempSubmissionData) {
            const data = JSON.parse(tempSubmissionData);
            
            document.getElementById('property-title').value = data.propertyTitle || '';
            document.getElementById('property-price').value = data.propertyPrice || '';
            document.getElementById('property-type').value = data.propertyType || '';
            document.getElementById('property-area').value = data.propertyArea || '';
            document.getElementById('property-rooms').value = data.propertyRooms || '';
            document.getElementById('property-bathrooms').value = data.propertyBathrooms || '';
            document.getElementById('property-description').value = data.propertyDescription || '';

            messageEl.textContent = 'تم تحميل بيانات الطلب. أكمل الكود السري وقم بتحميل الصور ثم انشر العقار.';
            messageEl.className = 'info';
            localStorage.removeItem('tempSubmissionData'); 
        }
    }

    // منطق معاينة الصور
    imageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        previewContainer.innerHTML = ''; 

        if (files.length > 0) {
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.classList.add('preview-image'); 
                    previewContainer.appendChild(img); 
                }
                reader.readAsDataURL(file);
            }
        }
    });

    // منطق إرسال النموذج
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = 'جاري نشر العقار...';
        messageEl.className = '';

        const formData = new FormData(form); 
        
        try {
            const response = await fetch('/api/add-property', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في نشر العقار.');
            }
            
            messageEl.textContent = data.message;
            messageEl.className = 'success';
            form.reset();
            previewContainer.innerHTML = '';
            
        } catch (error) {
            messageEl.textContent = `خطأ: ${error.message}`;
            messageEl.className = 'error';
        }
    });
});