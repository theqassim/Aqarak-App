document.addEventListener('DOMContentLoaded', () => {
    // 1. المتغيرات
    // بنستخدم localStorage بس عشان نعرف نعرض الرقم في المودال، لكن التوثيق الحقيقي بيتم في السيرفر
    const userPhone = localStorage.getItem('userPhone'); 
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const modal = document.getElementById("passwordModal");

    // 2. منطق المفضلة
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    async function fetchFavorites() {
        if (!favoritesContainer) return;
        
        favoritesContainer.innerHTML = '<p class="empty-message info">جاري تحميل المفضلة...</p>';

        try {
            // 🟢 تعديل هام: طلب المفضلة بدون إرسال بارامترات في الرابط
            // السيرفر هيقرا التوكن من الكوكيز ويعرف مين المستخدم
            const response = await fetch('/api/favorites');
            
            if (response.status === 401) {
                favoritesContainer.innerHTML = '<p class="empty-message error">انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.</p>';
                return;
            }
            
            if (!response.ok) throw new Error('فشل الاتصال بالسيرفر');
            
            const properties = await response.json();
            favoritesContainer.innerHTML = '';

            if (properties.length === 0) {
                favoritesContainer.innerHTML = `<div class="empty-message neon-glow" style="background: none;">
                    <i class="fas fa-heart" style="color: var(--neon-color); font-size: 2em;"></i>
                    <p style="color: var(--text-color); margin-top: 10px;">لا يوجد عقارات في المفضلة حالياً.</p>
                </div>`;
                return;
            }

            properties.forEach(property => {
                const formattedPrice = window.formatPrice ? window.formatPrice(property.price, property.type) : property.price;
                const typeTag = window.getTypeTag ? window.getTypeTag(property.type) : '';

                const cardHTML = `
                    <div class="property-card" id="fav-card-${property.id}">
                        <img src="${property.imageUrl || 'logo.png'}" alt="${property.title}">
                        <div class="card-content">
                            <h3>${property.title} ${typeTag}</h3> 
                            <p class="price">${formattedPrice}</p> 
                            <p>${property.rooms} غرف | ${property.bathrooms} حمام | ${property.area} م²</p>
                            
                            <a href="property-details?id=${property.id}" class="btn">عرض التفاصيل</a>
                            <button class="btn-neon-red remove-favorite-btn" data-id="${property.id}" style="margin-top: 10px;">
                                <i class="fas fa-trash"></i> إزالة من المفضلة
                            </button>
                        </div>
                    </div>
                `;
                favoritesContainer.innerHTML += cardHTML;
            });

            addRemoveFavoriteListeners();

        } catch (error) {
            console.error('Error fetching favorites:', error);
            favoritesContainer.innerHTML = `<p class="empty-message error">حدث خطأ: ${error.message}</p>`;
        }
    }

    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget; 
                const propertyId = btn.dataset.id;

                if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;

                // تغيير شكل الزرار أثناء التحميل
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    // 🟢 تعديل هام: الحذف بدون بارامترات إضافية
                    const response = await fetch(`/api/favorites/${propertyId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الإزالة.');

                    // إزالة الكارت من الشاشة فوراً
                    const card = document.getElementById(`fav-card-${propertyId}`);
                    if (card) card.remove();
                    
                    // لو مفيش كروت باقية، نعيد التحميل لإظهار رسالة "فارغة"
                    if (document.querySelectorAll('.property-card').length === 0) {
                        fetchFavorites();
                    }

                } catch (error) {
                    alert(`خطأ: ${error.message}`);
                    btn.innerHTML = originalText;
                }
            });
        });
    }

    // 3. منطق زرار تغيير كلمة المرور
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = "block";
            
            // محاولة جلب الرقم من التوكن لو مش موجود في اللوكل ستوريج
            checkAuthAndFillPhone(userPhone);
        });
    }
});

// دالة مساعدة للتأكد من الرقم
async function checkAuthAndFillPhone(storedPhone) {
    const phoneInput = document.getElementById('reset-phone');
    if (!phoneInput) return;

    if (storedPhone) {
        phoneInput.value = storedPhone;
        switchPassMode('normal');
    } else {
        // لو مفيش رقم في اللوكل، نحاول نجيبه من السيرفر
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.isAuthenticated) {
                phoneInput.value = data.phone;
                switchPassMode('normal');
            } else {
                switchPassMode('otp');
            }
        } catch (e) { switchPassMode('otp'); }
    }
}

// === دوال المودال ===

function closeModal() {
    document.getElementById("passwordModal").style.display = "none";
}

function switchPassMode(mode) {
    const normalDiv = document.getElementById('normal-change-mode');
    const otpDiv = document.getElementById('otp-change-mode');
    const msgs = document.querySelectorAll('.message');
    msgs.forEach(m => m.textContent = ''); 

    if (mode === 'otp') {
        normalDiv.classList.add('hidden');
        otpDiv.classList.remove('hidden');
    } else {
        otpDiv.classList.add('hidden');
        normalDiv.classList.remove('hidden');
    }
}

// أ) تغيير الباسورد بالطريقة العادية
async function changePasswordNormal() {
    const msg = document.getElementById('pass-msg');
    
    // هنجيب الرقم من الانبوت نفسه عشان نكون متأكدين
    const phoneVal = document.getElementById('reset-phone').value; 
    const currentPassword = document.getElementById('current-pass').value;
    const newPassword = document.getElementById('new-pass-1').value;

    if (!currentPassword || !newPassword) {
        msg.textContent = 'املأ جميع الحقول'; msg.style.color = 'red'; return;
    }

    msg.textContent = 'جاري التحديث...';

    try {
        const response = await fetch('/api/user/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneVal, currentPassword, newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            msg.textContent = '✅ تم تغيير كلمة المرور بنجاح';
            msg.style.color = '#00ff88';
            setTimeout(closeModal, 2000);
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = 'red';
        }
    } catch (e) {
        msg.textContent = 'خطأ في الاتصال'; msg.style.color = 'red';
    }
}

// ب) إرسال كود OTP
async function sendResetOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const msg = document.getElementById('otp-msg');
    
    if (!phoneInput) {
        msg.textContent = 'أدخل رقم الواتساب أولاً'; msg.style.color = 'red'; return;
    }

    msg.textContent = 'جاري إرسال الكود...';

    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput })
        });
        const data = await response.json();
        
        if (data.success) {
            msg.textContent = '✅ تم الإرسال! أدخل الكود بالأسفل.';
            msg.style.color = '#00ff88';
            document.getElementById('step-send-otp').classList.add('hidden');
            document.getElementById('step-verify-otp').classList.remove('hidden');
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = 'red';
        }
    } catch (e) {
        msg.textContent = 'خطأ في الاتصال'; msg.style.color = 'red';
    }
}

// ج) تأكيد الكود
async function resetPasswordViaOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const otp = document.getElementById('otp-code').value;
    const newPassword = document.getElementById('new-pass-2').value;
    const msg = document.getElementById('otp-msg');

    if (!otp || !newPassword) {
        msg.textContent = 'اكتب الكود والباسورد الجديد'; return;
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput, otp, newPassword })
        });
        const data = await response.json();

        if (data.success) {
            msg.textContent = '🎉 تم تغيير كلمة المرور بنجاح!';
            msg.style.color = '#00ff88';
            setTimeout(closeModal, 2000);
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = 'red';
        }
    } catch (e) {
        msg.textContent = 'حدث خطأ'; msg.style.color = 'red';
    }
}