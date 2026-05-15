const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgJ-kHe9TWjaLRZnHtfdDebDFdjeTeXs3wytH5XC2WM7aUiWe11BWZ5_i3XKaW2FIIwR3unCQVukDy/pub?output=csv';

// Зареждаме списъка (вече като масив от обекти)
let wishlist = JSON.parse(localStorage.getItem('myMenuWishlist')) || [];

async function fetchMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        const categories = {};

        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                const item = {
                    title: cols[0].replace(/"/g, '').trim(),
                    price: parseFloat(cols[1].trim().replace(',', '.')), // Конвертираме към число
                    img: cols[2]?.trim() || 'https://via.placeholder.com/400x300',
                    category: cols[3]?.trim() || 'Други',
                    desc: cols[4]?.replace(/"/g, '').trim() || 'Очаквайте описание скоро.'
                };
                if (!categories[item.category]) categories[item.category] = [];
                categories[item.category].push(item);
            }
        });
        renderMenu(categories);
        updateWishlistUI();
    } catch (error) {
        console.error(error);
    }
}

function renderMenu(categories) {
    const container = document.getElementById('menu-content');
    document.getElementById('loader').style.display = 'none';
    container.innerHTML = '';

    for (const [cat, products] of Object.entries(categories)) {
        const section = document.createElement('section');
        section.innerHTML = `
            <h2 class="category-title">${cat}</h2>
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
        container.appendChild(section);
    }
}

function openModal(item) {
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-price').innerText = `€ ${item.price.toFixed(2)}`;
    document.getElementById('modal-desc').innerText = item.desc;
    document.getElementById('modal-img').style.backgroundImage = `url('${item.img}')`;
    
    document.getElementById('add-wish-btn').onclick = () => {
        addToWishlist(item);
        closeModal();
    };
    document.getElementById('overlay').style.display = 'flex';
}

function addToWishlist(item) {
    // Позволяваме добавяне на един и същ продукт няколко пъти
    wishlist.push({
        id: Date.now(), // Уникално ID за триене
        title: item.title,
        price: item.price
    });
    saveAndRefresh();
}

function removeFromWishlist(id) {
    wishlist = wishlist.filter(item => item.id !== id);
    saveAndRefresh();
}

function updateWishlistUI() {
    const listElement = document.getElementById('wishlist-items');
    const countElement = document.getElementById('count');
    
    listElement.innerHTML = '';
    let total = 0;

    wishlist.forEach(item => {
        total += item.price;
        const li = document.createElement('li');
        li.className = 'wish-item';
        li.innerHTML = `
            <div class="wish-item-info">
                <span class="wish-item-name">${item.title}</span>
                <span class="wish-item-price">€ ${item.price.toFixed(2)}</span>
            </div>
            <button class="remove-item" onclick="removeFromWishlist(${item.id})">&times;</button>
        `;
        listElement.appendChild(li);
    });

    countElement.innerText = wishlist.length;
    
    // Добавяме секция за тотал, ако не съществува
    const footer = document.querySelector('.sidebar-footer');
    footer.innerHTML = `
        <div class="total-box">
            <span>Общо:</span>
            <span class="total-price">€ ${total.toFixed(2)}</span>
        </div>
        <button class="clear-btn" onclick="clearWishlist()">Изчисти всичко</button>
    `;
}

function saveAndRefresh() {
    localStorage.setItem('myMenuWishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

// Помощни функции
function closeModal() { document.getElementById('overlay').style.display = 'none'; }
function toggleWishlist() { document.getElementById('wishlist-sidebar').classList.toggle('active'); }
function clearWishlist() { wishlist = []; saveAndRefresh(); }
window.onload = fetchMenu;
