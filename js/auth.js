// Sistema de Autenticación - auth.js

// Datos iniciales (simulando base de datos)
let users = JSON.parse(localStorage.getItem('legado_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginCard = document.querySelector('.login-card');
const registerCard = document.getElementById('registerCard');

// Inicializar la aplicación
function initAuth() {
    setupEventListeners();
    checkExistingSession();
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
        // Si ya está logueado, redirigir según su tipo
        redirectAfterLogin();
    }
}

// Mostrar formulario de registro
function showRegisterForm() {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
}

// Mostrar formulario de login
function showLoginForm() {
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
}

// Manejar inicio de sesión
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;

    // Validar campos
    if (!email || !password) {
        showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
        return;
    }

    // Buscar usuario
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Verificar tipo de usuario
        if (user.type !== userType) {
            showMessage(loginMessage, `Este correo está registrado como ${user.type === 'creator' ? 'creador' : 'consumidor'}`, 'error');
            return;
        }
        
        // Iniciar sesión
        currentUser = user;
        localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
        
        showMessage(loginMessage, '¡Inicio de sesión exitoso! Redirigiendo...', 'success');
        
        // Redirigir después de 1 segundo
        setTimeout(() => {
            redirectAfterLogin();
        }, 1000);
        
    } else {
        showMessage(loginMessage, 'Correo electrónico o contraseña incorrectos', 'error');
    }
}

// Manejar registro
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const userType = document.querySelector('input[name="registerUserType"]:checked').value;

    // Validar campos
    if (!name || !email || !password) {
        showMessage(registerMessage, 'Por favor completa todos los campos', 'error');
        return;
    }

    // Verificar si el usuario ya existe
    if (users.find(u => u.email === email)) {
        showMessage(registerMessage, 'Este correo electrónico ya está registrado', 'error');
        return;
    }

    // Crear nuevo usuario
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        type: userType,
        isCreator: userType === 'creator',
        hasPaid: userType === 'consumer', // Los consumidores no necesitan pagar
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('legado_users', JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

    showMessage(registerMessage, '¡Registro exitoso! Redirigiendo...', 'success');

    // Redirigir según el tipo de usuario
    setTimeout(() => {
        redirectAfterLogin();
    }, 1000);
}

// Redirigir después del login/registro
function redirectAfterLogin() {
    if (!currentUser) return;
    
    if (currentUser.type === 'creator' && !currentUser.hasPaid) {
        // Creador que no ha pagado -> ir a página de pago
        window.location.href = 'payment.html';
    } else if (currentUser.type === 'creator' && currentUser.hasPaid) {
        // Creador verificado -> ir al dashboard
        window.location.href = 'dashboard-creator.html';
    } else {
        // Consumidor -> ir al inicio
        window.location.href = 'index.html';
    }
}

// Mostrar mensajes
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);