// ==============================================
// ДАННЫЕ НАБОРОВ (без изменений)
// ==============================================
const boxes = [
    {
        id: 1,
        name: 'Базовый набор',
        price: 5,
        items: [
            { name: 'Наушники JBL T110', sell_price: 4, rarity: 'Обычный' },
            { name: 'Мышь Logitech B100', sell_price: 3, rarity: 'Обычный' },
            { name: 'Коврик для мыши A4', sell_price: 2, rarity: 'Обычный' },
            { name: 'USB-флешка 16GB', sell_price: 5, rarity: 'Необычный' }
        ]
    },
    {
        id: 2,
        name: 'Средний набор',
        price: 10,
        items: [
            { name: 'Клавиатура A4Tech', sell_price: 8, rarity: 'Необычный' },
            { name: 'Колонка JBL Go', sell_price: 10, rarity: 'Необычный' },
            { name: 'Веб-камера Logitech', sell_price: 12, rarity: 'Редкий' },
            { name: 'SSD 240GB', sell_price: 15, rarity: 'Редкий' }
        ]
    },
    {
        id: 3,
        name: 'Продвинутый набор',
        price: 20,
        items: [
            { name: 'Монитор 24" Dell', sell_price: 25, rarity: 'Редкий' },
            { name: 'Видеокарта GTX 1650', sell_price: 30, rarity: 'Редкий' },
            { name: 'Игровая мышь Razer', sell_price: 22, rarity: 'Эпический' },
            { name: 'Механическая клавиатура', sell_price: 28, rarity: 'Эпический' }
        ]
    },
    {
        id: 4,
        name: 'Премиум набор',
        price: 50,
        items: [
            { name: 'Ноутбук ASUS ROG', sell_price: 60, rarity: 'Легендарный' },
            { name: 'Смартфон iPhone 15', sell_price: 70, rarity: 'Легендарный' },
            { name: 'Монитор 32" 4K', sell_price: 65, rarity: 'Легендарный' },
            { name: 'Игровой ПК (сборка)', sell_price: 80, rarity: 'Легендарный' }
        ]
    }
];

// ==============================================
// РАБОТА С ПОЛЬЗОВАТЕЛЕМ (localStorage)
// ==============================================
function getUser() {
    let data = localStorage.getItem('techno_user');
    if (!data) {
        const newUser = {
            username: 'Гость',
            isGuest: true,
            balance: 5,
            inventory: [],
            lastBonusDate: null,
            withdrawHistory: [], // история выводов
            registeredUsers: [] // для имитации БД
        };
        localStorage.setItem('techno_user', JSON.stringify(newUser));
        return newUser;
    }
    try {
        return JSON.parse(data);
    } catch {
        const newUser = {
            username: 'Гость',
            isGuest: true,
            balance: 5,
            inventory: [],
            lastBonusDate: null,
            withdrawHistory: [],
            registeredUsers: []
        };
        localStorage.setItem('techno_user', JSON.stringify(newUser));
        return newUser;
    }
}

function saveUser(user) {
    localStorage.setItem('techno_user', JSON.stringify(user));
}

// ==============================================
// ЕЖЕДНЕВНЫЙ БОНУС
// ==============================================
function checkDailyBonus() {
    const user = getUser();
    const today = new Date().toDateString();
    if (user.lastBonusDate !== today) {
        user.balance += 5;
        user.lastBonusDate = today;
        saveUser(user);
        updateBalanceUI();
    }
}

// ==============================================
// РЕГИСТРАЦИЯ И ВХОД
// ==============================================
function register(username, password) {
    const user = getUser();
    if (!user.registeredUsers) user.registeredUsers = [];
    if (user.registeredUsers.find(u => u.username === username)) {
        return { success: false, message: 'Пользователь с таким логином уже существует' };
    }
    // Переносим гостевой прогресс в аккаунт
    const newUser = {
        username: username,
        password: password, // в реальности хешировать!
        balance: user.balance,
        inventory: user.inventory,
        lastBonusDate: user.lastBonusDate,
        withdrawHistory: user.withdrawHistory || []
    };
    user.registeredUsers.push(newUser);
    // Обновляем текущего пользователя
    user.username = username;
    user.isGuest = false;
    user.password = password;
    saveUser(user);
    return { success: true };
}

function login(username, password) {
    const user = getUser();
    if (!user.registeredUsers) user.registeredUsers = [];
    const found = user.registeredUsers.find(u => u.username === username && u.password === password);
    if (!found) {
        return { success: false, message: 'Неверный логин или пароль' };
    }
    // Загружаем данные найденного пользователя в текущую сессию
    user.username = found.username;
    user.isGuest = false;
    user.balance = found.balance;
    user.inventory = found.inventory;
    user.lastBonusDate = found.lastBonusDate;
    user.withdrawHistory = found.withdrawHistory || [];
    saveUser(user);
    return { success: true };
}

function logout() {
    const user = getUser();
    user.isGuest = true;
    user.username = 'Гость';
    user.balance = 5;
    user.inventory = [];
    user.lastBonusDate = null;
    user.withdrawHistory = [];
    saveUser(user);
    updateBalanceUI();
    renderProfile();
    showPage('shop');
}

// ==============================================
// ВЫВОД СРЕДСТВ (имитация)
// ==============================================
function withdrawRequest(amount) {
    const user = getUser();
    if (amount < 10) {
        return { success: false, message: 'Минимальная сумма вывода: 10 монет' };
    }
    if (amount > user.balance) {
        return { success: false, message: 'Недостаточно средств' };
    }
    // Списываем деньги и добавляем заявку
    user.balance -= amount;
    if (!user.withdrawHistory) user.withdrawHistory = [];
    user.withdrawHistory.push({
        amount: amount,
        date: new Date().toLocaleString(),
        status: 'pending' // pending, success
    });
    saveUser(user);
    updateBalanceUI();
    renderProfile();
    return { success: true, message: 'Заявка на вывод отправлена!' };
}

// ==============================================
// UI
// ==============================================
function updateBalanceUI() {
    const user = getUser();
    const span = document.getElementById('balanceDisplay');
    if (span) span.innerText = `🪙 ${user.balance} монет`;
    const nameSpan = document.getElementById('userName');
    if (nameSpan) nameSpan.innerText = user.username || 'Гость';
}

function renderShop() {
    const grid = document.getElementById('caseGrid');
    if (!grid) return;
    grid.innerHTML = '';
    boxes.forEach(box => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon">📦</div>
            <h3>${box.name}</h3>
            <p class="price">🪙 ${box.price} монет</p>
            <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                <button class="btn btn-sm btn-outline" onclick="previewBox(${box.id})">👁 Состав</button>
                <button class="btn btn-sm" onclick="buyBox(${box.id})">Купить</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderInventory() {
    const container = document.getElementById('myItems');
    if (!container) return;
    const user = getUser();
    const items = user.inventory;

    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">У вас пока нет товаров. Купите набор в магазине!</p>';
        return;
    }

    items.forEach((item, index) => {
        if (!item) return;
        const type = item.type || 'unknown';
        let name = 'Неизвестный товар';
        let sell_price = 0;
        let rarity = '';

        if (type === 'box') {
            const box = boxes.find(b => b.id === item.box_id);
            name = box ? box.name : 'Набор';
            rarity = 'Не открыт';
            sell_price = 0;
        } else if (type === 'item') {
            name = item.name || 'Товар';
            sell_price = item.sell_price || 0;
            rarity = item.rarity || 'Обычный';
        } else {
            name = 'Товар';
        }

        const div = document.createElement('div');
        div.className = 'card';
        if (type === 'box') {
            div.style.border = '2px solid #007aff';
        }
        div.innerHTML = `
            <div class="card-icon">${type === 'box' ? '📦' : '🎁'}</div>
            <h3>${name}</h3>
            <p class="rarity">${rarity}</p>
            ${sell_price > 0 ? `<p class="price">💰 ${sell_price} монет</p>` : ''}
            ${type === 'box' 
                ? `<button class="btn btn-success" onclick="openBox(${index})">Открыть</button>`
                : `<button class="btn btn-warning" onclick="sellItem(${index})">Продать</button>`
            }
        `;
        container.appendChild(div);
    });
}

function renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;
    const user = getUser();

    let html = '';

    // Информация о пользователе
    html += `<div class="profile-section">`;
    html += `<h3>👤 Информация</h3>`;
    html += `<div class="profile-row"><span class="profile-label">Имя:</span><span class="profile-value">${user.username || 'Гость'}</span></div>`;
    html += `<div class="profile-row"><span class="profile-label">Статус:</span><span class="profile-value">${user.isGuest ? 'Гость' : 'Зарегистрирован'}</span></div>`;
    html += `<div class="profile-row"><span class="profile-label">Баланс:</span><span class="profile-value">🪙 ${user.balance} монет</span></div>`;
    html += `</div>`;

    // Вывод средств
    html += `<div class="profile-section">`;
    html += `<h3>💰 Вывод средств</h3>`;
    html += `<button class="btn btn-success withdraw-btn" onclick="openWithdrawModal()">Вывести монеты</button>`;
    html += `</div>`;

    // История выводов
    html += `<div class="profile-section">`;
    html += `<h3>📋 История выводов</h3>`;
    if (!user.withdrawHistory || user.withdrawHistory.length === 0) {
        html += `<p style="color:#888;">История пуста</p>`;
    } else {
        user.withdrawHistory.forEach(item => {
            const statusText = item.status === 'pending' ? '⏳ Ожидает' : '✅ Выполнен';
            const statusClass = item.status === 'pending' ? 'pending' : 'success';
            html += `
                <div class="history-item">
                    <span>${item.date}</span>
                    <span>${item.amount} монет</span>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
            `;
        });
    }
    html += `</div>`;

    // Регистрация/Вход (если гость)
    if (user.isGuest) {
        html += `<div class="profile-section">`;
        html += `<h3>📝 Регистрация / Вход</h3>`;
        html += `
            <form id="authForm" onsubmit="handleAuth(event)">
                <input type="text" id="authUsername" placeholder="Логин" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid #ccc;">
                <input type="password" id="authPassword" placeholder="Пароль" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid #ccc;">
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button type="submit" name="action" value="login" class="btn" style="flex:1;">Войти</button>
                    <button type="submit" name="action" value="register" class="btn btn-success" style="flex:1;">Зарегистрироваться</button>
                </div>
                <div id="authMessage" style="margin-top:10px; color:#dc3545;"></div>
            </form>
        `;
        html += `</div>`;
    } else {
        html += `<div class="profile-section">`;
        html += `<button class="btn btn-danger" onclick="logout()">Выйти</button>`;
        html += `</div>`;
    }

    container.innerHTML = html;
}

// ==============================================
// ОБРАБОТЧИК АВТОРИЗАЦИИ
// ==============================================
function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const action = e.submitter.value; // login или register

    let result;
    if (action === 'register') {
        result = register(username, password);
    } else if (action === 'login') {
        result = login(username, password);
    }

    const msg = document.getElementById('authMessage');
    if (result.success) {
        msg.style.color = '#34c759';
        msg.innerText = '✅ Успешно!';
        setTimeout(() => {
            updateBalanceUI();
            renderProfile();
        }, 500);
    } else {
        msg.style.color = '#dc3545';
        msg.innerText = result.message;
    }
}

// ==============================================
// МОДАЛКА ВЫВОДА
// ==============================================
function openWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'flex';
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawMessage').innerText = '';
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
}

function withdraw() {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const msg = document.getElementById('withdrawMessage');
    if (!amount || isNaN(amount)) {
        msg.innerText = 'Введите число';
        return;
    }
    const result = withdrawRequest(amount);
    if (result.success) {
        msg.style.color = '#34c759';
        msg.innerText = result.message;
        setTimeout(() => closeWithdrawModal(), 1500);
    } else {
        msg.style.color = '#dc3545';
        msg.innerText = result.message;
    }
}

// ==============================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (покупка, открытие, продажа, предпросмотр)
// ==============================================
function previewBox(boxId) {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    document.getElementById('previewTitle').innerText = `📋 ${box.name}`;
    const content = document.getElementById('previewContent');
    content.innerHTML = '';
    const grouped = {};
    box.items.forEach(item => {
        if (!grouped[item.rarity]) grouped[item.rarity] = [];
        grouped[item.rarity].push(item);
    });
    let html = '';
    for (const [rarity, items] of Object.entries(grouped)) {
        html += `<div style="margin: 8px 0 4px; font-weight:600; color:#007aff;">⭐ ${rarity}</div>`;
        items.forEach(item => {
            html += `
                <div class="preview-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-detail">
                        <span class="item-price">💰 ${item.sell_price} монет</span>
                    </span>
                </div>
            `;
        });
    }
    content.innerHTML = html;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function buyBox(boxId) {
    const user = getUser();
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    if (user.balance < box.price) {
        alert('❌ Не хватает монет!');
        return;
    }
    user.balance -= box.price;
    user.inventory.push({
        type: 'box',
        box_id: box.id,
        opened: false
    });
    saveUser(user);
    updateBalanceUI();
    document.getElementById('buyModal').style.display = 'flex';
}

function openBox(inventoryIndex) {
    const user = getUser();
    if (inventoryIndex < 0 || inventoryIndex >= user.inventory.length) return;
    const item = user.inventory[inventoryIndex];
    if (!item || item.type !== 'box') return;
    const box = boxes.find(b => b.id === item.box_id);
    if (!box) return;
    const randomIndex = Math.floor(Math.random() * box.items.length);
    const chosen = box.items[randomIndex];
    user.inventory[inventoryIndex] = {
        type: 'item',
        name: chosen.name,
        sell_price: chosen.sell_price,
        rarity: chosen.rarity
    };
    saveUser(user);
    document.getElementById('modalTitle').innerText = chosen.name;
    document.getElementById('modalPrice').innerHTML = `💰 Оценочная цена: ${chosen.sell_price} монет`;
    document.getElementById('modalRarity').innerHTML = `⭐ Категория: ${chosen.rarity}`;
    document.getElementById('openModal').style.display = 'flex';
    if (document.getElementById('page-inventory').style.display === 'block') {
        renderInventory();
    }
    updateBalanceUI();
}

function sellItem(inventoryIndex) {
    const user = getUser();
    if (inventoryIndex < 0 || inventoryIndex >= user.inventory.length) return;
    const item = user.inventory[inventoryIndex];
    if (!item || item.type !== 'item') {
        alert('Этот товар нельзя продать');
        return;
    }
    user.balance += item.sell_price;
    user.inventory.splice(inventoryIndex, 1);
    saveUser(user);
    updateBalanceUI();
    renderInventory();
    alert('✅ Товар продан!');
}

// ==============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==============================================
function showPage(page) {
    const shop = document.getElementById('page-shop');
    const inv = document.getElementById('page-inventory');
    const prof = document.getElementById('page-profile');
    shop.style.display = 'none';
    inv.style.display = 'none';
    prof.style.display = 'none';
    if (page === 'shop') shop.style.display = 'block';
    else if (page === 'inventory') {
        inv.style.display = 'block';
        renderInventory();
    } else if (page === 'profile') {
        prof.style.display = 'block';
        renderProfile();
    }
}

// ==============================================
// МОДАЛКИ
// ==============================================
function closeModal() {
    document.getElementById('openModal').style.display = 'none';
    if (document.getElementById('page-inventory').style.display === 'block') {
        renderInventory();
    }
}
function closeBuyModal() {
    document.getElementById('buyModal').style.display = 'none';
}

window.onclick = function(event) {
    const openModal = document.getElementById('openModal');
    const buyModal = document.getElementById('buyModal');
    const previewModal = document.getElementById('previewModal');
    const withdrawModal = document.getElementById('withdrawModal');
    if (event.target === openModal) closeModal();
    if (event.target === buyModal) closeBuyModal();
    if (event.target === previewModal) closePreviewModal();
    if (event.target === withdrawModal) closeWithdrawModal();
};

// ==============================================
// СТАРТ
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    checkDailyBonus();
    renderShop();
    updateBalanceUI();
    // Тестовый набор для демонстрации
    const user = getUser();
    if (user.inventory.length === 0) {
        user.inventory.push({ type: 'box', box_id: 1, opened: false });
        saveUser(user);
    }
});