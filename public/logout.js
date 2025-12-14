document.addEventListener('DOMContentLoaded', () => {
    
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });

    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('هل تريد تسجيل الخروج؟')) {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userPhone');
                localStorage.clear();
                
                window.location.href = 'index';
            }
        });
    });
});