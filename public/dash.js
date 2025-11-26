document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    const nav = document.querySelector('.main-nav');

    if (!userRole) {
        return;
    }

    if (userRole === 'admin') {
        if (nav && !document.querySelector('.admin-btn')) {
            const adminButton = document.createElement('a');
            adminButton.href = 'admin-home';
            adminButton.className = 'nav-button neon-button-white admin-btn';
            adminButton.textContent = 'لوحة التحكم';
            nav.prepend(adminButton);
        }
    }
    });