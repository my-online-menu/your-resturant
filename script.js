const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgJ-kHe9TWjaLRZnHtfdDebDFdjeTeXs3wytH5XC2WM7aUiWe11BWZ5_i3XKaW2FIIwR3unCQVukDy/pub?output=csv';

let wishlist = JSON.parse(localStorage.getItem('eliteMenuWishlist')) || [];

async function initMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1);
        
        const categories = {};

        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                const item = {
                    title: cols[0].replace(/"/g, '').trim(),
                    price: parseFloat(cols[1].trim().replace(',', '.')),
                    img: cols[2]?.trim() || 'https://via.placeholder.com/400x300',
                    category: cols[3]?.trim() || 'Други',
                    desc: cols[4]?.replace(/"/g, '').trim() || 'Елегантно поднесено изкушение.'
                };
                if (!categories[item.category]) categories[item.category] = [];
                categories[item.category].push(item);
            }
        });

        renderDropupMenu(Object.keys(categories));
        renderMenu(categories);
        updateWishlistUI();
    } catch (err) {
        document.getElementById('loader').innerText = "Грешка при зареждане.";
    }
}

// Управление на балончето с категории
function toggleCategoryMenu() {
    const menu = document.getElementById('category-dropup');
    const isVisible = menu.style.display === 'flex';
    menu.style.display = isVisible ? 'none' : 'flex';
}

function renderDropupMenu(categoryNames) {
    const menu = document.getElementById('category-dropup');
    menu.innerHTML = categoryNames.map(name => `
        <a href="#${name.replace(/\s+/g, '-')}" class="dropup-link" onclick="toggleCategoryMenu()">${name}</a>
    `).join('');
}

// Затваряне на менюто при клик извън него
window.addEventListener('click', (e) => {
    const menu = document.getElementById('category-dropup');
    const trigger = document.getElementById('category-trigger');
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.style.display = 'none';
    }
});

function renderMenu(categories) {
    const main = document.getElementById('menu-content');
    document.getElementById('loader').style.display = 'none';
    main.innerHTML = '';

    for (const [catName, products] of Object.entries(categories)) {
        const sectionId = catName.replace(/\s+/g, '-');
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'category-section';
        section.innerHTML = `
            <h2 class="category-title">${catName}</h2>
            <div class="grid">
                ${products.map(p => `
                    <div class="product-card" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                        <div class="img-box" style="background-image: url('${p.img}')"></div>
                        <div class="info-box">
                            <h3>${p.title}</h3>
                            <span class="price">€ ${p.price.toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        main.appendChild(section);
    }
}

// Modal & Wishlist
function openModal(item) {
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-price').innerText = `€ ${item.price.toFixed(2)}`;
    document.getElementById('modal-desc').innerText = item.desc;
    document.getElementById('modal-img').style.backgroundImage = `url('${item.img}')`;
    document.getElementById('add-to-wish-btn').onclick = () => { addToWishlist(item); closeModal(); };
    document.getElementById('overlay').style.display = 'flex';
}

function addToWishlist(item) {
    wishlist.push({ uid: Date.now(), title: item.title, price: item.price });
    save();
}

function removeItem(uid) {
    wishlist = wishlist.filter(i => i.uid !== uid);
    save();
}

function updateWishlistUI() {
    const list = document.getElementById('wishlist-items');
    const footer = document.getElementById('sidebar-footer');
    document.getElementById('count').innerText = wishlist.length;
    list.innerHTML = '';
    let total = 0;
    wishlist.forEach(item => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'wish-item';
        div.innerHTML = `<div><p style="font-weight:600">${item.title}</p><p style="color:var(--gold)">€ ${item.price.toFixed(2)}</p></div>
                         <button class="remove-btn" onclick="removeItem(${item.uid})">&times;</button>`;
        list.appendChild(div);
    });
    footer.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:1.4rem; font-weight:800; margin-bottom:20px;"><span>Общо:</span><span>€ ${total.toFixed(2)}</span></div>
                        <button class="btn-add" style="background:transparent; border:1px solid #ff4d4d; color:#ff4d4d" onclick="clearAll()">Изчисти всичко</button>`;
}

function save() { localStorage.setItem('eliteMenuWishlist', JSON.stringify(wishlist)); updateWishlistUI(); }
function clearAll() { wishlist = []; save(); }
function closeModal() { document.getElementById('overlay').style.display = 'none'; }
function toggleWishlist() { document.getElementById('wishlist-sidebar').classList.toggle('active'); }

window.onload = initMenu;
