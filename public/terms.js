document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show-el");
        }
      });
    },
    { threshold: 0.1 }
  );

  const hiddenElements = document.querySelectorAll(".hidden-el");
  hiddenElements.forEach((el) => observer.observe(el));
});
