// auth.js - Autenticación con Supabase + tabla profiles
(function () {
  'use strict';

  const SUPABASE_URL = 'https://efwolracovsplazrmhdv.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd29scmFjb3ZzcGxhenJtaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDIzNDIsImV4cCI6MjA3OTA3ODM0Mn0.chvbMlvsSJRhHP-nYkezCcSXXq_wnO74kfpL6aXV-0U';

  // Verificar que la librería de Supabase esté disponible
  if (typeof supabase === 'undefined') {
    console.error(
      'Supabase JS no está cargado. Asegúrate de tener ' +
      '<script src="https://unpkg.com/@supabase/supabase-js@2"></script> antes de auth.js'
    );
    return;
  }

  const { createClient } = supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Elementos del DOM
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginCard = document.querySelector('.login-card'); // primer card (login)
  const registerCard = document.getElementById('registerCard');

  // Usuario actual almacenado en localStorage (si existe)
  let currentUser = JSON.parse(localStorage.getItem('legado_currentUser') || 'null');

  // ---------- INICIALIZAR ----------
  function initAuth() {
    setupEventListeners();

    // Si ya hay usuario logueado, redirigimos de una
    if (checkExistingSession()) {
      return;
    }

    // Mostrar login o registro según el hash (#login / #register)
    handleInitialView();
  }

  function setupEventListeners() {
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    if (showRegister) {
      showRegister.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.hash = '#register';
        showRegisterForm();
      });
    }
    if (showLogin) {
      showLogin.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.hash = '#login';
        showLoginForm();
      });
    }

    // Si cambian el hash manualmente (#login / #register)
    window.addEventListener('hashchange', handleInitialView);
  }

  function checkExistingSession() {
    if (currentUser) {
      redirectAfterLogin();
      return true;
    }
    return false;
  }

  // Muestra el card correcto en función del hash actual
  function handleInitialView() {
    if (!loginCard || !registerCard) return;

    const hash = window.location.hash;
    if (hash === '#register') {
      showRegisterForm();
    } else {
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
    const password = document.getElementById('registerPassword').value.trim();
    const userTypeInput = document.querySelector(
      'input[name="registerUserType"]:checked'
    );
    const userType = userTypeInput ? userTypeInput.value : null;

    if (!name || !email || !password || !userType) {
      showMessage(registerMessage, 'Por favor completa todos los campos', 'error');
      return;
    }

    try {
      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
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
        has_paid: userType === 'consumer', // consumidor no paga cuota de creador
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
        name: name,
        email: email,
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

      setTimeout(redirectAfterLogin, 1000);
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
    const userTypeInput = document.querySelector(
      'input[name="userType"]:checked'
    );
    const userType = userTypeInput ? userTypeInput.value : null;

    if (!email || !password || !userType) {
      showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
      return;
    }

    try {
      // 1) Login en Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
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

      // 3) Validar tipo de usuario seleccionado vs el guardado
      if (profile.user_type !== userType) {
        const tipo = profile.user_type === 'creator' ? 'creador' : 'consumidor';
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

      setTimeout(redirectAfterLogin, 1000);
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
    if (!element) {
      console.warn('Elemento de mensaje no encontrado para:', text);
      return;
    }

    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  document.addEventListener('DOMContentLoaded', initAuth);
})();
