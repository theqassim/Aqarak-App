document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search-bar');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const keyword = searchInput.value;
            if (keyword) {
                window.location.href = `all-properties?keyword=${encodeURIComponent(keyword)}`;
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });
    }
});