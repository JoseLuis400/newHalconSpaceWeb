document.addEventListener("DOMContentLoaded", () => {
    const updates = document.querySelectorAll(".update");
    const observerOptions = { threshold: 0.2 };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add("appear");
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    updates.forEach(update => observer.observe(update));
});
