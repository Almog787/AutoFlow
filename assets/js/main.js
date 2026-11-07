// =========================================================================
// הגדרות חיבור ל-Google Sheets (Google Apps Script Web App)
// -------------------------------------------------------------------------
// כתובת ה-Web App של Google Apps Script
// =========================================================================
export const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTEpLPp7SEr3c4TMbO7GOJewlcPm2CM93tU6ada4LXy3K7nbumEF44m2KSren8SYUp/exec';

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
            if (navLinks) navLinks.classList.remove('active');
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

    // ==========================================
    // 5. חיבור טופס לידים לגוגל שייטס (Google Sheets CRM)
    // ==========================================
    const leadForm = document.getElementById('lead-form');
    const leadSuccess = document.getElementById('lead-success');
    const submitBtn = document.getElementById('submit-btn');
    const contactAlert = document.getElementById('contact-alert');
    const contactAlertText = document.getElementById('contact-alert-text');
    const resetFormBtn = document.getElementById('reset-form-btn');

    const nameInput = document.getElementById('lead-name');
    const phoneInput = document.getElementById('lead-phone');
    const messageInput = document.getElementById('lead-message');
    const botCheckInput = document.getElementById('bot_check');

    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');

    function showAlert(text, isWarning = false) {
        if (!contactAlert || !contactAlertText) return;
        contactAlertText.textContent = text;
        contactAlert.className = isWarning ? 'form-alert form-alert-warning active' : 'form-alert form-alert-error active';
    }

    function hideAlert() {
        if (contactAlert) {
            contactAlert.classList.remove('active');
        }
    }

    // ניקוי שגיאות בעת הקלדה
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            nameInput.classList.remove('is-invalid');
            if (nameError) nameError.classList.remove('active');
            hideAlert();
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.classList.remove('is-invalid');
            if (phoneError) phoneError.classList.remove('active');
            hideAlert();
        });
    }

    if (leadForm) {
        leadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideAlert();

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';
            const botCheck = botCheckInput ? botCheckInput.value.trim() : '';

            // Honeypot check: אם בוט מילא שדה מוסתר, נתעלם בשקט (מונע ספאם)
            if (botCheck !== '') {
                leadForm.style.display = 'none';
                if (leadSuccess) leadSuccess.style.display = 'block';
                return;
            }

            // ולידציה של השם
            let isValid = true;
            if (name.length < 2) {
                isValid = false;
                if (nameInput) nameInput.classList.add('is-invalid');
                if (nameError) nameError.classList.add('active');
            }

            // ולידציה של הטלפון (ספרות וסימני טלפון, לפחות 9 ספרות)
            const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
            if (cleanPhone.length < 9 || !/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
                isValid = false;
                if (phoneInput) phoneInput.classList.add('is-invalid');
                if (phoneError) phoneError.classList.add('active');
            }

            if (!isValid) {
                return;
            }

            // מצב טעינה בכפתור
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
            const isHebrew = document.documentElement.lang !== 'en';
            const loadingText = isHebrew ? 'שולח פרטים למערכת...' : 'Submitting details...';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner"></span> <span>${loadingText}</span>`;
            }

            const payload = {
                name: name,
                phone: phone,
                message: message,
                bot_check: botCheck
            };

            const scriptUrl = GOOGLE_SHEETS_SCRIPT_URL || window.GOOGLE_SHEETS_SCRIPT_URL;

            try {
                if (scriptUrl && scriptUrl.startsWith('http')) {
                    // שליחה ישירה ל-Google Apps Script Web App
                    // שימוש ב-mode: 'no-cors' ו-text/plain מבטיח שלא יהיה preflight OPTIONS ושגוגל תקלוט את ה-JSON
                    await fetch(scriptUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8'
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // ניסיון שליחה דרך פרוקסי שרת במידה וקיים
                    try {
                        await fetch('/api/lead', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    } catch (netErr) {
                        console.warn('Local server notification:', netErr);
                    }
                }

                // רישום איוונט אנליטיקס
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'generate_lead', {
                        event_category: 'Contact',
                        event_label: isHebrew ? 'טופס לידים' : 'Lead Form'
                    });
                }

                // הצגת הודעת הצלחה
                leadForm.style.display = 'none';
                if (leadSuccess) {
                    leadSuccess.style.display = 'block';
                }

            } catch (err) {
                console.error('Submission error:', err);
                const errorMsg = isHebrew
                    ? 'חלה שגיאה בשליחת הפרטים. אנא נסו שוב או פנו אלינו ישירות בוואטסאפ.'
                    : 'An error occurred while submitting. Please try again or reach out on WhatsApp.';
                showAlert(errorMsg);

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
            }
        });
    }

    // איפוס ושליחת פנייה נוספת
    if (resetFormBtn && leadForm && leadSuccess) {
        resetFormBtn.addEventListener('click', () => {
            leadForm.reset();
            hideAlert();
            leadSuccess.style.display = 'none';
            leadForm.style.display = 'block';
            if (submitBtn) {
                submitBtn.disabled = false;
                const isHebrew = document.documentElement.lang !== 'en';
                submitBtn.innerHTML = `
                    <span class="btn-text">${isHebrew ? 'קבלת שיחת ייעוץ חינם' : 'Get a Free Consultation'}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                `;
            }
        });
    }
});
