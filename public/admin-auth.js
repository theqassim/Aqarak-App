(function() {
    const userRole = localStorage.getItem('userRole');

    if (userRole !== 'admin') {
        alert('هذه الصفحة خاصة بالادارة فقط!');
        window.location.href = 'home';
    }
})();