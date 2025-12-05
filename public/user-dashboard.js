// user-dashboard.js المعدل ليتناسب مع الـ HTML الحالي

document.addEventListener('DOMContentLoaded', () => {
    
    // تعريف العناصر الموجودة فعلياً في الـ HTML
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    
    // ملاحظة: الزر id="show-change-password" في الـ HTML هو رابط عادي لصفحة الخدمات
    // لذلك لن نتحكم فيه بالجافاسكريبت وسنتركه يعمل بشكل طبيعي

    const userEmail = localStorage.getItem('userEmail'); 
    
    // --- منطق عرض المفضلة ---
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', (e) => {
            // لا نستخدم preventDefault هنا لكي ينزل الموقع للأسفل (Scroll)
            // لكن نتأكد من إظهار القسم
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                // تفعيل انسيابية الحركة لو أردت
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    // --- دالة جلب المفضلة ---
    async function fetchFavorites() {
        if (!favoritesContainer) return; // حماية في حال عدم وجود الكونتينر

        if (!userEmail) {
            favoritesContainer.innerHTML = '<p class="empty-message error">يجب تسجيل الدخول لعرض المفضلة. الإيميل مفقود.</p>';
            return;
        }
        favoritesContainer.innerHTML = '<p class="empty-message info">جاري تحميل المفضلة...</p>';

        try {
            const response = await fetch(`/api/favorites?userEmail=${encodeURIComponent(userEmail)}`);
            
            if (!response.ok) {
                let errorDetails = await response.text();
                console.error("Server Response Error:", errorDetails);
                throw new Error('فشل جلب المفضلة من الخادم.');
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
                // دوال التنسيق (تأكد أن ملف utils.js أو ما يشابهه مضمن، وإلا استخدم القيم الخام)
                const formattedPrice = window.formatPrice ? window.formatPrice(property.price, property.type) : property.price;
                const typeTag = window.getTypeTag ? window.getTypeTag(property.type) : '';

                const cardHTML = `
                    <div class="property-card">
                        <img src="${property.imageUrl || 'https://via.placeholder.com/300x200.png?text=صورة+الشقة'}" alt="${property.title}">
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
            favoritesContainer.innerHTML = `<p class="empty-message error">حدث خطأ أثناء تحميل المفضلة: ${error.message}</p>`;
        }
    }

    // --- منطق إزالة المفضلة ---
    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                // نستخدم currentTarget لضمان الإمساك بالزر حتى لو ضغطنا على الأيقونة بداخله
                const btn = e.currentTarget; 
                const propertyId = btn.dataset.id;
                
                if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;

                try {
                    const response = await fetch(`/api/favorites/${propertyId}?userEmail=${encodeURIComponent(userEmail)}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الإزالة من المفضلة.');
                    
                    alert('تمت الإزالة بنجاح.');
                    fetchFavorites(); // إعادة تحميل القائمة
                } catch (error) {
                    alert(`خطأ: ${error.message}`);
                }
            });
        });
    }
});