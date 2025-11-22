// user-dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    
    const changePasswordBtn = document.getElementById('show-change-password');
    const favoritesBtn = document.getElementById('show-favorites');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const changePasswordArea = document.getElementById('change-password-area');
    const favoritesArea = document.getElementById('favorites-area');
    const changePasswordForm = document.getElementById('change-password-form');
    const passwordMessageEl = document.getElementById('password-message');
    const favoritesContainer = document.getElementById('favorites-listings');

    const userEmail = localStorage.getItem('userEmail'); 
    
    // --- منطق تبديل الأقسام ---
    changePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        changePasswordArea.style.display = 'block';
        favoritesArea.style.display = 'none';
        passwordMessageEl.textContent = '';
    });

    favoritesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        changePasswordArea.style.display = 'none';
        favoritesArea.style.display = 'block';
        fetchFavorites();
    });

    // --- 1. منطق تغيير كلمة المرور (بلا تغيير) ---
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        passwordMessageEl.textContent = 'جاري التحديث...';
        passwordMessageEl.className = 'info';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (newPassword !== confirmNewPassword) {
            passwordMessageEl.textContent = 'كلمتا المرور الجديدتان غير متطابقتين.';
            passwordMessageEl.className = 'error';
            return;
        }
        if (!userEmail) {
            passwordMessageEl.textContent = 'خطأ: لم يتم العثور على إيميل المستخدم.';
            passwordMessageEl.className = 'error';
            return;
        }

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل تغيير كلمة المرور.');
            }

            passwordMessageEl.textContent = data.message;
            passwordMessageEl.className = 'success';
            changePasswordForm.reset();

        } catch (error) {
            passwordMessageEl.textContent = `خطأ: ${error.message}`;
            passwordMessageEl.className = 'error';
        }
    });

    // --- 2. منطق عرض المفضلة (تم إضافة تحسينات للـ Console) ---
    async function fetchFavorites() {
        if (!userEmail) {
            favoritesContainer.innerHTML = '<p class="empty-message error">يجب تسجيل الدخول لعرض المفضلة. الإيميل مفقود.</p>';
            return;
        }
        favoritesContainer.innerHTML = '<p class="empty-message info">جاري تحميل المفضلة...</p>';

        try {
            // 🚨 يتم تمرير الإيميل كـ Query Parameter
            const response = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            
            if (!response.ok) {
                // محاولة قراءة رسالة الخطأ من الخادم
                let errorDetails = await response.text();
                console.error("Server Response Error:", errorDetails);
                
                // إذا كان الخطأ 400 (Bad Request)، فهذا يعني أن الإيميل لم يصل بشكل صحيح
                if (response.status === 400) {
                     throw new Error('فشل التحقق من الإيميل (تأكد من تسجيل الدخول).');
                }
                throw new Error('فشل جلب المفضلة من الخادم. (راجع Console)');
            }

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
                // يفترض أن الدوال المساعدة (formatPrice, getTypeTag) موجودة في utils.js
                const formattedPrice = window.formatPrice ? window.formatPrice(property.price, property.type) : property.price;
                const typeTag = window.getTypeTag ? window.getTypeTag(property.type) : '';

                const cardHTML = `
                    <div class="property-card">
                        <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=صورة+الشقة'}" alt="${property.title}">
                        <div class="card-content">
                            <h3>${property.title} ${typeTag}</h3> 
                            <p class="price">${formattedPrice}</p> 
                            <p>${property.rooms} غرف | ${property.bathrooms} حمام | ${property.area} م²</p>
                            
                            <a href="property-details.html?id=${property.id}" class="btn">عرض التفاصيل</a>
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
            favoritesContainer.innerHTML = `<p class="empty-message error">حدث خطأ أثناء تحميل المفضلة: ${error.message}</p>`;
        }
    }

    // 3. منطق إزالة المفضلة (بلا تغيير)
    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const propertyId = e.target.dataset.id;
                if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;

                try {
                    const response = await fetch(`/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userEmail)}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الإزالة من المفضلة.');
                    
                    alert('تمت الإزالة بنجاح.');
                    fetchFavorites(); 
                } catch (error) {
                    alert(`خطأ: ${error.message}`);
                }
            });
        });
    }


    // 4. منطق حذف الحساب (بلا تغيير)
    deleteAccountBtn.addEventListener('click', async () => {
        if (!userEmail) {
            alert('لا يمكن حذف الحساب. الإيميل غير متوفر.');
            return;
        }

        if (confirm('تحذير: هل أنت متأكد من حذف حسابك نهائياً؟ هذا الإجراء لا رجعة فيه.')) {
            try {
                const response = await fetch('/api/user/delete-account', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في حذف الحساب.');
                }

                alert(data.message);
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail'); 
                window.location.href = 'index.html';

            } catch (error) {
                alert(`خطأ في الحذف: ${error.message}`);
            }
        }
    });
});