/* CoHonon — main.js */

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ── Nav scroll state ──
const nav = document.querySelector('nav');
const hero = document.getElementById('hero');

const navObserver = new IntersectionObserver(
  ([entry]) => {
    nav.classList.toggle('nav--scrolled', !entry.isIntersecting);
  },
  { threshold: 0.1 }
);

navObserver.observe(hero);

// ── Form handling ──
const form = document.getElementById('partner-form');
const successMsg = document.getElementById('form-success');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--color-accent)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) return;

    successMsg.classList.add('visible');
    setTimeout(() => {
      form.reset();
      successMsg.classList.remove('visible');
    }, 3500);
  });
}
