// Sistema de Autenticación - auth.js
'use strict';

// ====================== ESTADO Y ELEMENTOS ======================

// "Base de datos" simulada en localStorage
let users = JSON.parse(localStorage.getItem('legado_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginCard = document.querySelector('.login-card'); // primer card (login)
const registerCard = document.getElementById('registerCard');

// ====================== HELPERS ======================

// Normalizar el tipo de usuario para compatibilidad con index.html
function getUserType(user) {
    if (!user) return null;
    if (user.type === 'creator' || user.type === 'consumer') return user.type;
    // Fallback para usuarios creados desde otros lados
    if (user.isCreator) return 'creator';
    return 'consumer';
}

// Mostrar mensajes bonitos
function showMessage(element, text, type = 'info') {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';

    // Ocultar después de 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Redirigir según tipo de usuario y estado de pago
function redirectAfterLogin() {
    if (!currentUser) return;

    const role = getUserType(currentUser);

    if (role === 'creator' && !currentUser.hasPaid) {
        // Creador que no ha pagado -> ir a página de pago
        window.location.href = 'payment.html';
    } else if (role === 'creator' && currentUser.hasPaid) {
        // Creador verificado -> dashboard
        window.location.href = 'dashboard-creator.html';
    } else {
        // Consumidor -> página principal
        window.location.href = 'index.html';
    }
}

// ====================== INICIALIZACIÓN ======================

function initAuth() {
    setupEventListeners();
    checkExistingSession();

    // Si viene desde index con #register, mostrar directamente el formulario de registro
    if (window.location.hash === '#register') {
        showRegisterForm();
    } else if (window.location.hash === '#login') {
        showLoginForm();
    }
}

// Configurar event listeners
function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// Verificar si hay sesión activa
function checkExistingSession() {
    if (currentUser) {
        redirectAfterLogin();
    }
}

// ====================== UI: MOSTRAR FORMULARIOS ======================

function showRegisterForm() {
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = 'block';
}

function showLoginForm() {
    if (registerCard) registerCard.style.display = 'none';
    if (loginCard) loginCard.style.display = 'block';
}

// ====================== HANDLERS: LOGIN / REGISTRO ======================

function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const userType = document.querySelector('input[name="userType"]:checked')?.value;

    // Validar campos
    if (!email || !password) {
        showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
        return;
    }

    // Buscar usuario
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
        showMessage(loginMessage, 'Correo electrónico o contraseña incorrectos', 'error');
        return;
    }

    const storedType = getUserType(user);

    // Verificar tipo de usuario (consumer / creator)
    if (storedType !== userType) {
        showMessage(
            loginMessage,
            `Este correo está registrado como ${storedType === 'creator' ? 'creador' : 'consumidor'}`,
            'error'
        );
        return;
    }

    // Iniciar sesión
    currentUser = user;
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

    showMessage(loginMessage, '¡Inicio de sesión exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
        redirectAfterLogin();
    }, 1000);
}

function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const userType = document.querySelector('input[name="registerUserType"]:checked')?.value;

    // Validar campos
    if (!name || !email || !password) {
        showMessage(registerMessage, 'Por favor completa todos los campos', 'error');
        return;
    }

    // Verificar si el usuario ya existe
    if (users.find((u) => u.email === email)) {
        showMessage(registerMessage, 'Este correo electrónico ya está registrado', 'error');
        return;
    }

    const isCreator = userType === 'creator';

    // Crear nuevo usuario
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        type: userType,       // 'creator' o 'consumer'
        isCreator: isCreator, // booleano
        hasPaid: !isCreator,  // los consumidores no necesitan pagar
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('legado_users', JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

    showMessage(registerMessage, '¡Registro exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
        redirectAfterLogin();
    }, 1000);
}

// ====================== ARRANQUE ======================

document.addEventListener('DOMContentLoaded', initAuth);
