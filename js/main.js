// ========== SISTEMA DE CONTENIDO, PAGOS Y UI (USA LA SESIÓN DE SUPABASE) ==========

// Usuario autenticado: lo escribe auth.js (Supabase) en localStorage
// Estructura esperada:
// { id, name, email, type: 'consumer'|'creator', isCreator, hasPaid, creatorSince, paymentMethod }
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// Contenido guardado en localStorage (por ahora sigue siendo local para lo que se agrega desde index)
// Además, más abajo cargamos CONTENIDO REAL de creadores desde Supabase.
let content = JSON.parse(localStorage.getItem('legado_content')) || [];

// Cliente de Supabase creado en supabaseClient.js
const supabaseClient = window.supabaseClient || null;

// Nuevo botón para ir al panel del creador
const creatorDashboardBtn = document.getElementById('creatorDashboardBtn');

// Elementos del DOM (index.html)
const userInfo = document.getElementById('userInfo');
const authButtons = document.getElementById('authButtons');
const addContentBtn = document.getElementById('addContentBtn');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const creatorBadge = document.getElementById('creatorBadge');

const loginBtn = document.getElementById('loginBtn');       // <a href="login.html#login">
const registerBtn = document.getElementById('registerBtn'); // <a href="login.html#register">
const logoutBtn = document.getElementById('logoutBtn');

const paymentModal = document.getElementById('paymentModal');
const addContentModal = document.getElementById('addContentModal');
const editContentModal = document.getElementById('editContentModal');
const closeModals = document.querySelectorAll('.close-modal');

const payBtn = document.getElementById('payBtn');
const paymentMessage = document.getElementById('paymentMessage');
const paymentMethods = document.querySelectorAll('.payment-method');

// Grids para mostrar contenido
const videosGrid = document.getElementById('videosGrid');
const audiosGrid = document.getElementById('audiosGrid');
const imagesGrid = document.getElementById('imagesGrid');
const phrasesGrid = document.getElementById('phrasesGrid');

// Estado
let currentPaymentMethod = 'card';

// ========== INICIALIZACIÓN ==========

function initApp() {
  updateUI();
  loadInitialContent();  // Semilla local (sistema)
  loadContent();         // Pinta lo local (inicial + lo agregado desde index)

  // 🔥 Cargar contenido real de creadores desde Supabase (más reciente primero)
  if (supabaseClient) {
    fetchRemoteContent();
  }

  // Botones del header (login / registro simplemente navegan a login.html)
  if (loginBtn) {
    // Navegación normal
  }

  if (registerBtn) {
    // Navegación normal
  }

  if (addContentBtn) {
    addContentBtn.addEventListener('click', () => {
      if (currentUser && currentUser.isCreator && currentUser.hasPaid) {
        showModal(addContentModal);
      } else if (!currentUser) {
        alert('Debes iniciar sesión como creador para agregar contenido.');
      } else {
        alert('Debes completar el pago de creador para agregar contenido.');
        if (paymentModal) showModal(paymentModal);
      }
    });
  }

  if (creatorDashboardBtn) {
    creatorDashboardBtn.addEventListener('click', () => {
      // Solo para creadores con pago
      if (!currentUser) {
        window.location.href = 'login.html#login';
        return;
      }
      if (!currentUser.isCreator || !currentUser.hasPaid) {
        alert('Debes ser creador y haber completado el pago para acceder al panel.');
        return;
      }
      window.location.href = 'dashboard-creator.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Cerrar modales (botón X)
  closeModals.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // Cerrar modal al hacer clic fuera
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Métodos de pago
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('active'));
      method.classList.add('active');
      currentPaymentMethod = method.getAttribute('data-method');
    });
  });

  if (payBtn) {
    payBtn.addEventListener('click', handlePayment);
  }

  // Formularios de contenido (AGREGAR) — estos siguen siendo locales en index
  const videoForm = document.getElementById('videoForm');
  const audioForm = document.getElementById('audioForm');
  const imageForm = document.getElementById('imageForm');
  const phraseForm = document.getElementById('phraseForm');

  if (videoForm) videoForm.addEventListener('submit', (e) => handleAddContent(e, 'video'));
  if (audioForm) audioForm.addEventListener('submit', (e) => handleAddContent(e, 'audio'));
  if (imageForm) imageForm.addEventListener('submit', (e) => handleAddContent(e, 'image'));
  if (phraseForm) phraseForm.addEventListener('submit', (e) => handleAddContent(e, 'phrase'));

  // Formularios de contenido (EDITAR) — solo para contenido local
  const editVideoForm = document.getElementById('editVideoForm');
  const editAudioForm = document.getElementById('editAudioForm');
  const editImageForm = document.getElementById('editImageForm');
  const editPhraseForm = document.getElementById('editPhraseForm');

  if (editVideoForm) editVideoForm.addEventListener('submit', (e) => handleEditContent(e, 'video'));
  if (editAudioForm) editAudioForm.addEventListener('submit', (e) => handleEditContent(e, 'audio'));
  if (editImageForm) editImageForm.addEventListener('submit', (e) => handleEditContent(e, 'image'));
  if (editPhraseForm) editPhraseForm.addEventListener('submit', (e) => handleEditContent(e, 'phrase'));

  // Inputs de archivos
  setupFileInputs();
}

// ========== CARGA DE CONTENIDO DESDE SUPABASE ==========

async function fetchRemoteContent() {
  try {
    // Ajusta 'content' si tu tabla tiene otro nombre
    const { data, error } = await supabaseClient
      .from('content')
      .select('*')
      .order('created_at', { ascending: false }); // 🔥 Más reciente primero

    if (error) {
      console.error('Error cargando contenido remoto (Supabase):', error);
      return;
    }

    if (!Array.isArray(data)) return;

    const mapped = data.map(row => {
      // Normalizar etiquetas: array o string "a,b,c"
      let tags = [];
      if (Array.isArray(row.tags)) {
        tags = row.tags;
      } else if (typeof row.tags === 'string') {
        tags = row.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      const base = {
        id: String(row.id),
        type: row.type,
        url: row.url || '',
        tags,
        userId: row.user_id || row.userId || 'creator',
        userName: row.user_name || row.userName || row.author || 'Creador',
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        source: 'supabase' // 👈 Marcamos como remoto para no editar desde index
      };

      if (row.type === 'phrase') {
        return {
          ...base,
          text: row.text || row.description || '',
          author: row.author || base.userName,
          context: row.context || ''
        };
      } else {
        return {
          ...base,
          title: row.title || '',
          description: row.description || ''
        };
      }
    });

    // Evitar duplicados por id (por si ya hay algo en local con el mismo id)
    const existingIds = new Set(content.map(c => String(c.id)));
    mapped.forEach(item => {
      if (!existingIds.has(String(item.id))) {
        content.push(item);
      }
    });

    // No guardamos en localStorage el contenido remoto para que siempre sea "vivo"
    loadContent(); // Re-pintar con lo remoto incluido
  } catch (err) {
    console.error('Error inesperado al cargar contenido remoto:', err);
  }
}

// ========== CONFIGURAR INPUTS DE ARCHIVO ==========

function setupFileInputs() {
  // Video
  const videoFileInput = document.getElementById('videoFile');
  const videoFileLabel = document.getElementById('videoFileLabel');
  const videoFileName = document.getElementById('videoFileName');

  if (videoFileInput && videoFileLabel && videoFileName) {
    videoFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        videoFileLabel.classList.add('has-file');
        videoFileName.textContent = this.files[0].name;
      } else {
        videoFileLabel.classList.remove('has-file');
        videoFileName.textContent = '';
      }
    });
  }

  // Audio
  const audioFileInput = document.getElementById('audioFile');
  const audioFileLabel = document.getElementById('audioFileLabel');
  const audioFileName = document.getElementById('audioFileName');

  if (audioFileInput && audioFileLabel && audioFileName) {
    audioFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        audioFileLabel.classList.add('has-file');
        audioFileName.textContent = this.files[0].name;
      } else {
        audioFileLabel.classList.remove('has-file');
        audioFileName.textContent = '';
      }
    });
  }

  // Imagen
  const imageFileInput = document.getElementById('imageFile');
  const imageFileLabel = document.getElementById('imageFileLabel');
  const imageFileName = document.getElementById('imageFileName');

  if (imageFileInput && imageFileLabel && imageFileName) {
    imageFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        imageFileLabel.classList.add('has-file');
        imageFileName.textContent = this.files[0].name;
      } else {
        imageFileLabel.classList.remove('has-file');
        imageFileName.textContent = '';
      }
    });
  }

  // Editar Video
  const editVideoFileInput = document.getElementById('editVideoFile');
  const editVideoFileLabel = document.getElementById('editVideoFileLabel');
  const editVideoFileName = document.getElementById('editVideoFileName');

  if (editVideoFileInput && editVideoFileLabel && editVideoFileName) {
    editVideoFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        editVideoFileLabel.classList.add('has-file');
        editVideoFileName.textContent = this.files[0].name;
      } else {
        editVideoFileLabel.classList.remove('has-file');
        editVideoFileName.textContent = '';
      }
    });
  }

  // Editar Audio
  const editAudioFileInput = document.getElementById('editAudioFile');
  const editAudioFileLabel = document.getElementById('editAudioFileLabel');
  const editAudioFileName = document.getElementById('editAudioFileName');

  if (editAudioFileInput && editAudioFileLabel && editAudioFileName) {
    editAudioFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        editAudioFileLabel.classList.add('has-file');
        editAudioFileName.textContent = this.files[0].name;
      } else {
        editAudioFileLabel.classList.remove('has-file');
        editAudioFileName.textContent = '';
      }
    });
  }

  // Editar Imagen
  const editImageFileInput = document.getElementById('editImageFile');
  const editImageFileLabel = document.getElementById('editImageFileLabel');
  const editImageFileName = document.getElementById('editImageFileName');

  if (editImageFileInput && editImageFileLabel && editImageFileName) {
    editImageFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        editImageFileLabel.classList.add('has-file');
        editImageFileName.textContent = this.files[0].name;
      } else {
        editImageFileLabel.classList.remove('has-file');
        editImageFileName.textContent = '';
      }
    });
  }
}

// ========== CONTENIDO INICIAL (SEMILLA LOCAL) ==========

function loadInitialContent() {
  if (content.length === 0) {
    const now = new Date().toISOString();

    content = [
      // --- Videos ---
      {
        id: '1',
        type: 'video',
        title: 'Entrevista: Memoria del barrio',
        url: 'media/video1.mp4',
        description: 'Entrevista con habitantes sobre prácticas tradicionales. Año: 2024. Duración: 12:34.',
        tags: ['Video', 'Oral History', 'Región: Andina'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '2',
        type: 'video',
        title: 'Clase de Museología',
        url: 'media/Clase de Museología - Historia y Patrimonio.mp4',
        description: 'Clase sobre historia y patrimonio cultural. Año: 2024. Duración: 45:20.',
        tags: ['Documental', 'Educación', 'Patrimonio'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },

      // --- Audios ---
      {
        id: '3',
        type: 'audio',
        title: 'Relato: Canto de los oficios',
        url: 'media/podcast-prostitucion.mpeg',
        description: 'Registro de canto ritual. Contexto histórico y transcripción breve. Duración: 8:45.',
        tags: ['Audio', 'Tradición oral', 'Canto'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '4',
        type: 'audio',
        title: 'Podcast: Historia y Patrimonio',
        url: 'media/Podcast - Universidad del Magdalena.mp3',
        description: 'Conversación sobre la importancia del patrimonio cultural. Duración: 32:10.',
        tags: ['Podcast', 'Conversación', 'Cultura'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },

      // --- Imágenes ---
      {
        id: '5',
        type: 'image',
        title: 'Fotografía: Plaza central',
        url: 'media/img1.jfif',
        description: 'Fotografía histórica de la plaza principal y su función comunitaria. Año: 1950. Autor: Fotógrafo local.',
        tags: ['Foto', 'Espacio público', 'Histórico'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '6',
        type: 'image',
        title: 'Arquitectura tradicional',
        url: 'media/img2.jfif',
        description: 'Edificio representativo de la arquitectura tradicional de la región. Año: 1920.',
        tags: ['Arquitectura', 'Patrimonio', 'Edificio'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '7',
        type: 'image',
        title: 'Patrimonio cultural',
        url: 'media/img3.jfif',
        description: 'Representación del patrimonio cultural de la región.',
        tags: ['Cultura', 'Patrimonio', 'Tradición'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '8',
        type: 'image',
        title: 'Arquitectura histórica',
        url: 'media/img4.jfif',
        description: 'Ejemplo de arquitectura histórica preservada.',
        tags: ['Arquitectura', 'Histórico', 'Conservación'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '9',
        type: 'image',
        title: 'Patrimonio arquitectónico',
        url: 'media/img5.jfif',
        description: 'Detalle del patrimonio arquitectónico regional.',
        tags: ['Arquitectura', 'Patrimonio', 'Detalle'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },

      // --- Frases ---
      {
        id: '10',
        type: 'phrase',
        text: "Santa Marta, tierra de sueños\nSanta Marta, tierra de sueños,\ncuna de historias y aventuras,\ntu brisa guarda secretos guardados,\ntu mar susurra canciones de gritos.\nLa historia enriquece nuestra vida,\ntus calles guardan huellas sagradas,\nrecuerdos de luchas y victorias,\nde un pasado que nunca se apaga.\nTus montañas besan el cielo,\ntu arena acaricia los pies cansados,\ny en cada rincón florece la vida,\ncomo un tesoro jamás olvidado.\nSanta Marta, puerto de anhelos,\nespejo de culturas que se abrazan,\neres raíz, presente y futuro,\nuna tierra que sueña y nunca se cansa.\n_ Wendy Gómez O.",
        author: 'Wendy Gómez O.',
        context: 'Poema dedicado a Santa Marta, resaltando su belleza natural y riqueza cultural.',
        tags: ['Poesía', 'Santa Marta', 'Naturaleza'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      },
      {
        id: '11',
        type: 'phrase',
        text: "Santa Marta de mi corazón\nSanta Marta, mi corazón es tuyo…\nLlegué al mar,\ndonde el viento sopla sin horizonte,\ndonde las olas golpean la arena,\ndonde el sol brilla\ncomo las estrellas en la noche.\nSanta Marta de mi corazón,\nescribiste mi historia\ny aún lo haces.\nQuiero seguir escribiéndote,\nporque hablar de tus hazañas\nme enamora más de ti.\nConocer tu historia\nme recuerda el pasado\nque tuviste que atravesar;\nconocer tu cultura\nme hace caer rendido en amor.\nTu gente es dinamita sonriente,\nreímos, compartimos,\ny el \"¡ay ombe!\"\nno se borra de nuestra boca,\nson palabras que adornan\ntu memoria y tu historia.",
        author: 'Anónimo',
        context: 'Expresión de amor y conexión profunda con la ciudad y su gente.',
        tags: ['Cita', 'Amor', 'Cultura'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: now,
        source: 'local'
      }
    ];

    localStorage.setItem('legado_content', JSON.stringify(content));
  }
}

// ========== UI HEADER ==========

function updateUI() {
  if (!userInfo || !authButtons || !addContentBtn || !creatorBadge || !userName || !userAvatar) return;

  if (currentUser) {
    userInfo.style.display = 'flex';
    authButtons.style.display = 'none';

    if (currentUser.isCreator && currentUser.hasPaid) {
      addContentBtn.style.display = 'flex';
      creatorBadge.style.display = 'inline-block';
      if (creatorDashboardBtn) creatorDashboardBtn.style.display = 'inline-flex';
    } else {
      addContentBtn.style.display = 'none';
      creatorBadge.style.display = 'none';
      if (creatorDashboardBtn) creatorDashboardBtn.style.display = 'none';
    }

    userName.textContent = currentUser.name || 'Usuario';
    userAvatar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
  } else {
    userInfo.style.display = 'none';
    authButtons.style.display = 'flex';
    addContentBtn.style.display = 'none';
    creatorBadge.style.display = 'none';
    if (creatorDashboardBtn) creatorDashboardBtn.style.display = 'none';
  }
}

// ========== MODALES GENERALES ==========

function showModal(modal) {
  if (!modal) return;
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  modal.classList.add('active');
}

// ========== PAGO DE CREADOR (SIMULADO) ==========

async function handlePayment() {
  if (!currentUser) {
    alert('Debes iniciar sesión como creador para realizar el pago.');
    return;
  }

  // Validación básica tarjeta (solo si está seleccionada)
  if (currentPaymentMethod === 'card') {
    const cardNumber = document.getElementById('cardNumber')?.value;
    const expiryDate = document.getElementById('expiryDate')?.value;
    const cvv = document.getElementById('cvv')?.value;
    const cardName = document.getElementById('cardName')?.value;

    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      showPaymentMessage('Por favor completa todos los campos de la tarjeta', 'error');
      return;
    }
  }

  showPaymentMessage('Procesando pago...', 'info');

  try {
    // Pequeña pausa visual
    await new Promise(res => setTimeout(res, 1200));

    if (supabaseClient) {
      // Actualizar el perfil en la tabla profiles
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          has_paid: true,
          payment_method: currentPaymentMethod,
          creator_since: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando perfil en Supabase', error);
        showPaymentMessage(
          'El pago se procesó, pero hubo un problema guardando en la base de datos. Intenta de nuevo.',
          'error'
        );
        return;
      }

      // Sincronizar con el objeto local
      currentUser.hasPaid = data.has_paid;
      currentUser.paymentMethod = data.payment_method;
      currentUser.creatorSince = data.creator_since;
    } else {
      // Fallback: solo marcar localmente
      currentUser.hasPaid = true;
    }

    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));

    showPaymentMessage('¡Pago exitoso! Ahora tienes acceso completo a las herramientas de creador.', 'success');
    updateUI();

    setTimeout(() => {
      if (paymentModal) paymentModal.classList.remove('active');
    }, 1500);
  } catch (err) {
    console.error(err);
    showPaymentMessage('Ocurrió un error inesperado procesando el pago.', 'error');
  }
}

function showPaymentMessage(message, type) {
  if (!paymentMessage) return;
  paymentMessage.textContent = message;
  paymentMessage.className = `payment-message ${type}`;
  paymentMessage.style.display = 'block';
}

// ========== SESIÓN ==========

async function logout() {
  currentUser = null;
  localStorage.removeItem('legado_currentUser');

  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.error('Error cerrando sesión en Supabase', e);
    }
  }

  updateUI();
  loadContent(); // sigue recargando el contenido (local + remoto cargado previamente)
  alert('Sesión cerrada');
}

// ========== CONTENIDO: AGREGAR / EDITAR / ELIMINAR / PINTAR ==========

function handleAddContent(e, type) {
  e.preventDefault();

  if (!currentUser || !currentUser.isCreator || !currentUser.hasPaid) {
    alert('Debes ser un creador verificado para agregar contenido');
    return;
  }

  let contentData = {};

  switch (type) {
    case 'video': {
      const videoFile = document.getElementById('videoFile').files[0];
      if (!videoFile) {
        alert('Por favor, selecciona un archivo de video');
        return;
      }
      const videoUrl = URL.createObjectURL(videoFile);
      contentData = {
        title: document.getElementById('videoTitle').value,
        url: videoUrl,
        description: document.getElementById('videoDescription').value,
        tags: document.getElementById('videoTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'audio': {
      const audioFile = document.getElementById('audioFile').files[0];
      if (!audioFile) {
        alert('Por favor, selecciona un archivo de audio');
        return;
      }
      const audioUrl = URL.createObjectURL(audioFile);
      contentData = {
        title: document.getElementById('audioTitle').value,
        url: audioUrl,
        description: document.getElementById('audioDescription').value,
        tags: document.getElementById('audioTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'image': {
      const imageFile = document.getElementById('imageFile').files[0];
      if (!imageFile) {
        alert('Por favor, selecciona un archivo de imagen');
        return;
      }
      const imageUrl = URL.createObjectURL(imageFile);
      contentData = {
        title: document.getElementById('imageTitle').value,
        url: imageUrl,
        description: document.getElementById('imageDescription').value,
        tags: document.getElementById('imageTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'phrase':
      contentData = {
        text: document.getElementById('phraseText').value,
        author: document.getElementById('phraseAuthor').value,
        context: document.getElementById('phraseContext').value,
        tags: document.getElementById('phraseTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
  }

  const newContent = {
    id: Date.now().toString(),
    type,
    ...contentData,
    userId: currentUser.id,
    userName: currentUser.name,
    createdAt: new Date().toISOString(),
    source: 'local' // 👈 Local, editable desde index
  };

  content.push(newContent);
  localStorage.setItem('legado_content', JSON.stringify(content));

  e.target.reset();
  document.querySelectorAll('.file-input-label').forEach(label => label.classList.remove('has-file'));
  document.querySelectorAll('.file-name').forEach(el => { el.textContent = ''; });

  if (addContentModal) addContentModal.classList.remove('active');
  loadContent();
  alert('¡Contenido agregado exitosamente!');
}

function handleEditContent(e, type) {
  e.preventDefault();

  if (!currentUser) {
    alert('Debes iniciar sesión para editar contenido');
    return;
  }

  let contentData = {};
  let contentId = '';

  switch (type) {
    case 'video': {
      contentId = document.getElementById('editVideoId').value;
      const videoFile = document.getElementById('editVideoFile').files[0];
      const existing = content.find(item => item.id === contentId);
      if (!existing) { alert('Error: Contenido no encontrado'); return; }
      if (existing.source === 'supabase') {
        alert('Este contenido proviene del panel de creadores y no se puede editar desde aquí.');
        return;
      }
      const videoUrl = videoFile ? URL.createObjectURL(videoFile) : existing.url;
      contentData = {
        title: document.getElementById('editVideoTitle').value,
        url: videoUrl,
        description: document.getElementById('editVideoDescription').value,
        tags: document.getElementById('editVideoTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'audio': {
      contentId = document.getElementById('editAudioId').value;
      const audioFile = document.getElementById('editAudioFile').files[0];
      const existing = content.find(item => item.id === contentId);
      if (!existing) { alert('Error: Contenido no encontrado'); return; }
      if (existing.source === 'supabase') {
        alert('Este contenido proviene del panel de creadores y no se puede editar desde aquí.');
        return;
      }
      const audioUrl = audioFile ? URL.createObjectURL(audioFile) : existing.url;
      contentData = {
        title: document.getElementById('editAudioTitle').value,
        url: audioUrl,
        description: document.getElementById('editAudioDescription').value,
        tags: document.getElementById('editAudioTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'image': {
      contentId = document.getElementById('editImageId').value;
      const imageFile = document.getElementById('editImageFile').files[0];
      const existing = content.find(item => item.id === contentId);
      if (!existing) { alert('Error: Contenido no encontrado'); return; }
      if (existing.source === 'supabase') {
        alert('Este contenido proviene del panel de creadores y no se puede editar desde aquí.');
        return;
      }
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : existing.url;
      contentData = {
        title: document.getElementById('editImageTitle').value,
        url: imageUrl,
        description: document.getElementById('editImageDescription').value,
        tags: document.getElementById('editImageTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }

    case 'phrase': {
      contentId = document.getElementById('editPhraseId').value;
      const existing = content.find(item => item.id === contentId);
      if (!existing) { alert('Error: Contenido no encontrado'); return; }
      if (existing.source === 'supabase') {
        alert('Este contenido proviene del panel de creadores y no se puede editar desde aquí.');
        return;
      }
      contentData = {
        text: document.getElementById('editPhraseText').value,
        author: document.getElementById('editPhraseAuthor').value,
        context: document.getElementById('editPhraseContext').value,
        tags: document.getElementById('editPhraseTags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      break;
    }
  }

  const idx = content.findIndex(item => item.id === contentId);
  if (idx !== -1) {
    content[idx] = { ...content[idx], ...contentData, updatedAt: new Date().toISOString() };
    localStorage.setItem('legado_content', JSON.stringify(content));

    e.target.reset();
    document.querySelectorAll('#editContentModal .file-input-label').forEach(label => label.classList.remove('has-file'));
    document.querySelectorAll('#editContentModal .file-name').forEach(el => { el.textContent = ''; });

    if (editContentModal) editContentModal.classList.remove('active');
    loadContent();
    alert('¡Contenido actualizado exitosamente!');
  } else {
    alert('Error: No se pudo encontrar el contenido para editar');
  }
}

function deleteContent(contentId) {
  if (!currentUser) {
    alert('Debes iniciar sesión para eliminar contenido');
    return;
  }

  const contentItem = content.find(item => item.id === contentId);
  if (!contentItem) { alert('Error: Contenido no encontrado'); return; }

  if (contentItem.source === 'supabase') {
    alert('Este contenido proviene del panel de creadores y no se puede eliminar desde aquí.');
    return;
  }

  if (contentItem.userId !== currentUser.id && contentItem.userId !== 'system') {
    alert('Solo puedes eliminar tu propio contenido');
    return;
  }

  if (confirm('¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.')) {
    content = content.filter(item => item.id !== contentId);
    localStorage.setItem('legado_content', JSON.stringify(content));
    loadContent();
    alert('¡Contenido eliminado exitosamente!');
  }
}

function editContent(contentId) {
  if (!currentUser) {
    alert('Debes iniciar sesión para editar contenido');
    return;
  }

  const contentItem = content.find(item => item.id === contentId);
  if (!contentItem) { alert('Error: Contenido no encontrado'); return; }

  if (contentItem.source === 'supabase') {
    alert('Este contenido proviene del panel de creadores. Edítalo desde tu panel.');
    return;
  }

  if (contentItem.userId !== currentUser.id && contentItem.userId !== 'system') {
    alert('Solo puedes editar tu propio contenido');
    return;
  }

  showModal(editContentModal);
  selectContentType(contentItem.type, 'edit');

  switch (contentItem.type) {
    case 'video':
      document.getElementById('editVideoId').value = contentItem.id;
      document.getElementById('editVideoTitle').value = contentItem.title;
      document.getElementById('editVideoDescription').value = contentItem.description;
      document.getElementById('editVideoTags').value = contentItem.tags.join(', ');
      break;
    case 'audio':
      document.getElementById('editAudioId').value = contentItem.id;
      document.getElementById('editAudioTitle').value = contentItem.title;
      document.getElementById('editAudioDescription').value = contentItem.description;
      document.getElementById('editAudioTags').value = contentItem.tags.join(', ');
      break;
    case 'image':
      document.getElementById('editImageId').value = contentItem.id;
      document.getElementById('editImageTitle').value = contentItem.title;
      document.getElementById('editImageDescription').value = contentItem.description;
      document.getElementById('editImageTags').value = contentItem.tags.join(', ');
      break;
    case 'phrase':
      document.getElementById('editPhraseId').value = contentItem.id;
      document.getElementById('editPhraseText').value = contentItem.text;
      document.getElementById('editPhraseAuthor').value = contentItem.author;
      document.getElementById('editPhraseContext').value = contentItem.context;
      document.getElementById('editPhraseTags').value = contentItem.tags.join(', ');
      break;
  }
}

// Seleccionar tipo de contenido (para los formularios de agregar / editar)
function selectContentType(type, mode) {
  const container = mode === 'edit' ? editContentModal : addContentModal;
  if (!container) return;

  const prefix = mode === 'edit' ? 'edit' : '';

  const btns = container.querySelectorAll('.content-type-btn');
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  const forms = container.querySelectorAll('.content-form');
  forms.forEach(form => {
    form.classList.toggle(
      'active',
      form.id === `${prefix}${type.charAt(0).toUpperCase() + type.slice(1)}Form`
    );
  });
}

// Pinta todo el contenido en las secciones
function loadContent() {
  if (!videosGrid || !audiosGrid || !imagesGrid || !phrasesGrid) return;

  videosGrid.innerHTML = '';
  audiosGrid.innerHTML = '';
  imagesGrid.innerHTML = '';
  phrasesGrid.innerHTML = '';

  const sorted = [...content].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sorted.forEach(item => {
    switch (item.type) {
      case 'video': renderVideo(item); break;
      case 'audio': renderAudio(item); break;
      case 'image': renderImage(item); break;
      case 'phrase': renderPhrase(item); break;
    }
  });

  if (!videosGrid.innerHTML) {
    videosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay videos disponibles. ¡Sé el primero en agregar uno!</p>';
  }
  if (!audiosGrid.innerHTML) {
    audiosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay audios disponibles. ¡Sé el primero en agregar uno!</p>';
  }
  if (!imagesGrid.innerHTML) {
    imagesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay imágenes disponibles. ¡Sé el primero en agregar una!</p>';
  }
  if (!phrasesGrid.innerHTML) {
    phrasesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay frases disponibles. ¡Sé el primero en agregar una!</p>';
  }
}

// Render helpers
function renderVideo(item) {
  // 👇 Solo se puede editar/eliminar si es contenido local
  const canEdit = currentUser &&
    item.source !== 'supabase' &&
    (item.userId === currentUser.id || item.userId === 'system');

  const html = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>` : ''}
      <div class="media-box">
        <video controls preload="metadata">
          <source src="${item.url}" type="video/mp4">
          Tu navegador no soporta video.
        </video>
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description || ''}</p>
        <div class="tags">
          ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${(item.userName || 'C').charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName || 'Creador'}</span>
        </div>
      </aside>
    </article>`;
  videosGrid.insertAdjacentHTML('beforeend', html);
}

function renderAudio(item) {
  const canEdit = currentUser &&
    item.source !== 'supabase' &&
    (item.userId === currentUser.id || item.userId === 'system');

  const html = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>` : ''}
      <div class="media-box audio-box">
        <audio controls preload="metadata">
          <source src="${item.url}" type="audio/mpeg">
          Tu navegador no soporta audio.
        </audio>
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description || ''}</p>
        <div class="tags">
          ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${(item.userName || 'C').charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName || 'Creador'}</span>
        </div>
      </aside>
    </article>`;
  audiosGrid.insertAdjacentHTML('beforeend', html);
}

function renderImage(item) {
  const canEdit = currentUser &&
    item.source !== 'supabase' &&
    (item.userId === currentUser.id || item.userId === 'system');

  const html = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>` : ''}
      <div class="media-box">
        <img src="${item.url}" alt="${item.title}">
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description || ''}</p>
        <div class="tags">
          ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${(item.userName || 'C').charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName || 'Creador'}</span>
        </div>
      </aside>
    </article>`;
  imagesGrid.insertAdjacentHTML('beforeend', html);
}

function renderPhrase(item) {
  const canEdit = currentUser &&
    item.source !== 'supabase' &&
    (item.userId === currentUser.id || item.userId === 'system');

  const html = `
    <article class="phrase-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>` : ''}
      <div class="phrase-text">"${item.text || item.description || ''}"</div>
      <div>
        <h3 class="phrase-author">${item.author || item.userName || ''}</h3>
        <p class="phrase-context">${item.context || ''}</p>
        <div class="phrase-tags">
          ${(item.tags || []).map(tag => `<span class="phrase-tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author" style="justify-content:center;margin-top:15px;">
          <div class="author-avatar">${(item.userName || 'C').charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName || 'Creador'}</span>
        </div>
      </div>
    </article>`;
  phrasesGrid.insertAdjacentHTML('beforeend', html);
}

// ========== CARRUSEL + PARALLAX + MURAL LOCAL ==========

document.addEventListener('DOMContentLoaded', function () {
  initApp();

  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  let currentSlide = 0;
  const slideCount = slides.length;
  let interval;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    if (!slides[index]) return;
    slides[index].classList.add('active');
    if (indicators[index]) indicators[index].classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    let next = currentSlide + 1;
    if (next >= slideCount) next = 0;
    showSlide(next);
  }

  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
    });
  });

  if (slideCount > 0) {
    showSlide(0);
    interval = setInterval(nextSlide, 5000);
  }

  const carousel = document.querySelector('.hero-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => {
      clearInterval(interval);
    });

    carousel.addEventListener('mouseleave', () => {
      clearInterval(interval);
      interval = setInterval(nextSlide, 5000);
    });
  }
});

// Parallax, reveal y mural local
(function () {
  window.addEventListener('scroll', () => {
    const sc = window.scrollY;
    const hero = document.getElementById('hero');
    if (hero) {
      hero.style.transform = `translateY(${sc * -0.03}px)`;
    }
  }, { passive: true });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => {
    obs.observe(el);
  });

  const notaInput = document.getElementById('nota');
  const guardarBtn = document.getElementById('guardarNota');
  const notasBox = document.getElementById('notasGuardadas');

  function renderNotas() {
    const items = JSON.parse(localStorage.getItem('legado_notas') || '[]');
    if (!notasBox) return;
    notasBox.innerHTML = items
      .map(n => `<div style="background:#fff;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.04)">${escapeHtml(n)}</div>`)
      .join('');
  }

  if (guardarBtn && notaInput) {
    guardarBtn.addEventListener('click', () => {
      const text = (notaInput.value || '').trim();
      if (!text) return alert('Escribe algo antes de guardar.');
      const items = JSON.parse(localStorage.getItem('legado_notas') || '[]');
      items.unshift(text);
      localStorage.setItem('legado_notas', JSON.stringify(items.slice(0, 50)));
      notaInput.value = '';
      renderNotas();
    });
  }

  renderNotas();

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag]));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
      const hero = document.getElementById('hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth' });
    }
  });
})();
