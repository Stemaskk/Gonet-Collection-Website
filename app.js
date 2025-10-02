// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Elements
const cartBtn = document.getElementById('openCart');
const closeCartBtn = document.getElementById('closeCart');
const drawer = document.getElementById('cartDrawer');
const itemsEl = document.getElementById('cartItems');
const totalEl = document.getElementById('cartTotal');
const overlay = document.getElementById('overlay');

// Cart state
const cart = [];

// Helpers
const currency = (n) => `$${Number(n).toFixed(2)}`;
const cartQty = () => cart.reduce((s, l) => s + l.qty, 0);

// Drawer open/close + focus trap
let lastFocused = null;
function openDrawer() {
    lastFocused = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    trapFocus(drawer);
}
function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    cartBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('show');
    setTimeout(() => (overlay.hidden = true), 180);
    releaseFocus();
    if (lastFocused) lastFocused.focus();
}
cartBtn.addEventListener('click', openDrawer);
closeCartBtn.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
});

// Focus trap
let removeTrap = null;
function trapFocus(container) {
    const focusable = container.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    function loop(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', loop);
    removeTrap = () => document.removeEventListener('keydown', loop);
    first.focus();
}
function releaseFocus() {
    if (removeTrap) removeTrap();
    removeTrap = null;
}

// Render cart
function renderCart() {
    itemsEl.innerHTML = '';
    let total = 0;
    cart.forEach((line, i) => {
        total += line.price * line.qty;
        const div = document.createElement('div');
        div.className = 'line';
        div.innerHTML = `
      <img src="${line.img}" alt="">
      <div style="flex:1;">
        <div style="font-weight:600">${line.name}</div>
        <div style="font-size:13px;color:#555;">Qty ${line.qty}</div>
      </div>
      <div>${currency(line.price * line.qty)}</div>
      <button class="btn" aria-label="Remove ${line.name}">–</button>
    `;
        div.querySelector('button').onclick = () => { cart.splice(i, 1); update(); };
        itemsEl.appendChild(div);
    });
    totalEl.textContent = currency(total);
    cartBtn.textContent = `Cart (${cartQty()})`;
}
function update(){ renderCart(); }

// Add to cart
document.querySelectorAll('.add').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.card');
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price);
        const img = card.querySelector('img').src;

        const existing = cart.find(l => l.name === name);
        if (existing) existing.qty += 1;
        else cart.push({ name, price, qty: 1, img });

        update(); openDrawer();
    });
});

// (Optional) “Buy now” placeholder — hook to Stripe Payment Link or Checkout
document.querySelectorAll('.buy').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Replace with Stripe Payment Link or Checkout Session navigation:
        // window.location.href = 'https://buy.stripe.com/...';
        openDrawer();
    });
});