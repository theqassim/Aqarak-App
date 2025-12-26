// ==========================================
// 🛠️ 1. إعدادات الصفحة والتحقق من المستخدم
// ==========================================

let currentPointPrice = 1; // السعر الافتراضي (هيتحدث تلقائي من السيرفر)

document.addEventListener('DOMContentLoaded', async () => {
    updateGreeting();      // تحديث الترحيب
    await loadUserData();  // تحميل البيانات
    checkNotifications();  // تشغيل الإشعارات
    fetchPaymentConfig();
    checkPaymentStatus(); 

    // تفعيل زر عرض المفضلة
    const favBtn = document.getElementById('show-favorites');
    if (favBtn) {
        favBtn.addEventListener('click', toggleFavorites);
    }
});

// ✅ دالة جلب إعدادات الدفع (السعر) من السيرفر
async function fetchPaymentConfig() {
    try {
        const response = await fetch('/api/config/payment-price');
        const data = await response.json();
        
        // تحديث السعر بناءً على إعدادات الأدمن
        if (data.pointPrice) {
            currentPointPrice = parseFloat(data.pointPrice);
            console.log("✅ تم تحديث سعر النقطة:", currentPointPrice);
            
            // تحديث السعر في واجهة المودال لو مفتوح
            const priceLabel = document.getElementById('current-point-price');
            if(priceLabel) priceLabel.textContent = currentPointPrice;
        }

        // لو الدفع معطل من الأدمن
        if (data.isPaymentActive === false) {
            const btn = document.getElementById('dropdown-balance');
            if(btn) {
                btn.onclick = () => alert("نظام الشحن مغلق مؤقتاً للصيانة.");
                // إخفاء علامة الزائد لو الشحن واقف
                const badge = btn.querySelector('.add-points-badge');
                if(badge) badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Config Error:", error);
    }
}

// ✅ دالة الترحيب الذكي
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('time-greeting');
    const greetingIcon = document.getElementById('greeting-icon');
    const dateEl = document.getElementById('current-date');

    if(dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    if (!greetingText || !greetingIcon) return;

    if (hour >= 5 && hour < 12) {
        greetingText.textContent = 'صباح الخير';
        greetingIcon.className = 'fas fa-sun';
        greetingIcon.style.color = '#ffd700';
    } else if (hour >= 12 && hour < 17) {
        greetingText.textContent = 'طاب يومك';
        greetingIcon.className = 'fas fa-cloud-sun';
        greetingIcon.style.color = '#ff9800';
    } else {
        greetingText.textContent = 'مساء الخير';
        greetingIcon.className = 'fas fa-moon';
        greetingIcon.style.color = '#00d4ff';
    }
}

function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment'); // success أو failed

    if (paymentStatus) {
        // تنظيف الرابط (إزالة ?payment=... عشان لو عمل ريفريش مايطلعش تاني)
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);

        if (paymentStatus === 'success') {
            showStatusModal(true);
            // تشغيل صوت نجاح خفيف (اختياري)
            // const audio = new Audio('/sounds/success.mp3'); audio.play().catch(e=>{});
        } else {
            showStatusModal(false);
        }
    }
}

function showStatusModal(isSuccess) {
    const modal = document.getElementById('payment-status-modal');
    const content = modal.querySelector('.status-card');
    const icon = document.getElementById('status-icon');
    const title = document.getElementById('status-title');
    const msg = document.getElementById('status-message');
    const btn = document.getElementById('status-btn');

    modal.style.display = 'block';

    if (isSuccess) {
        // تفعيل ستايل النجاح
        content.classList.remove('status-error');
        content.classList.add('status-success');
        
        icon.className = 'fas fa-check';
        title.textContent = 'تم الدفع بنجاح! 🎉';
        msg.textContent = 'تمت إضافة النقاط إلى رصيدك فوراً. يمكنك الآن استخدامها لتمييز إعلاناتك أو نشر المزيد.';
        btn.textContent = 'ممتاز، شكراً';
        btn.style.background = 'linear-gradient(135deg, #00ff88, #00b862)';
        btn.style.color = 'black';
        
        // تحديث بيانات المستخدم (عشان الرصيد الجديد يظهر)
        if(typeof loadUserData === 'function') loadUserData();

    } else {
        // تفعيل ستايل الفشل
        content.classList.remove('status-success');
        content.classList.add('status-error');
        
        icon.className = 'fas fa-times';
        title.textContent = 'فشلت عملية الدفع 😓';
        msg.textContent = 'لم يتم خصم أي مبلغ. يرجى التأكد من بيانات البطاقة أو المحفظة والمحاولة مرة أخرى.';
        btn.textContent = 'محاولة مرة أخرى';
        btn.style.background = 'linear-gradient(135deg, #ff4444, #c62828)';
        btn.style.color = 'white';
        
        // عند الضغط يفتح مودال الشحن تاني
        btn.onclick = function() {
            closeStatusModal();
            if(typeof openChargeModal === 'function') openChargeModal();
        };
    }
}

window.closeStatusModal = function() {
    document.getElementById('payment-status-modal').style.display = 'none';
};

// ✅ دالة تحميل بيانات المستخدم
window.loadUserData = async function() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated) {
            // شارة التوثيق
            const verifiedBadge = data.is_verified ? 
                `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-right:5px; vertical-align:middle; box-shadow:0 0 5px rgba(255, 215, 0, 0.5);"></i>` : '';

            // تحديث الأسماء
            const usernameEl = document.getElementById('dropdown-username');
            const welcomeEl = document.getElementById('welcome-title');
            
            if (usernameEl) usernameEl.innerHTML = `${data.name} ${verifiedBadge}`;
            if (welcomeEl) welcomeEl.innerHTML = `مرحباً، ${data.name} ${verifiedBadge}`;

            // تحديث الرصيد (مع إضافة علامة +)
            const balanceEl = document.getElementById('dropdown-balance');
            if (balanceEl) {
                // التأكد من وجود علامة الزائد، لو مش موجودة نضيفها
                let plusBadge = balanceEl.querySelector('.add-points-badge');
                if (!plusBadge) {
                    plusBadge = `<div class="add-points-badge"><i class="fas fa-plus"></i></div>`;
                } else {
                    plusBadge = plusBadge.outerHTML;
                }

                if (data.isPaymentActive) {
                    balanceEl.innerHTML = `<span id="balance-num">${data.balance}</span> <i class="fas fa-coins"></i> ${plusBadge}`;
                    balanceEl.style.display = 'flex';
                } else {
                    balanceEl.style.display = 'none';
                }
            }

            // تحديث صورة البروفايل
            const profileBtn = document.getElementById('dashboard-profile-btn');
            if (profileBtn) {
                if (data.profile_picture && !data.profile_picture.includes('logo.png')) {
                    profileBtn.innerHTML = `
                        <img src="${data.profile_picture}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                        <span id="menu-notif-badge" class="menu-badge">0</span>
                    `;
                } else {
                    profileBtn.innerHTML = `
                        <i class="fas fa-bars"></i>
                        <span id="menu-notif-badge" class="menu-badge">0</span>
                    `;
                }
            }

            // إظهار لوحة الأدمن
            if (data.role === 'admin') {
                const adminCard = document.getElementById('admin-card');
                if (adminCard) adminCard.style.display = 'block';
            }

        } else {
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error("Load User Data Error:", e);
    }
};

// ==========================================
// ❤️ 2. منطق المفضلة
// ==========================================

async function toggleFavorites() {
    const area = document.getElementById('favorites-area');
    const container = document.getElementById('favorites-listings');
    const btnText = document.getElementById('show-favorites');
    
    // 1. التبديل بين الفتح والإغلاق
    if (area.style.display === 'block') {
        area.style.display = 'none';
        if(btnText) btnText.innerHTML = 'عرض المفضلة';
        return;
    }

    area.style.display = 'block';
    if(btnText) btnText.innerHTML = 'إخفاء المفضلة';

    // 2. تمرير ناعم للقسم
    setTimeout(() => {
        area.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // 3. عرض مؤشر التحميل
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--neon-primary);">
            <i class="fas fa-circle-notch fa-spin fa-2x"></i>
            <p style="margin-top:10px; color:#aaa;">جاري جلب عقاراتك المميزة...</p>
        </div>`;

    try {
        const res = await fetch('/api/favorites');
        
        if (!res.ok) {
            throw new Error(`Network response was not ok (Status: ${res.status})`);
        }
        
        const properties = await res.json();
        container.innerHTML = '';

        if (properties.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:30px; border:1px dashed #444; border-radius:15px; color:#888;">
                    <i class="far fa-heart" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <p>قائمة المفضلة فارغة حالياً.</p>
                </div>`;
            return;
        }

        // 4. بناء الكروت
        properties.forEach(prop => {
            const price = parseInt(prop.price).toLocaleString('en-US');
            const location = prop.location || 'موقع مميز'; 

            const html = `
                <div class="fav-card" id="fav-item-${prop.id}">
                    <a href="property-details?id=${prop.id}" class="fav-img-link">
                        <img src="${prop.imageUrl || 'logo.png'}" class="fav-img" loading="lazy" alt="${prop.title}">
                        <div class="price-badge">${price} ج.م</div>
                    </a>
                    <div class="fav-content">
                        <div>
                            <div class="fav-title" title="${prop.title}">${prop.title}</div>
                            <div class="fav-location" style="color:#aaa; font-size:0.8rem; margin-bottom:10px;">
                                <i class="fas fa-map-marker-alt"></i> ${location}
                            </div>
                        </div>
                        <div class="fav-actions">
                            <a href="property-details?id=${prop.id}" class="btn-fav-view">
                                <i class="fas fa-eye"></i> التفاصيل
                            </a>
                            <button class="btn-fav-remove" onclick="removeFavorite(${prop.id})" title="حذف">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

    } catch (e) {
        console.error("Favorites Error:", e);
        container.innerHTML = `
            <div style="text-align:center; color:#ff4444; grid-column: 1/-1; padding: 20px;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p style="margin-top:10px;">حدث خطأ في الاتصال بالخادم.</p>
            </div>`;
    }
}

// دالة الحذف
window.removeFavorite = async function(id) {
    if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;
    
    const card = document.getElementById(`fav-item-${id}`);
    if(card) card.style.opacity = '0.5';

    try {
        const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            if(card) {
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.remove();
                    const container = document.getElementById('favorites-listings');
                    if (container && container.children.length === 0) {
                        toggleFavorites(); // لإعادة التحميل وإظهار رسالة "فارغة"
                        setTimeout(toggleFavorites, 50); 
                    }
                }, 300);
            }
        } else {
            alert('فشل الحذف، حاول مرة أخرى.');
            if(card) card.style.opacity = '1';
        }
    } catch (e) {
        console.error(e);
        alert('خطأ في الاتصال');
        if(card) card.style.opacity = '1';
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

        // تحديث العداد
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

        // تعبئة القائمة (لو موجودة في الـ HTML بتاعك)
        if (list && data.notifications && data.notifications.length > 0) {
            // ... منطق تعبئة القائمة ...
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
        
        // عند الفتح: إخفاء العداد الخارجي وتصفير القراءة
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

window.addEventListener('click', function(e) {
    const container = document.querySelector('.profile-menu-container');
    const menu = document.getElementById('profile-dropdown');
    const isDelete = e.target.closest('.notif-delete-btn');
    
    if (container && menu && !container.contains(e.target) && !isDelete) {
        menu.style.display = 'none';
    }
});

// ==========================================
// 💳 5. منطق شحن المحفظة (تم التعديل لربطه بالأدمن)
// ==========================================

window.openChargeModal = function() {
    const modal = document.getElementById('charge-modal');
    if(modal) {
        modal.style.display = 'block';
        
        // تحديث عرض السعر في المودال لو فيه عنصر بيعرضه
        const priceLabel = document.getElementById('current-point-price');
        if(priceLabel) priceLabel.textContent = currentPointPrice;
        
        // تصفير الحقول
        document.getElementById('charge-points').value = '';
        document.getElementById('price-display').textContent = '0';
        selectPaymentMethod('card');
    }
};

window.closeChargeModal = function() {
    document.getElementById('charge-modal').style.display = 'none';
};

let selectedMethod = 'card';

window.selectPaymentMethod = function(method) {
    selectedMethod = method;
    
    // إزالة الكلاس active من الكل
    document.querySelectorAll('.modern-method-card').forEach(el => el.classList.remove('active'));
    
    if (method === 'card') {
        document.getElementById('btn-card').classList.add('active');
        document.getElementById('wallet-input-container').style.display = 'none';
    } else {
        document.getElementById('btn-wallet').classList.add('active');
        document.getElementById('wallet-input-container').style.display = 'block';
    }
};

window.calculatePrice = function() {
    const points = document.getElementById('charge-points').value;
    const priceDisplay = document.getElementById('price-display');
    
    // 💰 هنا التعديل المهم: الضرب في السعر اللي جاي من الأدمن
    const price = points ? (points * currentPointPrice).toFixed(2) : 0; 
    
    if(priceDisplay) priceDisplay.textContent = price;
};

window.startChargeProcess = async function() {
    const points = document.getElementById('charge-points').value;
    const walletNumber = document.getElementById('wallet-number').value;
    const btn = document.querySelector('#charge-modal button[onclick="startChargeProcess()"]');

    if (!points || points < 1) return alert('أقل عدد للنقاط هو 1');
    if (selectedMethod === 'wallet' && (!walletNumber || walletNumber.length < 11)) {
        return alert('أدخل رقم محفظة صحيح');
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جاري المعالجة...';
    btn.disabled = true;

    const payload = {
        points: parseInt(points),
        method: selectedMethod,
        mobileNumber: selectedMethod === 'wallet' ? walletNumber : null
    };

    try {
        // 🔥 استخدام الرابط الصحيح في السيرفر /api/payment/charge
        const response = await fetch('/api/payment/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            if (data.redirectUrl) window.location.href = data.redirectUrl;
            else if (data.iframeUrl) window.location.href = data.iframeUrl;
        } else {
            alert('خطأ: ' + data.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert('فشل الاتصال بالسيرفر');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// 🔐 6. منطق تغيير كلمة المرور
// ==========================================
// (الكود زي ما هو من غير تغيير)

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
// تشغيل الفحص عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkBlockedUsers();
});

// متغير عالمي لتخزين القائمة عشان منطلبش السيرفر مرتين
let blockedUsersList = [];

async function checkBlockedUsers() {
    try {
        const res = await fetch('/api/user/my-reports');
        if (res.ok) {
            blockedUsersList = await res.json();
            const card = document.getElementById('blocked-users-card');
            const badge = document.getElementById('blocked-count-badge');

            // 🔥 اللوجيك: لو القائمة فيها ناس، أظهر الكارت
            if (blockedUsersList.length > 0 && card) {
                card.style.display = 'block'; 
                card.style.animation = 'slideDown 0.5s ease-out'; // أنيميشن ظهور
                if(badge) badge.textContent = blockedUsersList.length;
            } else if (card) {
                card.style.display = 'none'; // اختفاء لو مفيش حد
            }
        }
    } catch (e) {
        console.error("Error checking blocked users:", e);
    }
}

function openBlockedUsersModal() {
    const modal = document.getElementById('blocked-users-modal');
    const container = document.getElementById('blocked-list-container');
    modal.style.display = 'block';
    
    // رسم العناصر في المودال بناءً على القائمة المحفوظة
    if (blockedUsersList.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">القائمة فارغة</p>';
        return;
    }

    let html = '';
    blockedUsersList.forEach(user => {
        html += `
            <div class="blocked-row" id="row-${user.reported_phone}">
                <div class="blocked-info">
                    <h4>${user.name || 'مستخدم عقارك'}</h4>
                    <p><i class="fas fa-phone-alt"></i> ${user.reported_phone}</p>
                    <p style="color:#ff4444; font-size:0.7rem;">${user.reason || 'بدون سبب'}</p>
                </div>
                <button onclick="unblockUser('${user.reported_phone}')" class="btn-mini-unblock">
                    فك الحظر
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function closeBlockedModal() {
    document.getElementById('blocked-users-modal').style.display = 'none';
}

async function unblockUser(phone) {
    if(!confirm("فك الحظر عن هذا المستخدم؟")) return;

    try {
        const res = await fetch('/api/user/remove-report', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ reportedPhone: phone })
        });

        if (res.ok) {
            // 1. حذف الصف من المودال
            const row = document.getElementById(`row-${phone}`);
            if(row) row.remove();

            // 2. تحديث القائمة المحلية والعداد
            blockedUsersList = blockedUsersList.filter(u => u.reported_phone !== phone);
            
            // 3. لو القائمة فضيت، نخفي الكارت ونقفل المودال
            if (blockedUsersList.length === 0) {
                closeBlockedModal();
                const card = document.getElementById('blocked-users-card');
                if(card) {
                    card.style.transition = '0.5s';
                    card.style.opacity = '0';
                    setTimeout(() => card.style.display = 'none', 500);
                }
            } else {
                // تحديث العداد بس
                const badge = document.getElementById('blocked-count-badge');
                if(badge) badge.textContent = blockedUsersList.length;
            }
        }
    } catch (e) {
        alert("خطأ في الاتصال");
    }
}