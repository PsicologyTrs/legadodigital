// Sistema de Pago - payment.js

// Elementos del DOM
const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');
const payButton = document.getElementById('payButton');
const methodCards = document.querySelectorAll('.method-card');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// Variables de estado
let currentPaymentMethod = 'pse';
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// Inicializar la aplicación
function initPayment() {
    if (!currentUser || currentUser.type !== 'creator') {
        // Si no es un creador, redirigir al login
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser.hasPaid) {
        // Si ya pagó, redirigir al dashboard
        window.location.href = 'dashboard-creator.html';
        return;
    }
    
    updateUserInfo();
    setupEventListeners();
    prefillUserData();
}

// Actualizar información del usuario en la interfaz
function updateUserInfo() {
    if (currentUser) {
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.name;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

// Rellenar datos del usuario en el formulario
function prefillUserData() {
    if (currentUser) {
        document.getElementById('fullName').value = currentUser.name;
        document.getElementById('email').value = currentUser.email;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Selección de método de pago
    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            methodCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentPaymentMethod = card.dataset.method;
            updatePaymentForm();
        });
    });

    // Envío del formulario
    paymentForm.addEventListener('submit', handlePayment);
}

// Actualizar formulario según método de pago
function updatePaymentForm() {
    // Por ahora solo tenemos PSE, pero puedes expandir esto
    console.log('Método de pago seleccionado:', currentPaymentMethod);
}

// Validar formulario
function validateForm() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const documentType = document.getElementById('documentType').value;
    const document = document.getElementById('document').value.trim();
    const bank = document.getElementById('bank').value;
    const accountType = document.getElementById('accountType').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!fullName || !email || !documentType || !document || !bank || !accountType) {
        showMessage('Por favor completa todos los campos obligatorios', 'error');
        return false;
    }

    if (!acceptTerms) {
        showMessage('Debes aceptar los términos y condiciones', 'error');
        return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor ingresa un correo electrónico válido', 'error');
        return false;
    }

    return true;
}

// Manejar pago
async function handlePayment(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Mostrar estado de carga
    payButton.classList.add('loading');
    payButton.disabled = true;

    try {
        // Simular procesamiento de pago con PSE
        await processPSEPayment();

        // Actualizar usuario como creador verificado
        updateUserAsVerified();

        // Mostrar mensaje de éxito
        showMessage('¡Pago exitoso! Ahora eres un creador verificado. Redirigiendo al panel...', 'success');

        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'dashboard-creator.html';
        }, 2000);

    } catch (error) {
        showMessage('Error en el pago: ' + error.message, 'error');
        payButton.classList.remove('loading');
        payButton.disabled = false;
    }
}

// Simular procesamiento de pago PSE
function processPSEPayment() {
    return new Promise((resolve, reject) => {
        // Simular delay de red y procesamiento bancario
        setTimeout(() => {
            // Simular éxito (90% de éxito)
            const success = Math.random() > 0.1;
            
            if (success) {
                resolve({
                    transactionId: 'TXN_' + Date.now(),
                    amount: 15000,
                    currency: 'COP',
                    status: 'approved',
                    method: 'pse'
                });
            } else {
                reject(new Error('La transacción fue rechazada por el banco. Por favor intenta con otro método de pago.'));
            }
        }, 3000);
    });
}

// Actualizar usuario como verificado
function updateUserAsVerified() {
    if (currentUser) {
        currentUser.hasPaid = true;
        currentUser.creatorSince = new Date().toISOString();
        currentUser.paymentMethod = 'pse';
        
        // Actualizar en localStorage
        localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

        // Actualizar en la lista de usuarios
        let users = JSON.parse(localStorage.getItem('legado_users')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('legado_users', JSON.stringify(users));
        }
    }
}

// Mostrar mensajes
function showMessage(text, type) {
    paymentMessage.textContent = text;
    paymentMessage.className = `message ${type}`;
    paymentMessage.style.display = 'block';

    // Scroll al mensaje
    paymentMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Ocultar mensaje después de 5 segundos (excepto éxito)
    if (type !== 'success') {
        setTimeout(() => {
            paymentMessage.style.display = 'none';
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initPayment);