// Sistema de Pago - payment.js
'use strict';

// ============ CONFIGURACIÓN WOMPI (link estático) ============
const WOMPI_PAYMENT_LINK = 'https://checkout.wompi.co/l/test_bXBSfQ';

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
        window.location.href = 'login.html#login';
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
    const accountEmailSpan = document.getElementById('accountEmail');

    if (fullNameInput) fullNameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || '';
    if (accountEmailSpan) accountEmailSpan.textContent = currentUser.email || '';
}

// ====================== EVENT LISTENERS ======================

function setupEventListeners() {
    // Selección de método de pago (solo afecta al estado local)
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
    // Por ahora solo usamos un link de Wompi para todo,
    // pero dejamos el log por si luego quieres personalizar.
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

// ====================== PAGO (REDIRECCIÓN A WOMPI) ======================

async function handlePayment(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    if (!currentUser) {
        showPaymentMessage('Debes iniciar sesión antes de pagar.', 'error');
        return;
    }

    if (payButton) {
        payButton.classList.add('loading');
        payButton.disabled = true;
    }

    // Guardar intención de pago (por si luego quieres usarla)
    localStorage.setItem(
        'legado_lastPaymentIntent',
        JSON.stringify({
            userId: currentUser.id,
            email: currentUser.email,
            method: currentPaymentMethod,
            createdAt: new Date().toISOString(),
        })
    );

    showPaymentMessage(
        'Te redirigiremos a Wompi para completar el pago. Usa el MISMO correo que ves arriba.',
        'info'
    );

    // Pequeña pausa visual y luego redirigir al link de Wompi
    setTimeout(() => {
        window.location.href = WOMPI_PAYMENT_LINK;
    }, 800);
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
