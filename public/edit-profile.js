      // تحميل البيانات
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                if (data.isAuthenticated) {
                    document.getElementById('display-name').value = data.name;
                    document.getElementById('display-phone').value = data.phone;
                    document.getElementById('edit-username').value = data.username;
                    if (data.profile_picture && !data.profile_picture.includes('logo.png')) {
                        document.getElementById('current-profile-img').src = data.profile_picture;
                    }
                } else { window.location.href = 'index.html'; }
            } catch (e) { console.error(e); }
        });

        // معاينة الصورة
        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) { document.getElementById('current-profile-img').src = e.target.result; }
                reader.readAsDataURL(file);
            }
        }

        // حفظ التغييرات
        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-btn');
            btn.innerHTML = 'جاري الحفظ...'; btn.disabled = true;
            const formData = new FormData();
            formData.append('newUsername', document.getElementById('edit-username').value);
            const fileInput = document.getElementById('profile-upload');
            if (fileInput.files[0]) formData.append('profileImage', fileInput.files[0]);

            try {
                const response = await fetch('/api/user/update-profile', { method: 'POST', body: formData });
                const result = await response.json();
                if (response.ok) { alert(result.message); window.location.reload(); } 
                else { alert('❌ ' + result.message); }
            } catch (error) { alert('حدث خطأ أثناء الحفظ'); } 
            finally { btn.innerHTML = 'حفظ التغييرات'; btn.disabled = false; }
        });

        // 🔴 دالة حذف الحساب
        async function confirmDeleteAccount() {
            const password = document.getElementById('delete-pass').value;
            if(!password) return alert('يرجى إدخال كلمة المرور لتأكيد الحذف');

            const btn = document.querySelector('#deleteModal .btn-delete');
            btn.innerHTML = 'جاري الحذف...'; btn.disabled = true;

            try {
                const res = await fetch('/api/user/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();
                
                if(data.success) {
                    alert('تم حذف الحساب بنجاح. إلى اللقاء 👋');
                    window.location.href = 'index.html';
                } else {
                    alert('خطأ: ' + data.message);
                    btn.innerHTML = 'تأكيد الحذف'; btn.disabled = false;
                }
            } catch(e) { 
                alert('خطأ في الاتصال'); 
                btn.innerHTML = 'تأكيد الحذف'; btn.disabled = false;
            }
        }