// Dashboard del Creador - dashboard.js
'use strict';

// ====================== ELEMENTOS DEL DOM ======================

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

// Campos del formulario de contenido
const contentTypeInput = document.getElementById('contentType');
const contentTitleInput = document.getElementById('contentTitle');
const contentDescriptionInput = document.getElementById('contentDescription');
const contentTagsInput = document.getElementById('contentTags');
const contentAuthorInput = document.getElementById('contentAuthor');
const contentFileInput = document.getElementById('contentFile');
const fileInputLabel = document.getElementById('fileInputLabel');
const fileNameSpan = document.getElementById('fileName');
const phraseFields = document.getElementById('phraseFields');
const fileInputGroup = document.getElementById('fileInputGroup');
const modalTitle = document.getElementById('modalTitle');

// ====================== ESTADO ======================

let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;
let userContent = JSON.parse(localStorage.getItem('legado_content')) || [];
let currentEditingId = null;

// ====================== INICIALIZACIÓN ======================

function initDashboard() {
    const isCreatorUser =
        currentUser &&
        (currentUser.type === 'creator' || currentUser.isCreator === true) &&
        currentUser.hasPaid;

    if (!isCreatorUser) {
        // Si no es un creador verificado, redirigir al login
        window.location.href = 'login.html';
        return;
    }

    updateUserInfo();
    setupEventListeners();
    loadUserContent();
    updateStats();
}

// ====================== UI USUARIO ======================

function updateUserInfo() {
    if (!currentUser) return;
    if (userName) userName.textContent = currentUser.name;
    if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
}

// ====================== EVENT LISTENERS ======================

function setupEventListeners() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (contentFilter) {
        contentFilter.addEventListener('change', filterContent);
    }

    if (addVideoBtn) addVideoBtn.addEventListener('click', () => showContentModal('video'));
    if (addAudioBtn) addAudioBtn.addEventListener('click', () => showContentModal('audio'));
    if (addImageBtn) addImageBtn.addEventListener('click', () => showContentModal('image'));
    if (addPhraseBtn) addPhraseBtn.addEventListener('click', () => showContentModal('phrase'));

    if (cancelContent) cancelContent.addEventListener('click', hideContentModal);
    if (closeModal) closeModal.addEventListener('click', hideContentModal);

    if (contentModal) {
        contentModal.addEventListener('click', (e) => {
            if (e.target === contentModal) hideContentModal();
        });
    }

    if (contentForm) {
        contentForm.addEventListener('submit', handleContentSubmit);
    }

    if (contentFileInput) {
        contentFileInput.addEventListener('change', handleFileSelect);
    }
}

// ====================== CARGA Y FILTRO DE CONTENIDO ======================

function loadUserContent() {
    if (!currentUser) return;
    const userContentItems = userContent.filter((item) => item.userId === currentUser.id);
    displayContent(userContentItems);
}

function filterContent() {
    if (!currentUser || !contentFilter) return;

    const filter = contentFilter.value;
    let filteredContent = userContent.filter((item) => item.userId === currentUser.id);

    if (filter !== 'all') {
        filteredContent = filteredContent.filter((item) => item.type === filter);
    }

    displayContent(filteredContent);
}

// ====================== RENDERIZADO DE CONTENIDO ======================

function displayContent(contentItems) {
    if (!contentGrid) return;

    contentGrid.innerHTML = '';

    if (!contentItems || contentItems.length === 0) {
        contentGrid.innerHTML = `
            <div class="no-content">
                <i class="fas fa-inbox" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3>No hay contenido</h3>
                <p>Comienza agregando tu primer contenido usando los botones de arriba.</p>
            </div>
        `;
        return;
    }

    contentItems.forEach((item) => {
        const contentCard = createContentCard(item);
        contentGrid.appendChild(contentCard);
    });
}

function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';

    let mediaHTML = '';
    const description =
        item.description && item.description.length > 100
            ? `${item.description.substring(0, 100)}...`
            : item.description || '';

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
        default:
            mediaHTML = '';
            break;
    }

    const tagsHTML = (item.tags || [])
        .map((tag) => `<span class="content-tag">${tag}</span>`)
        .join('');

    card.innerHTML = `
        ${mediaHTML}
        <div class="content-info">
            <div class="content-title">${item.title || ''}</div>
            <div class="content-description">${description || ''}</div>
            <div class="content-tags">
                ${tagsHTML}
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

// ====================== ESTADÍSTICAS ======================

function updateStats() {
    if (!currentUser) return;

    const userContentItems = userContent.filter((item) => item.userId === currentUser.id);

    const totalContentEl = document.getElementById('totalContent');
    const totalVideosEl = document.getElementById('totalVideos');
    const totalAudiosEl = document.getElementById('totalAudios');
    const totalImagesEl = document.getElementById('totalImages');

    if (totalContentEl) totalContentEl.textContent = userContentItems.length;
    if (totalVideosEl) totalVideosEl.textContent = userContentItems.filter((i) => i.type === 'video').length;
    if (totalAudiosEl) totalAudiosEl.textContent = userContentItems.filter((i) => i.type === 'audio').length;
    if (totalImagesEl) totalImagesEl.textContent = userContentItems.filter((i) => i.type === 'image').length;
}

// ====================== MODAL DE CONTENIDO ======================

function showContentModal(type, contentId = null) {
    currentEditingId = contentId;

    if (contentTypeInput) contentTypeInput.value = type;
    if (modalTitle) {
        modalTitle.textContent = contentId
            ? 'Editar Contenido'
            : `Agregar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }

    if (type === 'phrase') {
        if (fileInputGroup) fileInputGroup.style.display = 'none';
        if (phraseFields) phraseFields.style.display = 'block';
    } else {
        if (fileInputGroup) fileInputGroup.style.display = 'block';
        if (phraseFields) phraseFields.style.display = 'none';

        const accept =
            type === 'video' ? 'video/mp4' :
            type === 'audio' ? 'audio/mpeg' :
            'image/*';

        const labelText =
            type === 'video' ? 'Seleccionar video MP4' :
            type === 'audio' ? 'Seleccionar audio MP3' :
            'Seleccionar imagen';

        if (contentFileInput) contentFileInput.setAttribute('accept', accept);
        if (fileInputLabel) {
            const span = fileInputLabel.querySelector('span');
            if (span) span.textContent = labelText;
        }
    }

    // Cargar datos si estamos editando
    if (contentId) {
        const item = userContent.find((c) => c.id === contentId);
        if (item) {
            if (contentTitleInput) contentTitleInput.value = item.title || '';
            if (contentDescriptionInput) contentDescriptionInput.value = item.description || '';
            if (contentTagsInput) contentTagsInput.value = (item.tags || []).join(', ');

            if (type === 'phrase' && contentAuthorInput) {
                contentAuthorInput.value = item.author || '';
            }
        }
    } else {
        // Limpiar formulario
        if (contentForm) contentForm.reset();
        if (fileNameSpan) fileNameSpan.textContent = '';
        if (fileInputLabel) fileInputLabel.classList.remove('has-file');
    }

    if (contentModal) contentModal.classList.add('active');
}

function hideContentModal() {
    if (contentModal) contentModal.classList.remove('active');
    currentEditingId = null;
}

function handleFileSelect(e) {
    const file = e.target.files[0];

    if (fileNameSpan) {
        fileNameSpan.textContent = file ? file.name : '';
    }

    if (fileInputLabel) {
        if (file) {
            fileInputLabel.classList.add('has-file');
        } else {
            fileInputLabel.classList.remove('has-file');
        }
    }
}

// ====================== CREAR / ACTUALIZAR CONTENIDO ======================

function handleContentSubmit(e) {
    e.preventDefault();

    const type = contentTypeInput?.value;
    const title = contentTitleInput?.value.trim();
    const description = contentDescriptionInput?.value.trim();
    const tags = (contentTagsInput?.value || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);
    const file = contentFileInput?.files[0];

    if (!title || !description) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    if (type !== 'phrase' && !file && !currentEditingId) {
        alert('Por favor selecciona un archivo');
        return;
    }

    const contentData = {
        title,
        description,
        tags,
        type,
    };

    if (type === 'phrase') {
        const author = contentAuthorInput?.value.trim();
        if (!author) {
            alert('Por favor ingresa el autor de la frase');
            return;
        }
        contentData.author = author;
        contentData.text = description;
    }

    if (currentEditingId) {
        updateContent(currentEditingId, contentData, file);
    } else {
        createContent(contentData, file);
    }
}

function createContent(contentData, file) {
    let url = '';

    if (file) {
        // En un entorno real subirías el archivo a un servidor
        url = URL.createObjectURL(file);
    }

    const newContent = {
        id: Date.now().toString(),
        ...contentData,
        url,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString(),
    };

    userContent.push(newContent);
    localStorage.setItem('legado_content', JSON.stringify(userContent));

    hideContentModal();
    loadUserContent();
    updateStats();

    alert('¡Contenido agregado exitosamente!');
}

function updateContent(contentId, contentData, file) {
    const index = userContent.findIndex((item) => item.id === contentId);
    if (index === -1) return;

    let url = userContent[index].url;

    if (file) {
        url = URL.createObjectURL(file);
    }

    userContent[index] = {
        ...userContent[index],
        ...contentData,
        url,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('legado_content', JSON.stringify(userContent));

    hideContentModal();
    loadUserContent();
    updateStats();

    alert('¡Contenido actualizado exitosamente!');
}

// ====================== EDITAR / ELIMINAR (GLOBALES PARA onclick) ======================

function editContent(contentId) {
    const item = userContent.find((c) => c.id === contentId);
    if (!item) {
        alert('Contenido no encontrado');
        return;
    }
    showContentModal(item.type, contentId);
}

function deleteContent(contentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.')) {
        return;
    }

    userContent = userContent.filter((item) => item.id !== contentId);
    localStorage.setItem('legado_content', JSON.stringify(userContent));

    loadUserContent();
    updateStats();

    alert('¡Contenido eliminado exitosamente!');
}

// Hacerlas accesibles desde HTML inline
window.editContent = editContent;
window.deleteContent = deleteContent;

// ====================== LOGOUT ======================

function handleLogout() {
    localStorage.removeItem('legado_currentUser');
    window.location.href = 'index.html';
}

// ====================== ARRANQUE ======================

document.addEventListener('DOMContentLoaded', initDashboard);
