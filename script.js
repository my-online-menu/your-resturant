const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgJ-kHe9TWjaLRZnHtfdDebDFdjeTeXs3wytH5XC2WM7aUiWe11BWZ5_i3XKaW2FIIwR3unCQVukDy/pub?output=csv';

let wishlist = JSON.parse(localStorage.getItem('eliteMenuWishlist')) || [];

async function initMenu() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Неуспешно свързване с Google Sheets");
        
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() !== ""); // Премахва празни редове
        
        const categories = {};

        // Започваме от 1, за да прескочим заглавията
        for (let i = 1; i < rows.length; i++) {
            try {
                // Използваме по-мощен Regex за разделяне, който игнорира запетаи вътре в кавички
                const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                
                if (cols.length >= 2) {
                    const title = cols[0] ? cols[0].replace(/"/g, '').trim() : "Без име";
                    const rawPrice = cols[1] ? cols[1].trim().replace(',', '.') : "0";
                    const price = parseFloat(rawPrice) || 0;
                    const img = cols[2] ? cols[2].trim() : 'https://via.placeholder.com/400x300';
                    const category = cols[3] ? cols[3].trim() : 'Други';
                    const desc = cols[4] ? cols[4].replace(/"/g, '').trim() : 'Няма описание.';

                    const item = { title, price, img, category, desc };

                    if (!categories[category]) categories[category] = [];
                    categories[category].push(item);
                }
            } catch (rowError) {
                console.warn(`Грешка на ред ${i}:`, rowError);
                continue; // Продължава със следващия продукт, вместо да чупи всичко
            }
        }

        if (Object.keys(categories).length === 0) {
            document.getElementById('loader').innerText = "Таблицата е празна или не е публикувана правилно.";
            return;
        }

        renderDropupMenu(Object.keys(categories));
        renderMenu(categories);
        updateWishlistUI();
    } catch (err) {
        console.error("Критична грешка:", err);
        document.getElementById('loader').innerText = "Критична грешка при зареждане. Моля, проверете CSV линка.";
    }
}

// Всички останали функции (toggleCategoryMenu, renderDropupMenu, renderMenu, openModal и т.н.) остават същите.
// Увери се, че си копирал и тях от предишния ми отговор!

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
                    <div class="product-card" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                        <div class="img-box" style="background-image: url("${p.img}")"></div>
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

function openModal(item) {
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-price').innerText = `€ ${item.price.toFixed(2)}`;
    document.getElementById('modal-desc').innerText = item.desc;
    document.getElementById('modal-img').style.backgroundImage = `url("${item.img}")`;
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
