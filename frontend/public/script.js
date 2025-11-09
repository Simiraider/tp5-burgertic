const API_BASE_URL = 'http://localhost:9000';

let currentUser = null;
let cart = [];
let currentSection = 'home';
let platos = [];

// Elementos del DOM
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
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadPlatos();
    checkAuthStatus();
    setupAdminPanel();
});

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Botón de orden
    document.getElementById('order-btn').addEventListener('click', () => {
        showSection('menu');
    });

    // Tabs de autenticación
    loginTab.addEventListener('click', () => switchAuthTab('login'));
    registerTab.addEventListener('click', () => switchAuthTab('register'));

    // Formularios de autenticación
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Filtros de menú
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterPlatos(btn.dataset.type));
    });

    // Modal del carrito
    document.querySelector('.close').addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    // Carrito de compras
    document.getElementById('cart-btn').addEventListener('click', () => {
        cartModal.style.display = 'block';
        updateCartUI();
    });

    // Checkout
    checkoutBtn.addEventListener('click', handleCheckout);
}

// Funciones de autenticación
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

function updateUIForUser() {
    if (currentUser) {
        document.querySelector('.nav-links li:nth-child(3)').innerHTML = 
            `<a href="#pedidos">Mis Pedidos</a>`;
        if (currentUser.admin) {
            adminLink.style.display = 'block';
        }
    } else {
        document.querySelector('.nav-links li:nth-child(3)').innerHTML = 
            `<a href="#login">Iniciar Sesión</a>`;
        adminLink.style.display = 'none';
    }
}

// Funciones de UI
function showSection(sectionId) {
    sections.forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    currentSection = sectionId;

    if (sectionId === 'admin') {
        loadAdminData();
    } else if (sectionId === 'pedidos') {
        loadPedidos();
    }
}

// Funciones de platos
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

// Funciones de administración
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

async function loadAdminData() {
    if (!currentUser?.admin) return;

    const activeTab = document.querySelector('.admin-tab-btn.active').dataset.section;
    if (activeTab === 'platos') {
        await loadPlatosAdmin();
    } else {
        await loadPedidosAdmin();
    }
}

async function loadPlatosAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/platos`);
        const platos = await response.json();
        
        const platosList = document.getElementById('platos-list');
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
        showMessage('Error al cargar los platos', 'error');
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

// Funciones de pedidos
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

// Funciones del carrito
function addToCart(platoId) {
    if (!currentUser) {
        showMessage('Debe iniciar sesión para agregar al carrito', 'error');
        showSection('login');
        return;
    }

    const plato = platos.find(p => p.id === platoId);
    if (!plato) return;

    const existingItem = cart.find(item => item.id === platoId);
    if (existingItem) {
        existingItem.cantidad++;
    } else {
        cart.push({ id: platoId, cantidad: 1 });
    }

    updateCartUI();
    showMessage('Producto agregado al carrito', 'success');
}

function updateCartUI() {
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const plato = platos.find(p => p.id === item.id);
        if (plato) {
            const itemTotal = plato.precio * item.cantidad;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${plato.nombre}</h4>
                    <p>$${plato.precio} x ${item.cantidad}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateCartItemQuantity(${plato.id}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="updateCartItemQuantity(${plato.id}, 1)">+</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        }
    });

    const totalDiv = document.createElement('div');
    totalDiv.className = 'cart-total';
    totalDiv.innerHTML = `<h3>Total: $${total}</h3>`;
    cartItems.appendChild(totalDiv);

    checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
}

function updateCartItemQuantity(platoId, change) {
    const item = cart.find(item => item.id === platoId);
    if (!item) return;

    item.cantidad += change;
    if (item.cantidad <= 0) {
        cart = cart.filter(item => item.id !== platoId);
    }

    updateCartUI();
}

async function handleCheckout() {
    if (!currentUser) {
        showMessage('Debe iniciar sesión para realizar un pedido', 'error');
        showSection('login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                platos: cart.map(item => ({
                    id: item.id,
                    cantidad: item.cantidad
                }))
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, 'error');
            return;
        }

        cart = [];
        updateCartUI();
        cartModal.style.display = 'none';
        showMessage('Pedido realizado con éxito', 'success');
        showSection('pedidos');
        loadPedidos();
    } catch (error) {
        showMessage('Error al procesar el pedido', 'error');
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
