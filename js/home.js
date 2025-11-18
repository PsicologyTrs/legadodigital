// ========== SISTEMA DE USUARIOS, PAGOS Y CONTENIDO ==========

// Datos iniciales (simulando una base de datos)
let users = JSON.parse(localStorage.getItem('legado_users')) || [];
let content = JSON.parse(localStorage.getItem('legado_content')) || [];
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

// Elementos del DOM
const userInfo = document.getElementById('userInfo');
const authButtons = document.getElementById('authButtons');
const addContentBtn = document.getElementById('addContentBtn');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const creatorBadge = document.getElementById('creatorBadge');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const paymentModal = document.getElementById('paymentModal');
const addContentModal = document.getElementById('addContentModal');
const editContentModal = document.getElementById('editContentModal');
const closeModals = document.querySelectorAll('.close-modal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const userTypes = document.querySelectorAll('.user-type');
const payBtn = document.getElementById('payBtn');
const paymentMessage = document.getElementById('paymentMessage');
const paymentMethods = document.querySelectorAll('.payment-method');

// Grids para mostrar contenido
const videosGrid = document.getElementById('videosGrid');
const audiosGrid = document.getElementById('audiosGrid');
const imagesGrid = document.getElementById('imagesGrid');
const phrasesGrid = document.getElementById('phrasesGrid');

// Variables de estado
let currentUserType = 'consumer';
let currentPaymentMethod = 'card';

// Inicializar la aplicación
function initApp() {
  updateUI();
  loadInitialContent();
  loadContent();
  
  // Event Listeners
  loginBtn.addEventListener('click', () => showModal(loginModal));
  registerBtn.addEventListener('click', () => showModal(registerModal));
  addContentBtn.addEventListener('click', () => {
    if (currentUser && currentUser.isCreator && currentUser.hasPaid) {
      showModal(addContentModal);
    } else {
      alert('Debes ser un creador verificado para agregar contenido. Completa el proceso de pago primero.');
    }
  });
  logoutBtn.addEventListener('click', logout);
  
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
  
  // Formularios
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  
  // Selector de tipo de usuario (registro)
  userTypes.forEach(type => {
    type.addEventListener('click', () => {
      userTypes.forEach(t => t.classList.remove('active'));
      type.classList.add('active');
      currentUserType = type.getAttribute('data-type');
    });
  });
  
  // Selector de tipo de contenido (agregar)
  document.querySelectorAll('.content-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      selectContentType(type, 'add');
    });
  });
  
  // Selector de tipo de contenido (editar)
  document.querySelectorAll('#editTypeSelector .content-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      selectContentType(type, 'edit');
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
  
  // Pago
  payBtn.addEventListener('click', handlePayment);
  
  // Formularios de contenido (agregar)
  document.getElementById('videoForm').addEventListener('submit', (e) => handleAddContent(e, 'video'));
  document.getElementById('audioForm').addEventListener('submit', (e) => handleAddContent(e, 'audio'));
  document.getElementById('imageForm').addEventListener('submit', (e) => handleAddContent(e, 'image'));
  document.getElementById('phraseForm').addEventListener('submit', (e) => handleAddContent(e, 'phrase'));
  
  // Formularios de edición
  document.getElementById('editVideoForm').addEventListener('submit', (e) => handleEditContent(e, 'video'));
  document.getElementById('editAudioForm').addEventListener('submit', (e) => handleEditContent(e, 'audio'));
  document.getElementById('editImageForm').addEventListener('submit', (e) => handleEditContent(e, 'image'));
  document.getElementById('editPhraseForm').addEventListener('submit', (e) => handleEditContent(e, 'phrase'));
  
  // Manejar archivos seleccionados
  setupFileInputs();
}

// Configurar inputs de archivo
function setupFileInputs() {
  // Video
  const videoFileInput = document.getElementById('videoFile');
  const videoFileLabel = document.getElementById('videoFileLabel');
  const videoFileName = document.getElementById('videoFileName');
  
  videoFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      videoFileLabel.classList.add('has-file');
      videoFileName.textContent = this.files[0].name;
    } else {
      videoFileLabel.classList.remove('has-file');
      videoFileName.textContent = '';
    }
  });
  
  // Audio
  const audioFileInput = document.getElementById('audioFile');
  const audioFileLabel = document.getElementById('audioFileLabel');
  const audioFileName = document.getElementById('audioFileName');
  
  audioFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      audioFileLabel.classList.add('has-file');
      audioFileName.textContent = this.files[0].name;
    } else {
      audioFileLabel.classList.remove('has-file');
      audioFileName.textContent = '';
    }
  });
  
  // Imagen
  const imageFileInput = document.getElementById('imageFile');
  const imageFileLabel = document.getElementById('imageFileLabel');
  const imageFileName = document.getElementById('imageFileName');
  
  imageFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      imageFileLabel.classList.add('has-file');
      imageFileName.textContent = this.files[0].name;
    } else {
      imageFileLabel.classList.remove('has-file');
      imageFileName.textContent = '';
    }
  });
  
  // Editar Video
  const editVideoFileInput = document.getElementById('editVideoFile');
  const editVideoFileLabel = document.getElementById('editVideoFileLabel');
  const editVideoFileName = document.getElementById('editVideoFileName');
  
  editVideoFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      editVideoFileLabel.classList.add('has-file');
      editVideoFileName.textContent = this.files[0].name;
    } else {
      editVideoFileLabel.classList.remove('has-file');
      editVideoFileName.textContent = '';
    }
  });
  
  // Editar Audio
  const editAudioFileInput = document.getElementById('editAudioFile');
  const editAudioFileLabel = document.getElementById('editAudioFileLabel');
  const editAudioFileName = document.getElementById('editAudioFileName');
  
  editAudioFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      editAudioFileLabel.classList.add('has-file');
      editAudioFileName.textContent = this.files[0].name;
    } else {
      editAudioFileLabel.classList.remove('has-file');
      editAudioFileName.textContent = '';
    }
  });
  
  // Editar Imagen
  const editImageFileInput = document.getElementById('editImageFile');
  const editImageFileLabel = document.getElementById('editImageFileLabel');
  const editImageFileName = document.getElementById('editImageFileName');
  
  editImageFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      editImageFileLabel.classList.add('has-file');
      editImageFileName.textContent = this.files[0].name;
    } else {
      editImageFileLabel.classList.remove('has-file');
      editImageFileName.textContent = '';
    }
  });
}

// Cargar contenido inicial con tus archivos locales
function loadInitialContent() {
  // Si no hay contenido guardado, cargar el contenido inicial
  if (content.length === 0) {
    content = [
      // Videos iniciales con tus rutas originales
      {
        id: '1',
        type: 'video',
        title: 'Entrevista: Memoria del barrio',
        url: 'media/video1.mp4',
        description: 'Entrevista con habitantes sobre prácticas tradicionales. Año: 2024. Duración: 12:34.',
        tags: ['Video', 'Oral History', 'Región: Andina'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
      },
      
      // Audios iniciales con tus rutas originales
      {
        id: '3',
        type: 'audio',
        title: 'Relato: Canto de los oficios',
        url: 'media/podcast-prostitucion.mpeg',
        description: 'Registro de canto ritual. Contexto histórico y transcripción breve. Duración: 8:45.',
        tags: ['Audio', 'Tradición oral', 'Canto'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
      },
      
      // Imágenes iniciales con tus rutas originales
      {
        id: '5',
        type: 'image',
        title: 'Fotografía: Plaza central',
        url: 'media/img1.jfif',
        description: 'Fotografía histórica de la plaza principal y su función comunitaria. Año: 1950. Autor: Fotógrafo local.',
        tags: ['Foto', 'Espacio público', 'Histórico'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
      },
      
      // Frases iniciales
      {
        id: '10',
        type: 'phrase',
        text: "Santa Marta, tierra de sueños\nSanta Marta, tierra de sueños,\ncuna de historias y aventuras,\ntu brisa guarda secretos guardados,\ntu mar susurra canciones de gritos.\nLa historia enriquece nuestra vida,\ntus calles guardan huellas sagradas,\nrecuerdos de luchas y victorias,\nde un pasado que nunca se apaga.\nTus montañas besan el cielo,\ntu arena acaricia los pies cansados,\ny en cada rincón florece la vida,\ncomo un tesoro jamás olvidado.\nSanta Marta, puerto de anhelos,\nespejo de culturas que se abrazan,\neres raíz, presente y futuro,\nuna tierra que sueña y nunca se cansa.\n_ Wendy Gómez O.",
        author: 'Wendy Gómez O.',
        context: 'Poema dedicado a Santa Marta, resaltando su belleza natural y riqueza cultural.',
        tags: ['Poesía', 'Santa Marta', 'Naturaleza'],
        userId: 'system',
        userName: 'Sistema',
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('legado_content', JSON.stringify(content));
  }
}

// Actualizar la interfaz según el estado del usuario
function updateUI() {
  if (currentUser) {
    userInfo.style.display = 'flex';
    authButtons.style.display = 'none';
    
    // Mostrar botón de agregar contenido solo para creadores verificados
    if (currentUser.isCreator && currentUser.hasPaid) {
      addContentBtn.style.display = 'flex';
      creatorBadge.style.display = 'inline-block';
    } else {
      addContentBtn.style.display = 'none';
      creatorBadge.style.display = 'none';
    }
    
    userName.textContent = currentUser.name;
    userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
  } else {
    userInfo.style.display = 'none';
    authButtons.style.display = 'flex';
    addContentBtn.style.display = 'none';
    creatorBadge.style.display = 'none';
  }
}

// Mostrar modal
function showModal(modal) {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  modal.classList.add('active');
}

// Seleccionar tipo de contenido
function selectContentType(type, mode) {
  const prefix = mode === 'edit' ? 'edit' : '';
  const container = mode === 'edit' ? editContentModal : addContentModal;
  
  // Actualizar botones
  const btns = container.querySelectorAll('.content-type-btn');
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  // Actualizar formularios
  const forms = container.querySelectorAll('.content-form');
  forms.forEach(form => {
    form.classList.toggle('active', form.id === `${prefix}${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
  });
}

// Manejar inicio de sesión
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    currentUser = user;
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
    updateUI();
    loginModal.classList.remove('active');
    loginForm.reset();
    loadContent(); // Recargar contenido para mostrar botones de edición
    alert('¡Inicio de sesión exitoso!');
  } else {
    alert('Correo electrónico o contraseña incorrectos');
  }
}

// Manejar registro
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  // Verificar si el usuario ya existe
  if (users.find(u => u.email === email)) {
    alert('Este correo electrónico ya está registrado');
    return;
  }
  
  const isCreator = currentUserType === 'creator';
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    isCreator: isCreator,
    hasPaid: !isCreator, // Los consumidores no necesitan pagar, los creadores sí
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem('legado_users', JSON.stringify(users));
  
  currentUser = newUser;
  localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
  
  updateUI();
  registerModal.classList.remove('active');
  registerForm.reset();
  
  if (isCreator && !newUser.hasPaid) {
    // Si es creador y no ha pagado, mostrar modal de pago
    showModal(paymentModal);
  } else {
    alert('¡Registro exitoso!');
    loadContent(); // Recargar contenido para mostrar botones de edición
  }
}

// Manejar pago
function handlePayment() {
  // Validación básica
  if (currentPaymentMethod === 'card') {
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      showPaymentMessage('Por favor completa todos los campos de la tarjeta', 'error');
      return;
    }
  }
  
  // Simulación de procesamiento de pago
  showPaymentMessage('Procesando pago...', 'info');
  
  setTimeout(() => {
    // Simulación de pago exitoso
    showPaymentMessage('¡Pago exitoso! Ahora tienes acceso completo a las herramientas de creador.', 'success');
    
    // Actualizar usuario
    currentUser.hasPaid = true;
    localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
    
    // Actualizar en la lista de usuarios
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
      localStorage.setItem('legado_users', JSON.stringify(users));
    }
    
    // Actualizar UI
    updateUI();
    
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      paymentModal.classList.remove('active');
      loadContent(); // Recargar contenido para mostrar botones de edición
    }, 2000);
  }, 2000);
}

// Mostrar mensaje de pago
function showPaymentMessage(message, type) {
  paymentMessage.textContent = message;
  paymentMessage.className = `payment-message ${type}`;
  paymentMessage.style.display = 'block';
}

// Cerrar sesión
function logout() {
  currentUser = null;
  localStorage.removeItem('legado_currentUser');
  updateUI();
  loadContent(); // Recargar contenido para ocultar botones de edición
  alert('Sesión cerrada');
}

// Manejar agregar contenido
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
        tags: document.getElementById('videoTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
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
        tags: document.getElementById('audioTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
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
        tags: document.getElementById('imageTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
    }
      
    case 'phrase':
      contentData = {
        text: document.getElementById('phraseText').value,
        author: document.getElementById('phraseAuthor').value,
        context: document.getElementById('phraseContext').value,
        tags: document.getElementById('phraseTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
  }
  
  const newContent = {
    id: Date.now().toString(),
    type,
    ...contentData,
    userId: currentUser.id,
    userName: currentUser.name,
    createdAt: new Date().toISOString()
  };
  
  content.push(newContent);
  localStorage.setItem('legado_content', JSON.stringify(content));
  
  // Limpiar formulario
  e.target.reset();
  document.querySelectorAll('.file-input-label').forEach(label => {
    label.classList.remove('has-file');
  });
  document.querySelectorAll('.file-name').forEach(el => {
    el.textContent = '';
  });
  
  addContentModal.classList.remove('active');
  
  // Recargar contenido
  loadContent();
  
  alert('¡Contenido agregado exitosamente!');
}

// Manejar edición de contenido
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
      
      const existingVideo = content.find(item => item.id === contentId);
      if (!existingVideo) {
        alert('Error: Contenido no encontrado');
        return;
      }
      
      const videoUrl = videoFile ? URL.createObjectURL(videoFile) : existingVideo.url;
      
      contentData = {
        title: document.getElementById('editVideoTitle').value,
        url: videoUrl,
        description: document.getElementById('editVideoDescription').value,
        tags: document.getElementById('editVideoTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
    }
      
    case 'audio': {
      contentId = document.getElementById('editAudioId').value;
      const audioFile = document.getElementById('editAudioFile').files[0];
      
      const existingAudio = content.find(item => item.id === contentId);
      if (!existingAudio) {
        alert('Error: Contenido no encontrado');
        return;
      }
      
      const audioUrl = audioFile ? URL.createObjectURL(audioFile) : existingAudio.url;
      
      contentData = {
        title: document.getElementById('editAudioTitle').value,
        url: audioUrl,
        description: document.getElementById('editAudioDescription').value,
        tags: document.getElementById('editAudioTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
    }
      
    case 'image': {
      contentId = document.getElementById('editImageId').value;
      const imageFile = document.getElementById('editImageFile').files[0];
      
      const existingImage = content.find(item => item.id === contentId);
      if (!existingImage) {
        alert('Error: Contenido no encontrado');
        return;
      }
      
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : existingImage.url;
      
      contentData = {
        title: document.getElementById('editImageTitle').value,
        url: imageUrl,
        description: document.getElementById('editImageDescription').value,
        tags: document.getElementById('editImageTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
    }
      
    case 'phrase': {
      contentId = document.getElementById('editPhraseId').value;
      
      const existingPhrase = content.find(item => item.id === contentId);
      if (!existingPhrase) {
        alert('Error: Contenido no encontrado');
        return;
      }
      
      contentData = {
        text: document.getElementById('editPhraseText').value,
        author: document.getElementById('editPhraseAuthor').value,
        context: document.getElementById('editPhraseContext').value,
        tags: document.getElementById('editPhraseTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      break;
    }
  }
  
  // Actualizar el contenido
  const contentIndex = content.findIndex(item => item.id === contentId);
  if (contentIndex !== -1) {
    content[contentIndex] = {
      ...content[contentIndex],
      ...contentData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('legado_content', JSON.stringify(content));
    
    // Limpiar formulario
    e.target.reset();
    document.querySelectorAll('#editContentModal .file-input-label').forEach(label => {
      label.classList.remove('has-file');
    });
    document.querySelectorAll('#editContentModal .file-name').forEach(el => {
      el.textContent = '';
    });
    
    editContentModal.classList.remove('active');
    
    // Recargar contenido
    loadContent();
    
    alert('¡Contenido actualizado exitosamente!');
  } else {
    alert('Error: No se pudo encontrar el contenido para editar');
  }
}

// Eliminar contenido
function deleteContent(contentId) {
  if (!currentUser) {
    alert('Debes iniciar sesión para eliminar contenido');
    return;
  }
  
  const contentItem = content.find(item => item.id === contentId);
  if (!contentItem) {
    alert('Error: Contenido no encontrado');
    return;
  }
  
  // Verificar que el usuario es el propietario del contenido
  if (contentItem.userId !== currentUser.id && contentItem.userId !== 'system') {
    alert('Solo puedes eliminar tu propio contenido');
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.')) {
    content = content.filter(item => item.id !== contentId);
    localStorage.setItem('legado_content', JSON.stringify(content));
    
    // Recargar contenido
    loadContent();
    
    alert('¡Contenido eliminado exitosamente!');
  }
}

// Editar contenido
function editContent(contentId) {
  if (!currentUser) {
    alert('Debes iniciar sesión para editar contenido');
    return;
  }
  
  const contentItem = content.find(item => item.id === contentId);
  if (!contentItem) {
    alert('Error: Contenido no encontrado');
    return;
  }
  
  // Verificar que el usuario es el propietario del contenido
  if (contentItem.userId !== currentUser.id && contentItem.userId !== 'system') {
    alert('Solo puedes editar tu propio contenido');
    return;
  }
  
  // Mostrar el modal de edición
  showModal(editContentModal);
  
  // Seleccionar el tipo de contenido correcto
  selectContentType(contentItem.type, 'edit');
  
  // Rellenar el formulario con los datos existentes
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

// Cargar y mostrar contenido
function loadContent() {
  // Limpiar grids
  videosGrid.innerHTML = '';
  audiosGrid.innerHTML = '';
  imagesGrid.innerHTML = '';
  phrasesGrid.innerHTML = '';
  
  // Ordenar contenido por fecha (más reciente primero)
  const sortedContent = [...content].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  sortedContent.forEach(item => {
    switch (item.type) {
      case 'video':
        renderVideo(item);
        break;
      case 'audio':
        renderAudio(item);
        break;
      case 'image':
        renderImage(item);
        break;
      case 'phrase':
        renderPhrase(item);
        break;
    }
  });
  
  // Si no hay contenido, mostrar mensaje
  if (videosGrid.innerHTML === '') {
    videosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay videos disponibles. ¡Sé el primero en agregar uno!</p>';
  }
  if (audiosGrid.innerHTML === '') {
    audiosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay audios disponibles. ¡Sé el primero en agregar uno!</p>';
  }
  if (imagesGrid.innerHTML === '') {
    imagesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay imágenes disponibles. ¡Sé el primero en agregar una!</p>';
  }
  if (phrasesGrid.innerHTML === '') {
    phrasesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">No hay frases disponibles. ¡Sé el primero en agregar una!</p>';
  }
}

// Renderizar video
function renderVideo(item) {
  const canEdit = currentUser && (item.userId === currentUser.id || item.userId === 'system');
  
  const videoHTML = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
      <div class="media-box">
        <video controls preload="metadata">
          <source src="${item.url}" type="video/mp4">
          Tu navegador no soporta video.
        </video>
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description}</p>
        <div class="tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${item.userName.charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName}</span>
        </div>
      </aside>
    </article>
  `;
  videosGrid.insertAdjacentHTML('beforeend', videoHTML);
}

// Renderizar audio
function renderAudio(item) {
  const canEdit = currentUser && (item.userId === currentUser.id || item.userId === 'system');
  
  const audioHTML = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
      <div class="media-box audio-box">
        <audio controls preload="metadata">
          <source src="${item.url}" type="audio/mpeg">
          Tu navegador no soporta audio.
        </audio>
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description}</p>
        <div class="tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${item.userName.charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName}</span>
        </div>
      </aside>
    </article>
  `;
  audiosGrid.insertAdjacentHTML('beforeend', audioHTML);
}

// Renderizar imagen
function renderImage(item) {
  const canEdit = currentUser && (item.userId === currentUser.id || item.userId === 'system');
  
  const imageHTML = `
    <article class="content-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
      <div class="media-box">
        <img src="${item.url}" alt="${item.title}">
      </div>
      <aside class="meta">
        <h3>${item.title}</h3>
        <p class="desc">${item.description}</p>
        <div class="tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author">
          <div class="author-avatar">${item.userName.charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName}</span>
        </div>
      </aside>
    </article>
  `;
  imagesGrid.insertAdjacentHTML('beforeend', imageHTML);
}

// Renderizar frase
function renderPhrase(item) {
  const canEdit = currentUser && (item.userId === currentUser.id || item.userId === 'system');
  
  const phraseHTML = `
    <article class="phrase-item">
      ${canEdit ? `
        <div class="content-actions">
          <button class="action-btn edit-btn" onclick="editContent('${item.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteContent('${item.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
      <div class="phrase-text">"${item.text}"</div>
      <div>
        <h3 class="phrase-author">${item.author}</h3>
        <p class="phrase-context">${item.context}</p>
        <div class="phrase-tags">
          ${item.tags.map(tag => `<span class="phrase-tag">${tag}</span>`).join('')}
        </div>
        <div class="content-author" style="justify-content:center;margin-top:15px;">
          <div class="author-avatar">${item.userName.charAt(0).toUpperCase()}</div>
          <span class="author-name">Publicado por ${item.userName}</span>
        </div>
      </div>
    </article>
  `;
  phrasesGrid.insertAdjacentHTML('beforeend', phraseHTML);
}

// ========== SCRIPT DEL CARRUSEL ==========

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar la aplicación
  initApp();
  
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  let currentSlide = 0;
  const slideCount = slides.length;
  let interval;
  
  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
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
  
  // Iniciar carrusel
  showSlide(0);
  interval = setInterval(nextSlide, 5000);
  
  // Pausar al hacer hover
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

// Pequeño módulo para parallax, reveal y mural local
(function(){
  // parallax effect on scroll
  window.addEventListener('scroll', ()=>{
    const sc = window.scrollY;
    const hero = document.getElementById('hero');
    if (hero) {
      hero.style.transform = `translateY(${sc * -0.03}px)`;
    }
  }, {passive:true});

  // IntersectionObserver reveal
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('show');
    });
  }, {threshold:0.12});

  document.querySelectorAll('.reveal').forEach(el=>{
    obs.observe(el);
  });

  // local notes (simple mural)
  const notaInput = document.getElementById('nota');
  const guardarBtn = document.getElementById('guardarNota');
  const notasBox = document.getElementById('notasGuardadas');

  function renderNotas(){
    const items = JSON.parse(localStorage.getItem('legado_notas') || '[]');
    notasBox.innerHTML = items
      .map(n => `<div style="background:#fff;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.04)">${escapeHtml(n)}</div>`)
      .join('');
  }

  guardarBtn.addEventListener('click', ()=>{
    const text = (notaInput.value || '').trim();
    if(!text) return alert('Escribe algo antes de guardar.');
    const items = JSON.parse(localStorage.getItem('legado_notas') || '[]');
    items.unshift(text);
    localStorage.setItem('legado_notas', JSON.stringify(items.slice(0,50)));
    notaInput.value = '';
    renderNotas();
  });

  renderNotas();

  // helper to avoid XSS en innerHTML
  function escapeHtml(str){
    return str.replace(/[&<>'"]/g, tag => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[tag]));
  }

  // keyboard hint: press "H" to focus hero (accessibility)
  window.addEventListener('keydown',(e)=>{
    if(e.key.toLowerCase()==='h'){
      const hero = document.getElementById('hero');
      if (hero) hero.scrollIntoView({behavior:'smooth'});
    }
  });
})();
