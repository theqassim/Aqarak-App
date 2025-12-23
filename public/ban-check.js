document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me');
        
        // لو السيرفر رد بـ 403 معناه محظور (حسب كود السيرفر اللي عملناه)
        if (response.status === 403) {
            const data = await response.json();

            if (data.banned) {
                // 1. تجهيز رسالة الواتساب
                const message = `مرحباً فريق عقارك،\nحسابي (@${data.username}) تم حظره وأريد الاستفسار.\nرقم الهاتف: ${data.phone}`;
                const waUrl = `https://wa.me/201008102237?text=${encodeURIComponent(message)}`;

                // 2. استبدال محتوى الصفحة بالكامل بشاشة الحظر (فكرتك)
                document.body.innerHTML = `
                    <style>
                        body { margin: 0; padding: 0; background-color: #0f0f0f; font-family: 'Cairo', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                        .ban-container {
                            text-align: center; background: #1a1a1a; padding: 50px; border-radius: 20px;
                            border: 2px solid #ff4444; box-shadow: 0 0 50px rgba(255, 68, 68, 0.2);
                            max-width: 90%; width: 500px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        }
                        .ban-icon { font-size: 5rem; color: #ff4444; margin-bottom: 20px; display: block; }
                        h1 { color: white; font-size: 2rem; margin-bottom: 15px; }
                        p { color: #ccc; font-size: 1.1rem; line-height: 1.6; margin-bottom: 40px; }
                        
                        .btn-wa {
                            display: flex; align-items: center; justify-content: center; gap: 10px;
                            background: #25d366; color: white; text-decoration: none; padding: 15px 30px;
                            border-radius: 50px; font-weight: bold; font-size: 1.1rem; transition: 0.3s;
                            margin-bottom: 15px; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3);
                        }
                        .btn-wa:hover { background: #128c7e; transform: translateY(-2px); }
                        
                        .btn-logout {
                            background: transparent; color: #ff4444; border: 1px solid #ff4444;
                            padding: 10px 25px; border-radius: 50px; cursor: pointer; font-size: 0.9rem;
                            transition: 0.3s; width: 100%;
                        }
                        .btn-logout:hover { background: rgba(255, 68, 68, 0.1); }

                        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    </style>

                    <div class="ban-container">
                        <i class="fas fa-ban ban-icon"></i> <h1>⛔ حسابك محظور</h1>
                        <p>
                            عذراً، تم إيقاف حسابك لمخالفة سياسات الموقع.
                            <br>إذا كان لديك استفسار، تواصل مع الدعم الفني.
                        </p>
                        
                        <a href="${waUrl}" target="_blank" class="btn-wa">
                            <i class="fab fa-whatsapp"></i> تواصل مع الدعم عبر واتساب
                        </a>

                        <button id="force-logout-btn" class="btn-logout">
                            تسجيل خروج
                        </button>
                    </div>
                `;

                // 3. تشغيل زر الخروج
                document.getElementById('force-logout-btn').addEventListener('click', async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/'; 
                });
            }
        }
    } catch (e) {
        console.error("Ban check error", e);
    }
});