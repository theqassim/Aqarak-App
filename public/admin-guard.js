(function() {
    const userRole = localStorage.getItem('userRole');

    if (userRole !== 'admin') {
        alert('ليس لديك صلاحية للوصول لهذه الصفحة (خاصة بالأدمن فقط).');
        window.location.href = 'home.html';
    }
})();