document.addEventListener('DOMContentLoaded', () => {
    // 1. المتغيرات والتحقق من الهاتف (بدل الإيميل)
    const userPhone = localStorage.getItem('userPhone'); 
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const modal = document.getElementById("passwordModal");

    // 2. منطق المفضلة (باستخدام userPhone)
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
        if (!userPhone) {
            favoritesContainer.innerHTML = '<p class="empty-message error">يجب تسجيل الدخول لعرض المفضلة.</p>';
            return;
        }
        favoritesContainer.innerHTML = '<p class="empty-message info">جاري تحميل المفضلة...</p>';

        try {
            // استخدام userPhone بدلاً من userEmail
            const response = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userPhone)}`);
            
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
                    <div class="property-card">
                        <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=عقارك'}" alt="${property.title}">
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

                try {
                    const response = await fetch(`/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userPhone)}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الإزالة.');

                    alert('تمت الإزالة بنجاح.');
                    fetchFavorites();
                } catch (error) {
                    alert(`خطأ: ${error.message}`);
                }
            });
        });
    }

    // 3. منطق زرار تغيير كلمة المرور (يفتح المودال)
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = "block";
            // لو المستخدم مسجل دخول، املأ حقل الرقم تلقائياً
            if(userPhone) {
                const phoneInput = document.getElementById('reset-phone');
                if(phoneInput) phoneInput.value = userPhone;
                // اعرض الوضع العادي كافتراضي
                switchPassMode('normal');
            } else {
                // لو مش مسجل، اعرض وضع الـ OTP علطول عشان يدخل رقمه
                switchPassMode('otp');
            }
        });
    }
});

// === دوال المودال (خارج الـ DOMContentLoaded) ===

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

// أ) تغيير الباسورد بالطريقة العادية (تتطلب تسجيل دخول)
async function changePasswordNormal() {
    const userPhone = localStorage.getItem('userPhone');
    const msg = document.getElementById('pass-msg');

    if (!userPhone) {
        msg.textContent = 'يجب تسجيل الدخول لاستخدام هذه الطريقة، أو استخدم "نسيت كلمة المرور".';
        msg.style.color = 'orange';
        return;
    }

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
            body: JSON.stringify({ phone: userPhone, currentPassword, newPassword })
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

// ب) إرسال كود OTP للواتساب
async function sendResetOTP() {
    // نجيب الرقم من الحقل (مهم لو المستخدم مش مسجل دخول)
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

// ج) تأكيد الكود وتغيير الباسورد
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
