// global-alert.js
// 💎 هذا الملف يقوم بتحويل كل تنبيهات الموقع إلى شكل فخم وعصري تلقائياً

(function() {
    // 1. حقن الـ CSS الخاص بالمودال الفخم (Golden/Dark Theme)
    const style = document.createElement('style');
    style.innerHTML = `
        /* الخلفية المعتمة */
        .lux-alert-overlay {
            display: none;
            position: fixed;
            z-index: 2147483647; /* أعلى طبقة ممكنة */
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        /* كارت التنبيه */
        .lux-alert-card {
            background: linear-gradient(145deg, #1a1a1a, #111);
            border: 1px solid #c5a059; /* لون ذهبي فخم */
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            max-width: 90%;
            width: 400px;
            box-shadow: 0 0 40px rgba(197, 160, 89, 0.15);
            transform: scale(0.8);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }

        /* الأيقونة */
        .lux-alert-icon {
            font-size: 3.5rem;
            color: #c5a059;
            margin-bottom: 20px;
            text-shadow: 0 0 15px rgba(197, 160, 89, 0.4);
            animation: pulseIcon 2s infinite;
        }

        /* العنوان والنص */
        .lux-alert-title {
            color: white;
            font-family: 'Cairo', sans-serif;
            font-size: 1.5rem;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .lux-alert-message {
            color: #ccc;
            font-family: 'Cairo', sans-serif;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 30px;
        }

        /* الزر الفخم */
        .lux-alert-btn {
            background: linear-gradient(90deg, #c5a059, #e6c678);
            color: #000;
            border: none;
            padding: 12px 40px;
            border-radius: 50px;
            font-family: 'Cairo', sans-serif;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(197, 160, 89, 0.3);
            transition: all 0.3s ease;
            outline: none;
        }

        .lux-alert-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(197, 160, 89, 0.5);
            background: linear-gradient(90deg, #e6c678, #c5a059);
        }

        .lux-alert-btn:active {
            transform: translateY(1px);
        }

        /* Animations */
        .lux-show {
            display: flex !important;
            opacity: 1;
        }
        .lux-show .lux-alert-card {
            transform: scale(1);
        }

        @keyframes pulseIcon {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); text-shadow: 0 0 25px rgba(197, 160, 89, 0.7); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // 2. حقن HTML المودال في الصفحة
    const modalHTML = `
        <div id="luxAlertOverlay" class="lux-alert-overlay">
            <div class="lux-alert-card">
                <div class="lux-alert-icon">
                    <i class="fas fa-bell"></i> </div>
                <h3 class="lux-alert-title">تنبيه</h3>
                <p id="luxAlertMessage" class="lux-alert-message"></p>
                <button id="luxAlertBtn" class="lux-alert-btn">حسناً</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 3. تعريف العناصر
    const overlay = document.getElementById('luxAlertOverlay');
    const msgElem = document.getElementById('luxAlertMessage');
    const btnElem = document.getElementById('luxAlertBtn');

    // 4. دالة الإغلاق
    function closeLuxAlert() {
        overlay.classList.remove('lux-show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300); // انتظر انتهاء الأنيميشن
    }

    // ربط زر الإغلاق
    btnElem.addEventListener('click', closeLuxAlert);
    
    // إغلاق عند الضغط في الخلفية (اختياري)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLuxAlert();
    });

    // 5. 🔥 السحر هنا: استبدال دالة alert الأصلية
    window.alert = function(message) {
        // وضع الرسالة
        msgElem.textContent = message;
        
        // إظهار المودال
        overlay.style.display = 'flex';
        // تأخير بسيط لتشغيل الترانزيشن
        requestAnimationFrame(() => {
            overlay.classList.add('lux-show');
        });
        
        // تشغيل صوت بسيط (اختياري - يعطي فخامة)
        // const audio = new Audio('/sounds/alert.mp3'); audio.play().catch(e=>{});
    };

    console.log("✨ Luxury Alert System Activated");

})();