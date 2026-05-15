const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgJ-kHe9TWjaLRZnHtfdDebDFdjeTeXs3wytH5XC2WM7aUiWe11BWZ5_i3XKaW2FIIwR3unCQVukDy/pub?output=csv';

let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];

async function fetchMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        
        const categories = {};

        rows.forEach(row => {
            // Regex за правилно четене на CSV (в случай на запетаи в описанието)
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols.length >= 2) {
                const item = {
                    title: cols[0].replace(/"/g, '').trim(),
                    price: cols[1].trim(),
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
        document.getElementById('loader').innerHTML = "Грешка при зареждане. Проверете връзката.";
    }
}

function renderMenu(categories) {
    const menuContainer = document.getElementById('menu-content');
    document.getElementById('loader').style.display = 'none';
    menuContainer.innerHTML = '';

    for (const [catName, products] of Object.entries(categories)) {
        const section = document.createElement('section');
        section.innerHTML = `
            <h2 class="category-title">${catName}</h2>
            <div class="grid">
                ${products.map(p => `
                    <div class="product-card" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                        <div class="img-box" style="background-image: url('${p.img}')"></div>
                        <div class="info-box">
                            <h3>${p.title}</h3>
                            <span class="price">${p.price} лв.</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        menuContainer.appendChild(section);
    }
}

function openModal(item) {
    const modal = document.getElementById('overlay');
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-price').innerText = `${item.price} лв.`;
    document.getElementById('modal-desc').innerText = item.desc;
    document.getElementById('modal-img').style.backgroundImage = `url('${item.img}')`;
    
    const btn = document.getElementById('add-wish-btn');
    btn.onclick = () => {
        addToWishlist(item.title);
        closeModal();
    };

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('overlay').style.display = 'none';
}

function addToWishlist(title) {
    if (!wishlist.includes(title)) {
        wishlist.push(title);
        saveAndRefresh();
    }
}

function toggleWishlist() {
    document.getElementById('wishlist-sidebar').classList.toggle('active');
}

function clearWishlist() {
    wishlist = [];
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('myWishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function updateWishlistUI() {
    document.getElementById('count').innerText = wishlist.length;
    const list = document.getElementById('wishlist-items');
    list.innerHTML = wishlist.map(item => `<li>⭐ ${item}</li>`).join('');
}

// Затвори модала при натискане на Escape
window.onkeydown = (e) => { if(e.key === "Escape") closeModal(); };

window.onload = fetchMenu;
