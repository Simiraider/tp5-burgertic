const API_BASE_URL = 'http://localhost:9000';

let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSection = 'home';
let platos = [];

// DOM Elements - Navigation and Authentication
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main > section');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const authForms = document.getElementById('auth-forms');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const adminLink = document.getElementById('admin-link');
const adminSection = document.getElementById('admin');
const pedidosSection = document.getElementById('pedidos');
const detalleSection = document.getElementById('detalle-plato');

// Cart and Order Elements
const cartModal = document.getElementById('cart-modal');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const cartLink = document.getElementById('cart-link');
const closeCartBtn = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');
const orderModal = document.getElementById('order-modal');
const closeModal = document.querySelector('.close-modal');
const orderForm = document.getElementById('order-form');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    setupEventListeners();
    loadPlatos();
    checkAuthStatus();
    setupAdminPanel();
    updateCartUI();
    
    // Initialize cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            localStorage.removeItem('cart');
        }
    }
});

function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Order button
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', () => showSection('menu'));
    }

    // Auth tabs
    if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
    if (registerTab) registerTab.addEventListener('click', () => switchAuthTab('register'));

    // Auth forms
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    // Logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterPlatos(btn.dataset.type));
    });

    // Cart and order related
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartSidebar.classList.remove('active'));
    if (cartLink) cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('active');
    });
    if (closeModal) closeModal.addEventListener('click', () => orderModal.classList.remove('active'));
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.classList.remove('active');
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, 'error');
            return;
        }

        localStorage.setItem('token', data.token);
        currentUser = data.usuario;
        updateUIForUser();
        showMessage('Inicio de sesión exitoso', 'success');
        showSection('menu');
    } catch (error) {
        showMessage('Error al iniciar sesión', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const usuario = {
        nombre: document.getElementById('register-nombre').value,
        apellido: document.getElementById('register-apellido').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value
    };

    try {
        console.log('Enviando datos de registro:', usuario);
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, 'error');
            return;
        }

        showMessage('Registro exitoso. Por favor, inicie sesión', 'success');
        switchAuthTab('login');
    } catch (error) {
        showMessage('Error al registrar usuario', 'error');
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        currentUser = null;
        updateUIForUser();
        return;
    }

    fetch(`${API_BASE_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Token inválido');
        return response.json();
    })
    .then(data => {
        currentUser = data.usuario;
        updateUIForUser();
    })
    .catch(() => {
        localStorage.removeItem('token');
        currentUser = null;
        updateUIForUser();
    });
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    currentUser = null;
    cart = [];
    updateUIForUser();
    showMessage('Sesión cerrada exitosamente', 'success');
    showSection('home');
}

function updateUIForUser() {
    const authNavItem = document.getElementById('auth-nav-item');
    const logoutNavItem = document.getElementById('logout-nav-item');
    
    if (currentUser) {
        authNavItem.innerHTML = `<a href="#pedidos">Mis Pedidos</a>`;
        logoutNavItem.style.display = 'block';
        if (currentUser.admin) {
            adminLink.style.display = 'block';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        authNavItem.innerHTML = `<a href="#login">Iniciar Sesión</a>`;
        logoutNavItem.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

function showSection(sectionId) {
    sections.forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    currentSection = sectionId;

    if (sectionId === 'admin') {
        setupAdminPanel();
        loadAdminData();
    } else if (sectionId === 'pedidos') {
        loadPedidos();
    }
}

async function loadPlatos() {
    try {
        const response = await fetch(`${API_BASE_URL}/platos`);
        platos = await response.json();
        displayPlatos(platos);
    } catch (error) {
        showMessage('Error al cargar los platos', 'error');
    }
}

function displayPlatos(platosArray) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    platosArray.forEach(plato => {
        const platoCard = document.createElement('div');
        platoCard.className = 'plato-card';
        platoCard.innerHTML = `
            <img src="https://via.placeholder.com/300x200" alt="${plato.nombre}">
            <div class="plato-info">
                <h3>${plato.nombre}</h3>
                <p>${plato.descripcion}</p>
                <p class="precio">$${plato.precio}</p>
                <button onclick="addToCart(${plato.id})">Agregar al carrito</button>
                <button onclick="showPlatoDetail(${plato.id})">Ver detalle</button>
                ${currentUser?.admin ? `
                    <button onclick="editPlato(${plato.id})" class="admin-btn">Editar</button>
                    <button onclick="deletePlato(${plato.id})" class="admin-btn delete">Eliminar</button>
                ` : ''}
            </div>
        `;
        container.appendChild(platoCard);
    });
}

async function filterPlatos(tipo) {
    try {
        const url = tipo === 'all' ? 
            `${API_BASE_URL}/platos` : 
            `${API_BASE_URL}/platos/tipo/${tipo}`;
        
        const response = await fetch(url);
        const filteredPlatos = await response.json();
        displayPlatos(filteredPlatos);

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === tipo);
        });
    } catch (error) {
        showMessage('Error al filtrar los platos', 'error');
    }
}

async function showPlatoDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/platos/${id}`);
        const plato = await response.json();

        const detalleContainer = document.getElementById('plato-detalle');
        detalleContainer.innerHTML = `
            <div class="plato-detalle">
                <img src="https://via.placeholder.com/400x300" alt="${plato.nombre}">
                <div class="plato-detalle-info">
                    <h3>${plato.nombre}</h3>
                    <p class="precio">$${plato.precio}</p>
                    <p>${plato.descripcion}</p>
                    <button class="add-to-cart-btn" onclick="addToCart(${plato.id})">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;

        showSection('detalle-plato');
    } catch (error) {
        showMessage('Error al cargar el detalle del plato', 'error');
    }
}

function setupAdminPanel() {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) return;

    adminContent.innerHTML = `
        <div class="admin-section-content">
            <div id="platos-admin" class="admin-subsection">
                <h3>Gestión de Platos</h3>
                <button onclick="showCreatePlatoForm()">Crear Nuevo Plato</button>
                <div id="platos-list"></div>
            </div>
            <div id="pedidos-admin" class="admin-subsection" style="display: none;">
                <h3>Gestión de Pedidos</h3>
                <div id="pedidos-list"></div>
            </div>
        </div>
    `;

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAdminTab(btn.dataset.section));
    });
}

function switchAdminTab(section) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    
    const platosAdmin = document.getElementById('platos-admin');
    const pedidosAdmin = document.getElementById('pedidos-admin');
    
    if (section === 'platos') {
        if (platosAdmin) platosAdmin.style.display = 'block';
        if (pedidosAdmin) pedidosAdmin.style.display = 'none';
        loadPlatosAdmin();
    } else if (section === 'pedidos') {
        if (platosAdmin) platosAdmin.style.display = 'none';
        if (pedidosAdmin) pedidosAdmin.style.display = 'block';
        loadPedidosAdmin();
    }
}

async function loadAdminData() {
    if (!currentUser?.admin) return;

    const activeTab = document.querySelector('.admin-tab-btn.active')?.dataset.section || 'platos';
    if (activeTab === 'platos') {
        await loadPlatosAdmin();
    } else {
        await loadPedidosAdmin();
    }
}

async function loadPlatosAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/platos`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const platos = await response.json();
        
        const platosList = document.getElementById('platos-list');
        if (!platosList) {
            console.error('Elemento platos-list no encontrado');
            showMessage('Error: elemento no encontrado. Recargando panel...', 'error');
            setupAdminPanel();
            setTimeout(() => loadPlatosAdmin(), 100);
            return;
        }
        
        if (!Array.isArray(platos) || platos.length === 0) {
            platosList.innerHTML = '<p>No hay platos registrados. Crea uno nuevo para comenzar.</p>';
            return;
        }
        
        platosList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${platos.map(plato => `
                        <tr>
                            <td>${plato.nombre}</td>
                            <td>${plato.tipo}</td>
                            <td>$${plato.precio}</td>
                            <td>
                                <button onclick="editPlato(${plato.id})" class="action-btn edit-btn">Editar</button>
                                <button onclick="deletePlato(${plato.id})" class="action-btn">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error al cargar platos:', error);
        showMessage('Error al cargar los platos: ' + error.message, 'error');
    }
}

async function loadPedidosAdmin() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Debe iniciar sesión para ver los pedidos', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/pedidos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const pedidos = await response.json();
        const pedidosList = document.getElementById('pedidos-list');
        
        if (!pedidosList) {
            console.error('Elemento pedidos-list no encontrado');
            return;
        }

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            pedidosList.innerHTML = '<p>No hay pedidos registrados.</p>';
            return;
        }

        pedidosList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Platos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(pedido => `
                        <tr>
                            <td>${pedido.id}</td>
                            <td>${pedido.id_usuario}</td>
                            <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
                            <td>${pedido.estado}</td>
                            <td>${pedido.platos ? pedido.platos.length : 0} plato(s)</td>
                            <td>
                                ${pedido.estado === 'pendiente' ? `
                                    <button onclick="cambiarEstadoPedido(${pedido.id}, 'aceptar')" class="action-btn">Aceptar</button>
                                ` : ''}
                                ${pedido.estado === 'aceptado' ? `
                                    <button onclick="cambiarEstadoPedido(${pedido.id}, 'comenzar')" class="action-btn">Comenzar</button>
                                ` : ''}
                                ${pedido.estado === 'en camino' ? `
                                    <button onclick="cambiarEstadoPedido(${pedido.id}, 'entregar')" class="action-btn">Entregar</button>
                                ` : ''}
                                <button onclick="deletePedido(${pedido.id})" class="action-btn">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        showMessage('Error al cargar los pedidos: ' + error.message, 'error');
    }
}

function showCreatePlatoForm() {
    const form = document.createElement('div');
    form.className = 'modal';
    form.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Crear Nuevo Plato</h3>
            <form id="create-plato-form" class="admin-form">
                <input type="text" name="nombre" placeholder="Nombre" required>
                <select name="tipo" required>
                    <option value="principal">Principal</option>
                    <option value="combo">Combo</option>
                    <option value="postre">Postre</option>
                </select>
                <input type="number" name="precio" placeholder="Precio" required>
                <textarea name="descripcion" placeholder="Descripción" required></textarea>
                <button type="submit">Crear Plato</button>
            </form>
        </div>
    `;

    document.body.appendChild(form);
    form.style.display = 'block';

    form.querySelector('.close').onclick = () => form.remove();
    form.querySelector('form').onsubmit = handleCreatePlato;
}

async function handleCreatePlato(e) {
    e.preventDefault();
    
    if (!currentUser?.admin) {
        showMessage('Solo los administradores pueden crear platos', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const plato = {
        nombre: formData.get('nombre'),
        tipo: formData.get('tipo'),
        precio: parseInt(formData.get('precio')),
        descripcion: formData.get('descripcion')
    };

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Debe iniciar sesión para crear platos', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/platos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(plato)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al crear el plato', 'error');
            return;
        }

        showMessage('Plato creado exitosamente', 'success');
        e.target.closest('.modal').remove();
        loadPlatosAdmin();
        loadPlatos();
    } catch (error) {
        console.error('Error al crear plato:', error);
        showMessage('Error al crear el plato: ' + error.message, 'error');
    }
}

async function editPlato(id) {
    const plato = platos.find(p => p.id === id);
    if (!plato) return;

    const form = document.createElement('div');
    form.className = 'modal';
    form.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Editar Plato</h3>
            <form id="edit-plato-form" class="admin-form">
                <input type="text" name="nombre" value="${plato.nombre}" required>
                <select name="tipo" required>
                    <option value="principal" ${plato.tipo === 'principal' ? 'selected' : ''}>Principal</option>
                    <option value="combo" ${plato.tipo === 'combo' ? 'selected' : ''}>Combo</option>
                    <option value="postre" ${plato.tipo === 'postre' ? 'selected' : ''}>Postre</option>
                </select>
                <input type="number" name="precio" value="${plato.precio}" required>
                <textarea name="descripcion" required>${plato.descripcion}</textarea>
                <button type="submit">Guardar Cambios</button>
            </form>
        </div>
    `;

    document.body.appendChild(form);
    form.style.display = 'block';

    form.querySelector('.close').onclick = () => form.remove();
    form.querySelector('form').onsubmit = (e) => handleEditPlato(e, id);
}

async function handleEditPlato(e, id) {
    e.preventDefault();
    
    if (!currentUser?.admin) {
        showMessage('Solo los administradores pueden editar platos', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const plato = {
        nombre: formData.get('nombre'),
        tipo: formData.get('tipo'),
        precio: parseInt(formData.get('precio')),
        descripcion: formData.get('descripcion')
    };

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Debe iniciar sesión para editar platos', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/platos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(plato)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al actualizar el plato', 'error');
            return;
        }

        showMessage('Plato actualizado exitosamente', 'success');
        e.target.closest('.modal').remove();
        loadPlatosAdmin();
        loadPlatos();
    } catch (error) {
        console.error('Error al actualizar plato:', error);
        showMessage('Error al actualizar el plato: ' + error.message, 'error');
    }
}

async function deletePlato(id) {
    if (!currentUser?.admin) {
        showMessage('Solo los administradores pueden eliminar platos', 'error');
        return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este plato?')) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Debe iniciar sesión para eliminar platos', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/platos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al eliminar el plato', 'error');
            return;
        }

        showMessage('Plato eliminado exitosamente', 'success');
        loadPlatosAdmin();
        loadPlatos();
    } catch (error) {
        console.error('Error al eliminar plato:', error);
        showMessage('Error al eliminar el plato: ' + error.message, 'error');
    }
}

async function loadPedidos() {
    if (!currentUser) {
        showMessage('Debe iniciar sesión para ver los pedidos', 'error');
        showSection('login');
        return;
    }

    try {
        const url = currentUser.admin ? 
            `${API_BASE_URL}/pedidos` : 
            `${API_BASE_URL}/pedidos/usuario`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const pedidos = await response.json();
        displayPedidos(pedidos);
    } catch (error) {
        showMessage('Error al cargar los pedidos', 'error');
    }
}

function displayPedidos(pedidos) {
    const container = document.getElementById('pedidos-container');
    container.innerHTML = pedidos.length === 0 ? 
        '<p>No hay pedidos para mostrar</p>' : 
        pedidos.map(pedido => `
            <div class="pedido-card">
                <h4>Pedido #${pedido.id}</h4>
                <p>Fecha: ${new Date(pedido.fecha).toLocaleDateString()}</p>
                <p>Estado: <span class="estado ${pedido.estado}">${pedido.estado}</span></p>
                <div class="platos-list">
                    ${pedido.platos.map(item => `
                        <p>${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}</p>
                    `).join('')}
                </div>
                ${currentUser.admin ? `
                    <div class="admin-actions">
                        ${pedido.estado === 'pendiente' ? `
                            <button onclick="cambiarEstadoPedido(${pedido.id}, 'aceptar')">Aceptar</button>
                        ` : ''}
                        ${pedido.estado === 'aceptado' ? `
                            <button onclick="cambiarEstadoPedido(${pedido.id}, 'comenzar')">Comenzar</button>
                        ` : ''}
                        ${pedido.estado === 'en camino' ? `
                            <button onclick="cambiarEstadoPedido(${pedido.id}, 'entregar')">Entregar</button>
                        ` : ''}
                        <button onclick="deletePedido(${pedido.id})" class="delete-btn">Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
}

async function cambiarEstadoPedido(id, accion) {
    try {
        const response = await fetch(`${API_BASE_URL}/pedidos/${id}/${accion}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, 'error');
            return;
        }

        showMessage(`Estado del pedido actualizado a ${accion}`, 'success');
        loadPedidos();
    } catch (error) {
        showMessage('Error al actualizar el estado del pedido', 'error');
    }
}

async function deletePedido(id) {
    if (!confirm('¿Está seguro de que desea eliminar este pedido?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, 'error');
            return;
        }

        showMessage('Pedido eliminado exitosamente', 'success');
        loadPedidos();
    } catch (error) {
        showMessage('Error al eliminar el pedido', 'error');
    }
}

function addToCart(platoId) {
    const plato = platos.find(p => p.id === platoId);
    if (!plato) return;

    const existingItem = cart.find(item => item.id === platoId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: plato.id,
            nombre: plato.nombre,
            precio: plato.precio,
            imagen: plato.imagen || 'default-burger.jpg',
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showMessage(`${plato.nombre} agregado al carrito`, 'success');
    
    // Show cart sidebar when adding first item
    if (cart.length === 1) {
        cartSidebar.classList.add('active');
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update cart items
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        checkoutBtn.disabled = true;
    } else {
        cart.forEach(item => {
            const plato = platos.find(p => p.id === item.id);
            if (plato) {
                const itemTotal = plato.precio * item.quantity;
                total += itemTotal;

                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${plato.imagen || 'default-burger.jpg'}" alt="${plato.nombre}">
                    <div class="cart-item-info">
                        <h4>${plato.nombre}</h4>
                        <p>$${plato.precio} x ${item.quantity} = $${itemTotal}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateCartItemQuantity(${plato.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartItemQuantity(${plato.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${plato.id})">&times;</button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            }
        });
    }
    
    // Update total and count
    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    checkoutBtn.disabled = cart.length === 0;
}

function updateCartItemQuantity(platoId, change) {
    const item = cart.find(item => item.id === platoId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== platoId);
    }
    
    saveCart();
    updateCartUI();
}

async function handleCheckout() {
    if (!currentUser) {
        showMessage('Debe iniciar sesión para realizar un pedido', 'error');
        showSection('login');
        return;
    }

    // Show the order form modal
    orderModal.classList.add('active');
    cartSidebar.classList.remove('active');
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showMessage('El carrito está vacío', 'error');
        return;
    }
    
    const orderData = {
        nombre: document.getElementById('name').value,
        telefono: document.getElementById('phone').value,
        direccion: document.getElementById('address').value,
        notas: document.getElementById('notes').value,
        items: cart.map(item => ({
            platoId: item.id,
            cantidad: item.quantity,
            precio: item.precio
        })),
        total: cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al realizar el pedido');
        }
        
        // Clear cart and form
        cart = [];
        saveCart();
        updateCartUI();
        orderForm.reset();
        orderModal.classList.remove('active');
        
        showMessage('¡Pedido realizado con éxito!', 'success');
        showSection('home');
        
    } catch (error) {
        showMessage(error.message || 'Error al realizar el pedido', 'error');
    }
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.remove(), 3000);
}

window.editPlato = editPlato;
window.deletePlato = deletePlato;
window.showCreatePlatoForm = showCreatePlatoForm;
window.addToCart = addToCart;
window.showPlatoDetail = showPlatoDetail;
window.updateCartItemQuantity = updateCartItemQuantity;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.deletePedido = deletePedido;
