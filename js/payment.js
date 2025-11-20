// Sistema de Pago - payment.js
'use strict';

// ============ CONFIGURACIÓN WOMPI (link estático) ============
const WOMPI_PAYMENT_LINK = 'https://checkout.wompi.co/l/test_fcyj49';

// ====================== ELEMENTOS DEL DOM ======================

const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');
const payButton = document.getElementById('payButton');

const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// ====================== ESTADO ======================

let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// ====================== INICIALIZACIÓN ======================

function initPayment() {
  const isCreatorUser =
    currentUser &&
    (currentUser.type === 'creator' || currentUser.isCreator === true);

  if (!isCreatorUser) {
    // Si no es creador (o no eligió ese rol al registrarse), mandamos a login/registro
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
  if (userName) userName.textContent = currentUser.name || currentUser.full_name || 'Usuario';
  if (userAvatar) {
    const baseName = currentUser.name || currentUser.full_name || 'U';
    userAvatar.textContent = baseName.charAt(0).toUpperCase();
  }
}

function prefillUserData() {
  if (!currentUser) return;

  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const accountEmailSpan = document.getElementById('accountEmail');

  const name = currentUser.name || currentUser.full_name || '';

  if (fullNameInput) fullNameInput.value = name;
  if (emailInput) emailInput.value = currentUser.email || '';
  if (accountEmailSpan) accountEmailSpan.textContent = currentUser.email || '';
}

// ====================== EVENT LISTENERS ======================

function setupEventListeners() {
  if (paymentForm) {
    paymentForm.addEventListener('submit', handlePayment);
  }
}

// ====================== VALIDACIÓN ======================

function validateForm() {
  const fullName = document.getElementById('fullName')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const documentType = document.getElementById('documentType')?.value;
  const documentNumber = document.getElementById('document')?.value.trim();
  const acceptTerms = document.getElementById('acceptTerms')?.checked;

  if (!fullName || !email || !documentType || !documentNumber) {
    showPaymentMessage('Por favor completa todos los campos obligatorios', 'error');
    return false;
  }

  if (!acceptTerms) {
    showPaymentMessage('Debes aceptar los términos y condiciones', 'error');
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showPaymentMessage('Por favor ingresa un correo electrónico válido', 'error');
    return false;
  }

  // Extra: advertir si el email escrito no coincide con el de la sesión
  if (
    currentUser &&
    currentUser.email &&
    email.toLowerCase() !== currentUser.email.toLowerCase()
  ) {
    const msg =
      'El correo que escribiste no coincide con el de tu cuenta.\n\n' +
      'Te recomendamos usar exactamente el mismo correo que ves arriba ' +
      'para que podamos vincular el pago correctamente.';
    alert(msg);
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

  // Guardar intención de pago (opcional, para debug o futuro tracking)
  localStorage.setItem(
    'legado_lastPaymentIntent',
    JSON.stringify({
      userId: currentUser.id,
      email: currentUser.email,
      createdAt: new Date().toISOString(),
    })
  );

  showPaymentMessage(
    'Te redirigiremos a Wompi para completar el pago. Usa el MISMO correo que ves arriba.',
    'info'
  );

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
