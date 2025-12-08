// document.addEventListener('DOMContentLoaded', async () => {
//     console.log("🚀 بدء التحقق من الصلاحيات...");

//     try {
//         // نطلب من السيرفر التحقق من الكوكيز
//         const response = await fetch('/api/auth/me');
//         console.log("📡 حالة استجابة السيرفر:", response.status);

//         // إذا كان السيرفر لا يعمل أو الرابط خطأ
//         if (!response.ok) {
//             throw new Error(`Server returned status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("📦 البيانات المستلمة من السيرفر:", data);

//         // الشرط الحاسم: هل أنت مسجل؟ وهل أنت أدمن؟
//         if (!data.isAuthenticated || data.role !== 'admin') {
//             console.warn("⛔ محاولة دخول غير مصرح بها.");
//             console.log("هل أنت مسجل؟", data.isAuthenticated);
//             console.log("رتبتك الحالية:", data.role);
            
//             // 🛑 لقد عطلت التوجيه مؤقتاً لكي نرى الخطأ
//             // window.location.href = '/home.html'; 
//             alert("أنت لا تملك صلاحية الأدمن، أو لم يتم تسجيل دخولك بنجاح.\n(راجع الكونسول للتفاصيل)");
//         } else {
//             console.log("✅ أهلاً بك يا أدمن!");
//             document.body.style.display = 'block';
//         }

//     } catch (error) {
//         console.error("❌ فشل التحقق من الصلاحيات (NetworkError):", error);
//         alert("حدث خطأ في الاتصال بالسيرفر. تأكد أن السيرفر يعمل.\n(راجع الكونسول)");
//         // window.location.href = '/home.html'; // 🛑 معطل مؤقتاً
//     }
// });