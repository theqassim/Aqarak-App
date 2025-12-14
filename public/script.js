document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        if (userData.isAuthenticated) {
            localStorage.setItem('userEmail', userData.email); 

            if (userData.role === 'admin') {
                if(window.location.pathname.includes('login') || window.location.pathname === '/') {
                   window.location.href = 'admin-home';
                }
            } else {
                if(window.location.pathname.includes('login')) {
                   window.location.href = 'home';
                }
            }
        }
    } catch (error) {
        console.log("زائر جديد أو غير مسجل");
    }

    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(loginMessageEl) loginMessageEl.textContent = 'جاري التحقق...';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    if (data.role === 'admin') window.location.href = 'admin-home';
                    else window.location.href = 'home';
                } else {
                    throw new Error(data.message);
                }

            } catch (error) {
                if(loginMessageEl) {
                    loginMessageEl.textContent = 'خطأ: تأكد من البيانات';
                    loginMessageEl.style.color = 'red';
                }
            }
        });
    }
});