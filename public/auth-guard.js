(function() {
    const userRole = localStorage.getItem('userRole');

    if (!userRole) {
        alert('يجب عليك تسجيل الدخول أولاً للوصول لهذه الصفحة.');
        window.location.href = 'index';
    }
})();