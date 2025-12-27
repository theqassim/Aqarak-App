      // 1. كود إرسال الفورم (Contact Logic)
        async function handleContactSubmit(e) {
            e.preventDefault();
            
            const btn = document.getElementById('send-btn');
            const originalText = btn.innerHTML;
            
            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            if(phone.length < 11) {
                alert("يرجى كتابة رقم هاتف صحيح");
                return;
            }

            btn.innerHTML = 'جاري الإرسال... <i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                // ملاحظة: تأكد من إضافة كود السيرفر الذي أرسلته لك سابقاً ليعمل هذا الرابط
                const res = await fetch('/api/contact-us', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name, phone, subject, message })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('✅ تم استلام رسالتك بنجاح! سنتواصل معك قريباً.');
                    document.getElementById('contactForm').reset();
                } else {
                    alert('❌ حدث خطأ: ' + (data.message || 'حاول مرة أخرى'));
                }

            } catch (error) {
                console.error(error);
                alert('⚠️ تعذر الاتصال بالسيرفر');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // 2. 🔥 كود الأنيميشن عند السكرول (Scroll Animation)
        document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show-el');
                    }
                });
            }, { threshold: 0.1 }); // يبدأ الأنيميشن لما يظهر 10% من العنصر

            // مراقبة جميع العناصر المخفية
            const hiddenElements = document.querySelectorAll('.hidden-el');
            hiddenElements.forEach((el) => observer.observe(el));
        });