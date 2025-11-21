document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    const nav = document.querySelector('.main-nav');

    if (!userRole) {
        return;
    }
    
    if (nav && !document.querySelector('.logout-btn')) {
        const logoutButton = document.createElement('a');
        logoutButton.href = '#';
        logoutButton.className = 'nav-button neon-button-white logout-btn';
        logoutButton.textContent = 'تسجيل خروج';
        nav.append(logoutButton);
    }
});