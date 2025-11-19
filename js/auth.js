// auth.js - Autenticación con Supabase + tabla profiles

(function () {
  'use strict';

  const SUPABASE_URL = 'https://efwolracovsplazrmhdv.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd29scmFjb3ZzcGxhenJtaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDIzNDIsImV4cCI6MjA3OTA3ODM0Mn0.chvbMlvsSJRhHP-nYkezCcSXXq_wnO74kfpL6aXV-0U';

  let supabaseClient = null;

  // 1) Intentar usar un cliente global si ya existe (por ejemplo, desde supabaseClient.js)
  if (window.supabaseClient) {
    supabaseClient = window.supabaseClient;
  } else if (typeof supabase !== 'undefined') {
    // 2) Si no existe, crearlo desde la librería global (CDN)
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
  } else {
    console.error(
      'Supabase JS no está cargado. Asegúrate de tener:\n' +
        '<script src="https://unpkg.com/@supabase/supabase-js@2"></script>\n' +
        'antes de auth.js en login.html'
    );
    return;
  }

  // --------- ELEMENTOS DEL DOM ----------
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');

  // Primer .login-card que NO es la de registro
  const loginCard = document.querySelector('.login-card:not(.register-card)');
  const registerCard = document.getElementById('registerCard');

  let currentUser =
    JSON.parse(localStorage.getItem('legado_currentUser')) || null;

  // ---------- INICIALIZAR ----------
  function initAuth() {
    setupEventListeners();
    applyHashView(); // mostrar login o registro según #login / #register
    // IMPORTANTE: Ya NO redirigimos automáticamente si hay currentUser
  }

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
        window.location.hash = '#register';
      });
    }
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
        window.location.hash = '#login';
      });
    }

    // Por si cambias el hash manualmente (o vienes desde index con #register)
    window.addEventListener('hashchange', applyHashView);
  }

  // Muestra la tarjeta correcta según el hash (#login o #register)
  function applyHashView() {
    const hash = window.location.hash;
    if (hash === '#register') {
      showRegisterForm();
    } else {
      // Por defecto: login
      showLoginForm();
    }
  }

  function showRegisterForm() {
    if (!loginCard || !registerCard) return;
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
  }

  function showLoginForm() {
    if (!loginCard || !registerCard) return;
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
  }

  // ---------- REGISTRO ----------
  async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document
      .getElementById('registerPassword')
      .value.trim();
    const userType = document.querySelector(
      'input[name="registerUserType"]:checked'
    ).value;

    if (!name || !email || !password) {
      showMessage(
        registerMessage,
        'Por favor completa todos los campos',
        'error'
      );
      return;
    }

    try {
      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error(error);
        showMessage(
          registerMessage,
          error.message || 'Error al registrar el usuario',
          'error'
        );
        return;
      }

      const user = data.user;
      if (!user) {
        // Si tu proyecto tiene confirmación por correo activada
        showMessage(
          registerMessage,
          'Registro creado. Revisa tu correo para confirmar la cuenta.',
          'success'
        );
        return;
      }

      // 2) Crear perfil en la tabla profiles
      const profile = {
        id: user.id, // FK a auth.users
        full_name: name,
        user_type: userType, // 'consumer' o 'creator'
        is_creator: userType === 'creator',
        has_paid: userType === 'consumer', // consumidor no paga
        creator_since: null,
        payment_method: null,
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert(profile);

      if (profileError) {
        console.error(profileError);
        showMessage(
          registerMessage,
          'Usuario creado, pero hubo un error guardando el perfil.',
          'error'
        );
        return;
      }

      // 3) Guardar info mínima en localStorage para que el resto del sitio funcione
      currentUser = {
        id: user.id,
        name,
        email,
        type: userType,
        isCreator: profile.is_creator,
        hasPaid: profile.has_paid,
        creatorSince: profile.creator_since,
        paymentMethod: profile.payment_method
      };

      localStorage.setItem(
        'legado_currentUser',
        JSON.stringify(currentUser)
      );

      showMessage(
        registerMessage,
        '¡Registro exitoso! Redirigiendo...',
        'success'
      );

      setTimeout(() => {
        redirectAfterLogin();
      }, 1000);
    } catch (err) {
      console.error(err);
      showMessage(
        registerMessage,
        'Error inesperado al registrar. Intenta de nuevo.',
        'error'
      );
    }
  }

  // ---------- LOGIN ----------
  async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const userType = document.querySelector(
      'input[name="userType"]:checked'
    ).value;

    if (!email || !password) {
      showMessage(
        loginMessage,
        'Por favor completa todos los campos',
        'error'
      );
      return;
    }

    try {
      // 1) Login en Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error(error);
        showMessage(
          loginMessage,
          error.message || 'Correo o contraseña incorrectos',
          'error'
        );
        return;
      }

      const user = data.user;
      if (!user) {
        showMessage(
          loginMessage,
          'No se pudo obtener el usuario. Intenta de nuevo.',
          'error'
        );
        return;
      }

      // 2) Leer perfil desde profiles
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error(profileError);
        showMessage(
          loginMessage,
          'No se encontró el perfil de este usuario.',
          'error'
        );
        return;
      }

      // 3) Validar tipo de usuario seleccionado vs guardado
      if (profile.user_type !== userType) {
        const tipo =
          profile.user_type === 'creator' ? 'creador' : 'consumidor';
        showMessage(
          loginMessage,
          `Este correo está registrado como ${tipo}`,
          'error'
        );
        return;
      }

      // 4) Guardar usuario en localStorage
      currentUser = {
        id: user.id,
        name: profile.full_name,
        email: user.email,
        type: profile.user_type,
        isCreator: profile.is_creator,
        hasPaid: profile.has_paid,
        creatorSince: profile.creator_since,
        paymentMethod: profile.payment_method
      };

      localStorage.setItem(
        'legado_currentUser',
        JSON.stringify(currentUser)
      );

      showMessage(
        loginMessage,
        '¡Inicio de sesión exitoso! Redirigiendo...',
        'success'
      );

      setTimeout(() => {
        redirectAfterLogin();
      }, 1000);
    } catch (err) {
      console.error(err);
      showMessage(
        loginMessage,
        'Error inesperado al iniciar sesión. Intenta de nuevo.',
        'error'
      );
    }
  }

  // ---------- REDIRECCIÓN ----------
  function redirectAfterLogin() {
    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }

    if (currentUser.type === 'creator' && !currentUser.hasPaid) {
      // Creador sin pagar -> página de pago
      window.location.href = 'payment.html';
    } else if (currentUser.type === 'creator' && currentUser.hasPaid) {
      // Creador verificado -> dashboard
      window.location.href = 'dashboard-creator.html';
    } else {
      // Consumidor -> inicio
      window.location.href = 'index.html';
    }
  }

  // ---------- UTIL: MENSAJES ----------
  function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  document.addEventListener('DOMContentLoaded', initAuth);
})();
