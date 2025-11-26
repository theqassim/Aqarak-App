(function() {
    const userRole = localStorage.getItem('admin');

    if (!userRole) {
        alert('هذه الصفحة خاصة بالادارة فقط!');
        window.location.href = 'home';
    }
})();