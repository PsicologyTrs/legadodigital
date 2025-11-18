// Dashboard del Creador - dashboard.js

// Elementos del DOM
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const contentGrid = document.getElementById('contentGrid');
const contentFilter = document.getElementById('contentFilter');
const addVideoBtn = document.getElementById('addVideoBtn');
const addAudioBtn = document.getElementById('addAudioBtn');
const addImageBtn = document.getElementById('addImageBtn');
const addPhraseBtn = document.getElementById('addPhraseBtn');
const contentModal = document.getElementById('contentModal');
const contentForm = document.getElementById('contentForm');
const cancelContent = document.getElementById('cancelContent');
const closeModal = document.querySelector('.close-modal');

// Variables de estado
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;
let userContent = JSON.parse(localStorage.getItem('legado_content')) || [];
let currentEditingId = null;

// Inicializar el dashboard
function initDashboard() {
    if (!currentUser || !currentUser.isCreator || !currentUser.hasPaid) {
        // Si no es un creador verificado, redirigir al login
        window.location.href = 'login.html';
        return;
    }

    updateUserInfo();
    setupEventListeners();
    loadUserContent();
    updateStats();
}

// Actualizar información del usuario
function updateUserInfo() {
    if (currentUser) {
        userName.textContent = currentUser.name;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

// Configurar event listeners
function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    contentFilter.addEventListener('change', filterContent);
    
    // Botones de agregar contenido
    addVideoBtn.addEventListener('click', () => showContentModal('video'));
    addAudioBtn.addEventListener('click', () => showContentModal('audio'));
    addImageBtn.addEventListener('click', () => showContentModal('image'));
    addPhraseBtn.addEventListener('click', () => showContentModal('phrase'));
    
    // Modal
    cancelContent.addEventListener('click', hideContentModal);
    closeModal.addEventListener('click', hideContentModal);
    contentModal.addEventListener('click', (e) => {
        if (e.target === contentModal) hideContentModal();
    });
    
    // Formulario
    contentForm.addEventListener('submit', handleContentSubmit);
    
    // Input de archivo
    document.getElementById('contentFile').addEventListener('change', handleFileSelect);
}

// Cargar contenido del usuario
function loadUserContent() {
    const userContentItems = userContent.filter(item => item.userId === currentUser.id);
    displayContent(userContentItems);
}

// Filtrar contenido
function filterContent() {
    const filter = contentFilter.value;
    let filteredContent = userContent.filter(item => item.userId === currentUser.id);
    
    if (filter !== 'all') {
        filteredContent = filteredContent.filter(item => item.type === filter);
    }
    
    displayContent(filteredContent);
}

// Mostrar contenido en la grid
function displayContent(contentItems) {
    contentGrid.innerHTML = '';
    
    if (contentItems.length === 0) {
        contentGrid.innerHTML = `
            <div class="no-content">
                <i class="fas fa-inbox" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3>No hay contenido</h3>
                <p>Comienza agregando tu primer contenido usando los botones de arriba.</p>
            </div>
        `;
        return;
    }
    
    contentItems.forEach(item => {
        const contentCard = createContentCard(item);
        contentGrid.appendChild(contentCard);
    });
}

// Crear tarjeta de contenido
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    let mediaHTML = '';
    let description = item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description;
    
    switch (item.type) {
        case 'video':
            mediaHTML = `
                <div class="content-media">
                    <video controls>
                        <source src="${item.url}" type="video/mp4">
                        Tu navegador no soporta video.
                    </video>
                </div>
            `;
            break;
        case 'audio':
            mediaHTML = `
                <div class="content-media audio">
                    <i class="fas fa-music"></i>
                </div>
            `;
            break;
        case 'image':
            mediaHTML = `
                <div class="content-media">
                    <img src="${item.url}" alt="${item.title}">
                </div>
            `;
            break;
        case 'phrase':
            mediaHTML = `
                <div class="content-media phrase">
                    <i class="fas fa-quote-left"></i>
                </div>
            `;
            break;
    }
    
    card.innerHTML = `
        ${mediaHTML}
        <div class="content-info">
            <div class="content-title">${item.title}</div>
            <div class="content-description">${description}</div>
            <div class="content-tags">
                ${item.tags.map(tag => `<span class="content-tag">${tag}</span>`).join('')}
            </div>
            <div class="content-actions">
                <button class="content-action-btn btn-edit" onclick="editContent('${item.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="content-action-btn btn-delete" onclick="deleteContent('${item.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Actualizar estadísticas
function updateStats() {
    const userContentItems = userContent.filter(item => item.userId === currentUser.id);
    
    document.getElementById('totalContent').textContent = userContentItems.length;
    document.getElementById('totalVideos').textContent = userContentItems.filter(item => item.type === 'video').length;
    document.getElementById('totalAudios').textContent = userContentItems.filter(item => item.type === 'audio').length;
    document.getElementById('totalImages').textContent = userContentItems.filter(item => item.type === 'image').length;
}

// Mostrar modal de contenido
function showContentModal(type, contentId = null) {
    currentEditingId = contentId;
    
    // Configurar el modal según el tipo
    document.getElementById('contentType').value = type;
    document.getElementById('modalTitle').textContent = contentId ? 'Editar Contenido' : `Agregar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Mostrar/ocultar campos según el tipo
    const fileInputGroup = document.getElementById('fileInputGroup');
    const phraseFields = document.getElementById('phraseFields');
    
    if (type === 'phrase') {
        fileInputGroup.style.display = 'none';
        phraseFields.style.display = 'block';
    } else {
        fileInputGroup.style.display = 'block';
        phraseFields.style.display = 'none';
        
        // Actualizar el label del archivo
        const fileInputLabel = document.getElementById('fileInputLabel');
        const accept = type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/*';
        const text = type === 'video' ? 'Seleccionar video MP4' : type === 'audio' ? 'Seleccionar audio MP3' : 'Seleccionar imagen';
        
        document.getElementById('contentFile').setAttribute('accept', accept);
        fileInputLabel.querySelector('span').textContent = text;
    }
    
    // Si estamos editando, cargar los datos
    if (contentId) {
        const content = userContent.find(item => item.id === contentId);
        if (content) {
            document.getElementById('contentTitle').value = content.title;
            document.getElementById('contentDescription').value = content.description;
            document.getElementById('contentTags').value = content.tags.join(', ');
            
            if (type === 'phrase') {
                document.getElementById('contentAuthor').value = content.author || '';
            }
        }
    } else {
        // Limpiar el formulario
        contentForm.reset();
        document.getElementById('fileName').textContent = '';
        document.getElementById('fileInputLabel').classList.remove('has-file');
    }
    
    contentModal.classList.add('active');
}

// Ocultar modal de contenido
function hideContentModal() {
    contentModal.classList.remove('active');
    currentEditingId = null;
}

// Manejar selección de archivo
function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileName = document.getElementById('fileName');
    const fileInputLabel = document.getElementById('fileInputLabel');
    
    if (file) {
        fileName.textContent = file.name;
        fileInputLabel.classList.add('has-file');
    } else {
        fileName.textContent = '';
        fileInputLabel.classList.remove('has-file');
    }
}

// Manejar envío del formulario de contenido
function handleContentSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('contentType').value;
    const title = document.getElementById('contentTitle').value;
    const description = document.getElementById('contentDescription').value;
    const tags = document.getElementById('contentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const file = document.getElementById('contentFile').files[0];
    
    if (!title || !description) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    if (type !== 'phrase' && !file && !currentEditingId) {
        alert('Por favor selecciona un archivo');
        return;
    }
    
    let contentData = {
        title,
        description,
        tags,
        type
    };
    
    if (type === 'phrase') {
        const author = document.getElementById('contentAuthor').value;
        if (!author) {
            alert('Por favor ingresa el autor de la frase');
            return;
        }
        contentData.author = author;
        contentData.text = description; // Para frases, el texto es la descripción
    }
    
    if (currentEditingId) {
        // Editar contenido existente
        updateContent(currentEditingId, contentData, file);
    } else {
        // Crear nuevo contenido
        createContent(contentData, file);
    }
}

// Crear nuevo contenido
function createContent(contentData, file) {
    let url = '';
    
    if (file) {
        // En un entorno real, aquí subirías el archivo a un servidor
        // Por ahora, usamos una URL local
        url = URL.createObjectURL(file);
    }
    
    const newContent = {
        id: Date.now().toString(),
        ...contentData,
        url,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString()
    };
    
    userContent.push(newContent);
    localStorage.setItem('legado_content', JSON.stringify(userContent));
    
    hideContentModal();
    loadUserContent();
    updateStats();
    
    alert('¡Contenido agregado exitosamente!');
}

// Actualizar contenido existente
function updateContent(contentId, contentData, file) {
    const contentIndex = userContent.findIndex(item => item.id === contentId);
    
    if (contentIndex !== -1) {
        let url = userContent[contentIndex].url;
        
        if (file) {
            // En un entorno real, aquí subirías el nuevo archivo
            url = URL.createObjectURL(file);
        }
        
        userContent[contentIndex] = {
            ...userContent[contentIndex],
            ...contentData,
            url,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('legado_content', JSON.stringify(userContent));
        
        hideContentModal();
        loadUserContent();
        updateStats();
        
        alert('¡Contenido actualizado exitosamente!');
    }
}

// Editar contenido
function editContent(contentId) {
    const content = userContent.find(item => item.id === contentId);
    if (content) {
        showContentModal(content.type, contentId);
    }
}

// Eliminar contenido
function deleteContent(contentId) {
    if (confirm('¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.')) {
        userContent = userContent.filter(item => item.id !== contentId);
        localStorage.setItem('legado_content', JSON.stringify(userContent));
        
        loadUserContent();
        updateStats();
        
        alert('¡Contenido eliminado exitosamente!');
    }
}

// Cerrar sesión
function handleLogout() {
    localStorage.removeItem('legado_currentUser');
    window.location.href = 'index.html';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initDashboard);