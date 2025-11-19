// auth.js - Autenticación con Supabase para LEGADO DIGITAL

// 1. Configurar tu proyecto Supabase
const SUPABASE_URL = 'https://efwolracovsplazrmhdv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd29scmFjb3ZzcGxhenJtaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDIzNDIsImV4cCI6MjA3OTA3ODM0Mn0.chvbMlvsSJRhHP-nYkezCcSXXq_wnO74kfpL6aXV-0U';

// Cliente Supabase (disponible porque cargamos el script UMD en login.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Estado en el navegador (para que index/dashboard sigan funcionando)
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// 3. Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginCard = document.querySelector('.login-card');
const registerCard = document.getElementById('registerCard');

// ========== INICIO ==========
function initAuth() {
  setupEventListeners();
  restoreSessionFromSupabase();
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

// Intentar restaurar sesión desde Supabase
async function restoreSessionFromSupabase() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error obteniendo sesión desde Supabase', error);
      return;
    }

    const session = data.session;
    if (session) {
      // Si hay sesión, cargar perfil y redirigir
      if (!currentUser) {
        await loadCurrentUserFromSupabase(session.user);
      }
      redirectAfterLogin();
    }
  } catch (err) {
    console.error('Error restaurando sesión', err);
  }
}

// Mostrar formulario de registro
function showRegisterForm() {
  if (loginCard) loginCard.style.display = 'none';
  if (registerCard) registerCard.style.display = 'block';
}

// Mostrar formulario de login
function showLoginForm() {
  if (registerCard) registerCard.style.display = 'none';
  if (loginCard) loginCard.style.display = 'block';
}

// ========== UTILIDAD: Cargar perfil desde Supabase ==========
async function loadCurrentUserFromSupabase(user) {
  if (!user) return;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error cargando perfil del usuario', error);
      return;
    }

    currentUser = {
      id: user.id,
      email: user.email,
      name: profile.full_name,
      type: profile.user_type,
      isCreator: profile.is_creator,
      hasPaid: profile.has_paid,
      creatorSince: profile.creator_since,
      paymentMethod: profile.payment_method
    };

    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
  } catch (err) {
    console.error('Error inesperado leyendo perfil', err);
  }
}

// ========== REGISTRO ==========
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const userType = document.querySelector(
    'input[name="registerUserType"]:checked'
  ).value;

  if (!name || !email || !password) {
    showMessage(registerMessage, 'Por favor completa todos los campos', 'error');
    return;
  }

  try {
    // 1) Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Error en signUp:', error);
      showMessage(registerMessage, error.message || 'No se pudo registrar', 'error');
      return;
    }

    const user = data.user;
    if (!user) {
      showMessage(
        registerMessage,
        'Usuario creado, pero debes confirmar tu correo antes de iniciar sesión.',
        'success'
      );
      return;
    }

    // 2) Crear perfil en la tabla profiles
    const profileData = {
      id: user.id,
      full_name: name,
      user_type: userType, // 'consumer' o 'creator'
      is_creator: userType === 'creator',
      has_paid: userType === 'consumer', // Consumidor no paga, creador empieza en false
      created_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Error insertando perfil:', profileError);
      showMessage(
        registerMessage,
        'El usuario se creó pero hubo un problema guardando el perfil.',
        'error'
      );
      return;
    }

    // 3) Guardar usuario actual en localStorage
    await loadCurrentUserFromSupabase(user);

    showMessage(registerMessage, '¡Registro exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
      redirectAfterLogin();
    }, 1000);
  } catch (err) {
    console.error('Error inesperado en registro:', err);
    showMessage(
      registerMessage,
      'Ocurrió un error inesperado al registrarte.',
      'error'
    );
  }
}

// ========== LOGIN ==========
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const userType = document.querySelector(
    'input[name="userType"]:checked'
  ).value;

  if (!email || !password) {
    showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
    return;
  }

  try {
    // 1) Iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error en signInWithPassword:', error);
      showMessage(
        loginMessage,
        'Correo electrónico o contraseña incorrectos',
        'error'
      );
      return;
    }

    const user = data.user;
    if (!user) {
      showMessage(loginMessage, 'No se pudo iniciar sesión', 'error');
      return;
    }

    // 2) Cargar perfil desde la tabla profiles
    await loadCurrentUserFromSupabase(user);

    if (!currentUser) {
      showMessage(
        loginMessage,
        'No se encontró el perfil para este usuario.',
        'error'
      );
      await supabase.auth.signOut();
      return;
    }

    // 3) Verificar tipo de usuario
    if (currentUser.type !== userType) {
      const tipo = currentUser.type === 'creator' ? 'creador' : 'consumidor';
      showMessage(
        loginMessage,
        `Este correo está registrado como ${tipo}`,
        'error'
      );
      await supabase.auth.signOut();
      localStorage.removeItem('legado_currentUser');
      currentUser = null;
      return;
    }

    showMessage(loginMessage, '¡Inicio de sesión exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
      redirectAfterLogin();
    }, 1000);
  } catch (err) {
    console.error('Error inesperado en login:', err);
    showMessage(
      loginMessage,
      'Ocurrió un error inesperado al iniciar sesión.',
      'error'
    );
  }
}

// ========== REDIRECCIÓN POST LOGIN/REGISTRO ==========
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

// ========== MENSAJES ==========
function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);
