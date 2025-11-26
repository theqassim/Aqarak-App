document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('request-form');
    const messageEl = document.getElementById('request-message');

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageEl.textContent = 'جاري إرسال طلبك...';
            messageEl.className = '';

            const data = {
                name: document.getElementById('req-name').value,
                phone: document.getElementById('req-phone').value,
                email: document.getElementById('req-email').value,
                specifications: document.getElementById('req-specs').value,
            };

            try {
                const response = await fetch('/api/request-property', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.message || 'فشل إرسال الطلب.');
                }

                window.location.href = 'thank-you-request'; // سيتم إنشاء هذه الصفحة لاحقًا

            } catch (error) {
                messageEl.textContent = `فشل الإرسال: ${error.message}`;
                messageEl.className = 'error';
            }
        });
    }
});