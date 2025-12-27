document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/auth/me");

    if (response.status === 403) {
      const data = await response.json();

      if (data.banned) {
        const message = `مرحباً دعم عقارك،\nحسابي (@${data.username}) تم حظره وأريد الاستفسار.\nرقم الهاتف: ${data.phone}`;
        const waUrl = `https://wa.me/201008102237?text=${encodeURIComponent(
          message
        )}`;

        document.body.innerHTML = `
                    <style>
                        /* إعدادات الصفحة للحظر */
                        body { 
                            margin: 0; padding: 0; 
                            background-color: #050505; 
                            background-image: radial-gradient(circle at 50% 0%, #1a0000 0%, #050505 70%);
                            font-family: 'Cairo', sans-serif; 
                            height: 100vh; 
                            overflow: hidden; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                        }

                        /* كارت الحظر */
                        .ban-card {
                            background: rgba(20, 20, 20, 0.95);
                            padding: 50px 40px;
                            border-radius: 25px;
                            border: 1px solid #333;
                            border-top: 4px solid #ff4444;
                            box-shadow: 0 0 50px rgba(255, 68, 68, 0.15);
                            text-align: center;
                            max-width: 90%;
                            width: 480px;
                            animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                            position: relative;
                        }

                        /* الأيقونة */
                        .icon-wrapper {
                            width: 100px; height: 100px;
                            background: rgba(255, 68, 68, 0.1);
                            border-radius: 50%;
                            display: flex; align-items: center; justify-content: center;
                            margin: 0 auto 25px;
                            box-shadow: 0 0 30px rgba(255, 68, 68, 0.2);
                        }
                        .ban-icon { font-size: 3.5rem; color: #ff4444; }

                        /* النصوص */
                        h1 { color: white; font-size: 2rem; margin-bottom: 15px; text-shadow: 0 0 10px rgba(255, 68, 68, 0.5); }
                        p { color: #aaa; font-size: 1.1rem; line-height: 1.6; margin-bottom: 40px; }

                        /* الأزرار */
                        .btn-wa {
                            display: flex; align-items: center; justify-content: center; gap: 10px;
                            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
                            color: white; text-decoration: none; padding: 15px;
                            border-radius: 50px; font-weight: bold; font-size: 1.1rem;
                            box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3);
                            transition: transform 0.3s;
                            margin-bottom: 15px;
                        }
                        .btn-wa:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(37, 211, 102, 0.4); }

                        .btn-logout {
                            background: transparent; color: #888; border: 1px solid #444;
                            padding: 12px; border-radius: 50px; cursor: pointer; font-size: 1rem;
                            transition: 0.3s; width: 100%; font-family: inherit;
                        }
                        .btn-logout:hover { border-color: #ff4444; color: #ff4444; background: rgba(255, 68, 68, 0.05); }

                        /* الأنيميشن */
                        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    </style>

                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                    
                    <div class="ban-card">
                        <div class="icon-wrapper">
                            <i class="fas fa-user-slash ban-icon"></i>
                        </div>
                        <h1>حسابك محظور</h1>
                        <p>
                            عذراً، تم إيقاف حسابك مؤقتاً لمخالفة سياسات الموقع.
                            <br>إذا كنت تعتقد أن هناك خطأ، تواصل معنا.
                        </p>
                        
                        <a href="${waUrl}" class="btn-wa">
                            <i class="fab fa-whatsapp"></i> تواصل مع الدعم الفني
                        </a>

                        <button id="forceLogoutBtn" class="btn-logout">
                            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                        </button>
                    </div>
                `;

        document
          .getElementById("forceLogoutBtn")
          .addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/";
          });
      }
    }
  } catch (e) {
    console.error("Ban check error", e);
  }
});
