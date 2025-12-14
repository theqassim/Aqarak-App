document.addEventListener('DOMContentLoaded', () => {

    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const userEmail = localStorage.getItem('userEmail'); 
    
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', (e) => {
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    async function fetchFavorites() {
        if (!favoritesContainer) return;

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

    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget; 
                const propertyId = btn.dataset.id;
                
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
});