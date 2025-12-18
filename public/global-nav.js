if (data.isAuthenticated && data.role === 'user') {
async function logout() {
    if (!confirm('هل تريد تأكيد تسجيل الخروج؟')) return;

    try {
        const response = await fetch('/api/logout', { method: 'POST' });

        if (response.ok) {
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.clear();

            window.location.href = 'index';
        } else {
            console.error('Server logout failed');
            alert('حدث خطأ أثناء محاولة الخروج من السيرفر.');
        }

    } catch (error) {
        console.error('Logout Error:', error);
        alert('حدث خطأ في الاتصال. تأكد من الإنترنت.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.logout-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
}