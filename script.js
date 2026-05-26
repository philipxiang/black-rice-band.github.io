// ===========================
// BLACK RICE - MAIN SCRIPT
// ===========================

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navMenu.classList.remove('open'));
    });
}

// Scroll-in animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.stat-card, .show-card, .about-text').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Dynamic year
document.querySelectorAll('#year').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// Easter egg: Konami code -> "MAVERICK NATION ACTIVATED"
let konamiIdx = 0;
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                 'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
document.addEventListener('keydown', e => {
    if (e.key === KONAMI[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) { konamiIdx = 0; showRockMsg(); }
    } else {
        konamiIdx = 0;
    }
});

function showRockMsg() {
    const msg = document.createElement('div');
    msg.textContent = '🤘 MAVERICK NATION ACTIVATED 🤘';
    Object.assign(msg.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        background: '#A41034', color: '#fff',
        padding: '28px 56px',
        fontSize: '1.6rem',
        fontFamily: "'Metal Mania', cursive",
        zIndex: '99999',
        borderRadius: '8px',
        boxShadow: '0 0 60px rgba(164,16,52,0.8)',
        textAlign: 'center',
        letterSpacing: '3px',
        whiteSpace: 'nowrap'
    });
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
}

console.log('%c🎸 BLACK RICE', 'font-size:28px;color:#A41034;font-weight:bold;');
console.log('%cSt. John\'s School · Houston, TX', 'font-size:14px;color:#888;');
