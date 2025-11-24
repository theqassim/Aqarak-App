document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('property-images');
    const previewContainer = document.getElementById('image-preview-container');
    const sellerForm = document.getElementById('seller-form');
    const messageEl = document.getElementById('seller-form-message');

    // الحد الأقصى: 10 ميجابايت
    const MAX_SIZE = 10 * 1024 * 1024;

    // مصفوفة لتخزين كل الملفات المختارة
    let allSelectedFiles = []; 

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
                
                window.location.href = 'thank-you.html';

            } catch (error) {
                messageEl.textContent = `فشل الإرسال: ${error.message}`;
                messageEl.className = 'error';
                messageEl.style.color = '#ff4444'; // إعادة اللون للأحمر عند الخطأ
            }
        });
    }

    // دالة إرسال الإشعار لتليجرام
const sendTelegramNotification = async (propertyData) => {
  // 1. بيانات البوت بتاعك
  const botToken = "8445587657:AAEprDvEMXDm_fhuLP7KNxoTptw6WqAtd8s";
  const chatId = "1804430659";

  // 2. تجهيز الرسالة (ممكن تحط إيموجي وتظبط الشكل)
  const message = `
🚨 **عقار جديد تم نشره!** 🏠

👤 **المالك:** ${propertyData.ownerName}
📞 **الهاتف:** ${propertyData.phone}
💰 **السعر:** ${propertyData.price} جنيه
📍 **العنوان:** ${propertyData.address}

🔗 [اضغط للمراجعة](https://aqarakeg.com/admin/admin-submissions.html
  `;

  // 3. إرسال الطلب لتليجرام
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown' // عشان التنسيق (Bold) يشتغل
      })
    });
    console.log("Notification sent!");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
    
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