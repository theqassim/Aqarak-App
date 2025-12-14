document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.querySelector('.main-nav');

    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.isAuthenticated && data.role === 'admin') {
            
            if (nav && !document.querySelector('.admin-btn')) {
                const adminButton = document.createElement('a');
                adminButton.href = 'admin-home';
                adminButton.className = 'nav-button neon-button-white admin-btn';
                
                adminButton.innerHTML = '<i class="fas fa-user-shield"></i> لوحة التحكم'; 
                
                nav.prepend(adminButton);
            }
        }
    } catch (error) {
        console.log("User check: Guest or Error");
    }
});