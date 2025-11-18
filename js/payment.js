// Sistema de Pago - payment.js
'use strict';

// ====================== ELEMENTOS DEL DOM ======================

const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');
const payButton = document.getElementById('payButton');
const methodCards = document.querySelectorAll('.method-card');

const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// ====================== ESTADO ======================

let currentPaymentMethod = 'pse';
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// ====================== INICIALIZACIÓN ======================

function initPayment() {
    const isCreatorUser =
        currentUser &&
        (currentUser.type === 'creator' || currentUser.isCreator === true);

    if (!isCreatorUser) {
        // Si no es creador, redirigir al login
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

// ====================== UI USUARIO ======================

function updateUserInfo() {
    if (!currentUser) return;

    if (userInfo) userInfo.style.display = 'flex';
    if (userName) userName.textContent = currentUser.name;
    if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
}

function prefillUserData() {
    if (!currentUser) return;

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');

    if (fullNameInput) fullNameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || '';
}

// ====================== EVENT LISTENERS ======================

function setupEventListeners() {
    // Selección de método de pago
    methodCards.forEach((card) => {
        card.addEventListener('click', () => {
            methodCards.forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            currentPaymentMethod = card.dataset.method || 'pse';
            updatePaymentForm();
        });
    });

    // Envío del formulario
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
}

function updatePaymentForm() {
    // Por ahora solo hay PSE, pero aquí podrías cambiar el formulario
    console.log('Método de pago seleccionado:', currentPaymentMethod);
}

// ====================== VALIDACIÓN ======================

function validateForm() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const documentType = document.getElementById('documentType')?.value;
    const documentNumber = document.getElementById('document')?.value.trim();
    const bank = document.getElementById('bank')?.value;
    const accountType = document.getElementById('accountType')?.value;
    const acceptTerms = document.getElementById('acceptTerms')?.checked;

    if (!fullName || !email || !documentType || !documentNumber || !bank || !accountType) {
        showPaymentMessage('Por favor completa todos los campos obligatorios', 'error');
        return false;
    }

    if (!acceptTerms) {
        showPaymentMessage('Debes aceptar los términos y condiciones', 'error');
        return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showPaymentMessage('Por favor ingresa un correo electrónico válido', 'error');
        return false;
    }

    return true;
}

// ====================== PAGO ======================

async function handlePayment(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    if (payButton) {
        payButton.classList.add('loading');
        payButton.disabled = true;
    }

    try {
        await processPSEPayment();

        updateUserAsVerified();

        showPaymentMessage(
            '¡Pago exitoso! Ahora eres un creador verificado. Redirigiendo al panel...',
            'success'
        );

        setTimeout(() => {
            window.location.href = 'dashboard-creator.html';
        }, 2000);
    } catch (error) {
        showPaymentMessage('Error en el pago: ' + error.message, 'error');
        if (payButton) {
            payButton.classList.remove('loading');
            payButton.disabled = false;
        }
    }
}

// Simular procesamiento de pago PSE
function processPSEPayment() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 90% éxito
            const success = Math.random() > 0.1;

            if (success) {
                resolve({
                    transactionId: 'TXN_' + Date.now(),
                    amount: 15000,
                    currency: 'COP',
                    status: 'approved',
                    method: 'pse',
                });
            } else {
                reject(
                    new Error(
                        'La transacción fue rechazada por el banco. Por favor intenta con otro método de pago.'
                    )
                );
            }
        }, 3000);
    });
}

// ====================== ACTUALIZAR USUARIO ======================

function updateUserAsVerified() {
    if (!currentUser) return;

    currentUser.hasPaid = true;
    currentUser.creatorSince = new Date().toISOString();
    currentUser.paymentMethod = currentPaymentMethod || 'pse';

    // Actualizar currentUser en localStorage
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

    // Actualizar en la lista de usuarios
    const users = JSON.parse(localStorage.getItem('legado_users')) || [];
    const index = users.findIndex((u) => u.id === currentUser.id);

    if (index !== -1) {
        users[index] = currentUser;
        localStorage.setItem('legado_users', JSON.stringify(users));
    }
}

// ====================== MENSAJES ======================

function showPaymentMessage(text, type) {
    if (!paymentMessage) return;

    paymentMessage.textContent = text;
    paymentMessage.className = `message ${type}`;
    paymentMessage.style.display = 'block';

    paymentMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (type !== 'success') {
        setTimeout(() => {
            paymentMessage.style.display = 'none';
        }, 5000);
    }
}

// ====================== ARRANQUE ======================

document.addEventListener('DOMContentLoaded', initPayment);
