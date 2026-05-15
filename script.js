const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgJ-kHe9TWjaLRZnHtfdDebDFdjeTeXs3wytH5XC2WM7aUiWe11BWZ5_i3XKaW2FIIwR3unCQVukDy/pub?output=csv';

let wishlist = JSON.parse(localStorage.getItem('eliteMenuWishlist')) || [];

async function initMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() !== "");
        
        const categories = {};

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
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
        }

        renderDropupMenu(Object.keys(categories));
        renderMenu(categories);
        updateWishlistUI();
    } catch (err) {
        document.getElementById('loader').innerText = "Грешка при зареждане.";
    }
}

function toggleCategoryMenu() {
    const menu = document.getElementById('category-dropup');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
}

function renderDropupMenu(categoryNames) {
    const menu = document.getElementById('category-dropup');
    menu.innerHTML = categoryNames.map(name => `
        <a href="#${name.replace(/\s+/g, '-')}" class="dropup-link" onclick="toggleCategoryMenu()">${name}</a>
    `).join('');
}

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
                    <div class="product-card">
                        <div class="img-box" style="background-image: url('${p.img}')" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'></div>
                        <div class="info-box">
                            <div>
                                <h3>${p.title}</h3>
                                <span class="price">€ ${p.price.toFixed(2)}</span>
                            </div>
                            <button class="btn-direct-add" onclick='addToWishlist(${JSON.stringify(p).replace(/'/g, "&apos;")})'>+ Добави</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        main.appendChild(section);
    }
}

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
                         <button class="remove-btn" onclick="removeItem(${item.uid})">✖</button>`;
        list.appendChild(div);
    });
    footer.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:1.3rem; font-weight:800; margin: 20px 0;">
            <span>Общо:</span><span>€ ${total.toFixed(2)}</span>
        </div>
        <button class="btn-add-modal" style="background:transparent; border:1px solid #ff4d4d; color:#ff4d4d" onclick="clearAll()">Изчисти всичко</button>
    `;
}

function save() { localStorage.setItem('eliteMenuWishlist', JSON.stringify(wishlist)); updateWishlistUI(); }
function clearAll() { wishlist = []; save(); }
function closeModal() { document.getElementById('overlay').style.display = 'none'; }
function toggleWishlist() { document.getElementById('wishlist-sidebar').classList.toggle('active'); }

window.onload = initMenu;
