// ==========================================
// 🛠️ إعدادات الصفحة والتحقق من المستخدم
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    updateGreeting(); // ✅ 1. تحديث رسالة الترحيب
    await loadUserData(); // 2. تحميل بيانات المستخدم
    checkNotifications(); // 3. تشغيل الإشعارات

    // ✅ 4. تفعيل زر عرض المفضلة
    const favBtn = document.getElementById('show-favorites');
    if (favBtn) {
        favBtn.addEventListener('click', toggleFavorites);
    }
});

// ✅ دالة الترحيب الذكي (صباح/مساء)
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('time-greeting');
    const greetingIcon = document.getElementById('greeting-icon');
    const dateEl = document.getElementById('current-date');

    // تحديث التاريخ
    if(dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        dateEl.textContent = new Date().toLocaleDateString('ar-EG', options);
    }

    if (!greetingText || !greetingIcon) return;

    if (hour >= 5 && hour < 12) {
        greetingText.textContent = 'صباح الخير';
        greetingIcon.className = 'fas fa-sun';
        greetingIcon.style.color = '#ffd700'; // ذهبي
    } else if (hour >= 12 && hour < 17) {
        greetingText.textContent = 'طاب يومك';
        greetingIcon.className = 'fas fa-cloud-sun';
        greetingIcon.style.color = '#ff9800'; // برتقالي
    } else {
        greetingText.textContent = 'مساء الخير';
        greetingIcon.className = 'fas fa-moon';
        greetingIcon.style.color = '#00d4ff'; // أزرق ليلي
    }
}

// ✅ دالة تحميل بيانات المستخدم وتحديث الواجهة
window.loadUserData = async function() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            // تحديث النصوص
            const verifiedBadge = data.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-right:5px; vertical-align:middle; box-shadow:0 0 5px rgba(255, 215, 0, 0.5);"></i>` : '';

            // تحديث الاسم في القائمة والترحيب
            const usernameEl = document.getElementById('dropdown-username');
            const welcomeEl = document.getElementById('welcome-title');
            
            if (usernameEl) usernameEl.innerHTML = `${data.name} ${verifiedBadge}`;
            if (welcomeEl) welcomeEl.innerHTML = `مرحباً، ${data.name} ${verifiedBadge}`;

            // تحديث الرصيد
            const balanceEl = document.getElementById('dropdown-balance');
            if (balanceEl) {
                if (data.isPaymentActive) {
                    balanceEl.innerHTML = `${data.balance} <i class="fas fa-coins"></i>`;
                    balanceEl.style.display = 'flex';
                } else {
                    balanceEl.style.display = 'none';
                }
            }

            // تحديث زر البروفايل (صورة أو هامبرجر)
            const profileBtn = document.getElementById('dashboard-profile-btn');
            if (profileBtn) {
                // إذا كان لديه صورة بروفايل حقيقية (ليست اللوجو الافتراضي)
                if (data.profile_picture && !data.profile_picture.includes('logo.png')) {
                    profileBtn.innerHTML = `
                        <img src="${data.profile_picture}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                        <span id="menu-notif-badge" class="menu-badge">0</span>
                    `;
                } else {
                    // إذا لم يكن لديه صورة، نضع أيقونة القائمة
                    profileBtn.innerHTML = `
                        <i class="fas fa-bars"></i>
                        <span id="menu-notif-badge" class="menu-badge">0</span>
                    `;
                }
            }

            // إظهار كارت الأدمن إذا كان مسؤولاً
            if (data.role === 'admin') {
                const adminCard = document.getElementById('admin-card');
                if (adminCard) adminCard.style.display = 'block';
            }

        } else {
            window.location.href = 'index.html'; // إعادة توجيه إذا لم يكن مسجلاً
        }
    } catch (e) {
        console.error("Load User Data Error:", e);
    }
};

// ==========================================
// ❤️ 2. منطق المفضلة (الجديد)
// ==========================================

async function toggleFavorites() {
    const area = document.getElementById('favorites-area');
    const container = document.getElementById('favorites-listings');
    
    // إغلاق إذا كانت مفتوحة
    if (area.style.display === 'block') {
        area.style.display = 'none';
        return;
    }

    area.style.display = 'block';
    container.innerHTML = '<div style="text-align:center; color:var(--neon-primary); padding:20px;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';

    try {
        const res = await fetch('/api/user/favorites');
        if (!res.ok) throw new Error('Failed to fetch');
        
        const properties = await res.json();
        container.innerHTML = '';

        if (properties.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">لا توجد عقارات في المفضلة حالياً.</p>';
            return;
        }

        properties.forEach(prop => {
            const price = parseInt(prop.price).toLocaleString();
            const html = `
                <div class="fav-card">
                    <a href="property-details?id=${prop.id}" class="fav-img-link">
                        <img src="${prop.imageUrl || 'logo.png'}" class="fav-img" loading="lazy">
                    </a>
                    <div class="fav-content">
                        <div class="fav-title">${prop.title}</div>
                        <div class="fav-price">${price} ج.م</div>
                        <div class="fav-actions">
                            <a href="property-details?id=${prop.id}" class="btn-fav-view">عرض</a>
                            <button class="btn-fav-remove" onclick="removeFavorite(${prop.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center; color:#ff4444;">حدث خطأ في تحميل المفضلة.</p>';
    }
}

// دالة الحذف من المفضلة
window.removeFavorite = async function(id) {
    if (!confirm('هل أنت متأكد من الحذف من المفضلة؟')) return;
    
    try {
        const res = await fetch(`/api/user/favorites/${id}`, { method: 'DELETE' });
        if (res.ok) {
            // إعادة تحميل القائمة
            toggleFavorites(); // يغلق
            setTimeout(toggleFavorites, 100); // يفتح مرة أخرى للتحديث
        } else {
            alert('فشل الحذف');
        }
    } catch (e) {
        alert('خطأ في الاتصال');
    }
};

// ==========================================
// 🔔 3. نظام الإشعارات
// ==========================================

async function checkNotifications() {
    try {
        const res = await fetch('/api/user/notifications');
        const data = await res.json();
        
        const badge = document.getElementById('menu-notif-badge');
        const list = document.getElementById('menu-notif-list');
        const countText = document.getElementById('notif-count-text');

        // تحديث العداد (Badge)
        if (data.unreadCount > 0) {
            if (badge) {
                badge.style.display = 'flex';
                badge.textContent = data.unreadCount > 9 ? '+9' : data.unreadCount;
            }
            if (countText) {
                countText.textContent = `${data.unreadCount} جديدة`;
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (countText) countText.textContent = '';
        }

        // تعبئة القائمة
        if (list && data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `
                <div class="menu-notif-item ${n.is_read ? '' : 'unread'}" style="padding:10px; border-bottom:1px solid #333; background:${n.is_read ? 'transparent' : 'rgba(0, 255, 136, 0.05)'}; transition:0.3s;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <strong style="color:white; font-size:0.85rem;">${n.title}</strong>
                        <span style="font-size:0.65rem; color:#777;">${new Date(n.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p style="color:#aaa; font-size:0.8rem; margin:0;">${n.message}</p>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Notif Error:", e);
    }
}

// ==========================================
// 📱 4. التحكم في القائمة المنسدلة
// ==========================================

window.toggleProfileMenu = async function() {
    const menu = document.getElementById('profile-dropdown');
    const badge = document.getElementById('menu-notif-badge');
    const countText = document.getElementById('notif-count-text');
    
    if (!menu) return;

    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
        
        // عند الفتح: إخفاء العداد وتصفير الإشعارات
        if (badge && badge.style.display !== 'none') {
            badge.style.display = 'none';
            if (countText) countText.textContent = '';
            
            try { 
                await fetch('/api/user/notifications/read', { method: 'POST' }); 
            } catch(e) { console.error(e); }
        }
    }
};

window.logoutUser = async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (e) { window.location.reload(); }
};

// إغلاق القائمة عند الضغط خارجها
window.addEventListener('click', function(e) {
    const container = document.querySelector('.profile-menu-container');
    const menu = document.getElementById('profile-dropdown');
    
    if (container && menu && !container.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// ==========================================
// 💳 5. منطق شحن المحفظة (Modal & Logic)
// ==========================================

window.openChargeModal = function() {
    const modal = document.getElementById('charge-modal');
    if(modal) modal.style.display = 'block';
};

let selectedMethod = 'card';

window.selectPaymentMethod = function(method) {
    selectedMethod = method;
    document.getElementById('btn-card').classList.remove('active');
    document.getElementById('btn-wallet').classList.remove('active');
    
    document.getElementById('btn-card').style.background = 'transparent';
    document.getElementById('btn-card').style.color = 'var(--neon-primary)';
    
    document.getElementById('btn-wallet').style.background = 'transparent';
    document.getElementById('btn-wallet').style.color = '#ff4444';

    if (method === 'card') {
        const btn = document.getElementById('btn-card');
        btn.classList.add('active');
        btn.style.background = 'var(--neon-primary)';
        btn.style.color = 'black';
        document.getElementById('wallet-input-container').style.display = 'none';
    } else {
        const btn = document.getElementById('btn-wallet');
        btn.classList.add('active');
        btn.style.background = '#ff4444';
        btn.style.color = 'white';
        document.getElementById('wallet-input-container').style.display = 'block';
    }
};

window.calculatePrice = function() {
    const points = document.getElementById('charge-points').value;
    const priceDisplay = document.getElementById('price-display');
    const price = points ? points * 1 : 0; 
    if(priceDisplay) priceDisplay.textContent = price;
};

window.startChargeProcess = async function() {
    const points = document.getElementById('charge-points').value;
    if (!points || points < 10) return alert('أقل عدد للنقاط هو 10');

    const btn = document.querySelector('#charge-modal button[onclick="startChargeProcess()"]');
    btn.innerHTML = 'جاري المعالجة...';
    btn.disabled = true;

    const payload = {
        amount: points * 1,
        points: points,
        method: selectedMethod
    };

    if (selectedMethod === 'wallet') {
        const walletNum = document.getElementById('wallet-number').value;
        if (!walletNum || walletNum.length < 11) {
            btn.innerHTML = 'تأكيد وشراء النقاط';
            btn.disabled = false;
            return alert('أدخل رقم محفظة صحيح');
        }
        payload.walletNumber = walletNum;
    }

    try {
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('خطأ في الاتصال ببوابة الدفع');
            btn.innerHTML = 'تأكيد وشراء النقاط';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert('حدث خطأ');
        btn.innerHTML = 'تأكيد وشراء النقاط';
        btn.disabled = false;
    }
};

// ==========================================
// 🔐 6. منطق تغيير كلمة المرور (Modal)
// ==========================================

const passModalBtn = document.getElementById('open-password-modal');
if (passModalBtn) {
    passModalBtn.addEventListener('click', () => {
        document.getElementById('passwordModal').style.display = 'block';
        document.getElementById('normal-change-mode').style.display = 'block';
        document.getElementById('otp-change-mode').style.display = 'none';
    });
}

window.closeModal = function() {
    document.getElementById('passwordModal').style.display = 'none';
};

window.switchPassMode = function(mode) {
    if(mode === 'otp') {
        document.getElementById('normal-change-mode').style.display = 'none';
        document.getElementById('otp-change-mode').style.display = 'block';
        document.getElementById('step-send-otp').style.display = 'block';
        document.getElementById('step-verify-otp').style.display = 'none';
    } else {
        document.getElementById('otp-change-mode').style.display = 'none';
        document.getElementById('normal-change-mode').style.display = 'block';
    }
};

window.changePasswordNormal = async function() {
    const currentPass = document.getElementById('current-pass').value;
    const newPass = document.getElementById('new-pass-1').value;
    const msg = document.getElementById('pass-msg');

    if(!currentPass || !newPass) {
        msg.textContent = "املأ جميع الحقول";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch('/api/user/change-password-manual', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ currentPass, newPass })
        });
        const data = await response.json();
        
        if(data.success) {
            alert('✅ تم تغيير كلمة المرور بنجاح');
            closeModal();
        } else {
            msg.textContent = data.message;
            msg.style.color = "red";
        }
    } catch(e) { console.error(e); }
};

window.sendResetOTP = async function() {
    const phone = document.getElementById('reset-phone').value;
    const msg = document.getElementById('otp-msg');
    
    if(!phone) return alert('أدخل رقم الهاتف');

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone, type: 'reset' })
        });
        const data = await res.json();
        
        if(data.success) {
            msg.textContent = "تم إرسال الكود للواتساب!";
            msg.style.color = "#00ff88";
            document.getElementById('step-send-otp').style.display = 'none';
            document.getElementById('step-verify-otp').style.display = 'block';
        } else {
            msg.textContent = data.message;
            msg.style.color = "red";
        }
    } catch(e) { console.error(e); }
};

window.resetPasswordViaOTP = async function() {
    const phone = document.getElementById('reset-phone').value;
    const otp = document.getElementById('otp-code').value;
    const newPass = document.getElementById('new-pass-2').value;

    if(!otp || !newPass) return alert('أكمل البيانات');

    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone, otp, newPassword: newPass })
        });
        const data = await res.json();

        if(data.success) {
            alert('✅ تم تغيير كلمة المرور بنجاح!');
            closeModal();
        } else {
            alert('❌ ' + data.message);
        }
    } catch(e) { console.error(e); }
};