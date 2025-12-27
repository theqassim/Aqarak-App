 document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show-el');
                    }
                });
            }, { threshold: 0.1 }); // يظهر لما 10% من العنصر يبان

            // مراقبة جميع العناصر اللي واخده كلاس hidden-el
            const hiddenElements = document.querySelectorAll('.hidden-el');
            hiddenElements.forEach((el) => observer.observe(el));
        });