document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 1. אנימציות חשיפה בגלילה (Scroll Reveal)
    // ==========================================
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });
    revealElements.forEach(el => revealObserver.observe(el));

    // ==========================================
    // 2. אפקט סקרול להאדר (Header Scroll Effect)
    // ==========================================
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================
    // 3. תפריט מובייל (Mobile Menu)
    // ==========================================
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if(navLinks) navLinks.classList.remove('active');
        });
    });

    // ==========================================
    // 4. שאלות ותשובות (FAQ Toggle)
    // ==========================================
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
});
