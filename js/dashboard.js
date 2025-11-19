// js/dashboard.js
// Panel del Creador: usa Supabase para gestionar contenido del usuario
// js/dashboard.js
import { supabase } from './supabaseClient.js';
const supabaseClient = window.supabaseClient || null;
let currentUser = JSON.parse(localStorage.getItem('legado_currentUser')) || null;

let creatorContent = [];

// Elementos del DOM
const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');

const totalContentEl = document.getElementById('totalContent');
const totalVideosEl = document.getElementById('totalVideos');
const totalAudiosEl = document.getElementById('totalAudios');
const totalImagesEl = document.getElementById('totalImages');

const contentGrid = document.getElementById('contentGrid');
const contentFilter = document.getElementById('contentFilter');

const contentModal = document.getElementById('contentModal');
const modalTitleEl = document.getElementById('modalTitle');
const contentForm = document.getElementById('contentForm');
const contentIdInput = document.getElementById('contentId');
const contentTypeInput = document.getElementById('contentType');
const contentTitleInput = document.getElementById('contentTitle');
const contentFileInput = document.getElementById('contentFile');
const contentDescriptionInput = document.getElementById('contentDescription');
const contentTagsInput = document.getElementById('contentTags');
const contentAuthorInput = document.getElementById('contentAuthor');
const phraseFields = document.getElementById('phraseFields');
const fileInputGroup = document.getElementById('fileInputGroup');

const fileInputLabel = document.getElementById('fileInputLabel');
const fileNameLabel = document.getElementById('fileName');
const cancelContentBtn = document.getElementById('cancelContent');
const closeModalBtn = contentModal?.querySelector('.close-modal');

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});
// 🔧 Comprimir imagen antes de subir
function compressImageFile(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.7, // 0–1 (menor = más compresión)
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        // Mantener proporción pero limitar tamaño máximo
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (aspectRatio > 1) {
            // más ancho que alto
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
          } else {
            // más alto que ancho
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG comprimido
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('No se pudo generar el blob de la imagen'));
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen para comprimirla'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

async function initDashboard() {
  if (!supabaseClient) {
    alert('No se pudo inicializar Supabase en este navegador.');
    return;
  }

  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) console.error('Error getUser:', error);

    // Si no hay sesión o no hay currentUser en local, redirigir
    if (!user || !currentUser) {
      window.location.href = 'login.html#login';
      return;
    }

    if (!currentUser.isCreator) {
      alert('Solo los creadores pueden acceder a este panel.');
      window.location.href = 'index.html';
      return;
    }

    if (!currentUser.hasPaid) {
      alert('Debes completar el pago de creador antes de acceder al panel.');
      window.location.href = 'index.html';
      return;
    }

    // Rellenar cabecera
    if (userNameEl) userNameEl.textContent = currentUser.name || user.email;
    if (userAvatarEl) userAvatarEl.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          console.error('Error al cerrar sesión', e);
        }
        localStorage.removeItem('legado_currentUser');
        window.location.href = 'index.html';
      });
    }

    setupDashboardEvents();
    await fetchAndRenderContent();
  } catch (err) {
    console.error(err);
    alert('No se pudo cargar el panel del creador.');
  }
}

function setupDashboardEvents() {
  const addVideoBtn = document.getElementById('addVideoBtn');
  const addAudioBtn = document.getElementById('addAudioBtn');
  const addImageBtn = document.getElementById('addImageBtn');
  const addPhraseBtn = document.getElementById('addPhraseBtn');

  if (addVideoBtn) addVideoBtn.addEventListener('click', () => openContentModal('video'));
  if (addAudioBtn) addAudioBtn.addEventListener('click', () => openContentModal('audio'));
  if (addImageBtn) addImageBtn.addEventListener('click', () => openContentModal('image'));
  if (addPhraseBtn) addPhraseBtn.addEventListener('click', () => openContentModal('phrase'));

  if (cancelContentBtn) cancelContentBtn.addEventListener('click', closeContentModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeContentModal);

  if (contentFilter) {
    contentFilter.addEventListener('change', () => renderContentGrid(contentFilter.value));
  }

  if (contentFileInput && fileInputLabel && fileNameLabel) {
    contentFileInput.addEventListener('change', function () {
      if (this.files.length > 0) {
        fileInputLabel.classList.add('has-file');
        fileNameLabel.textContent = this.files[0].name;
      } else {
        fileInputLabel.classList.remove('has-file');
        fileNameLabel.textContent = '';
      }
    });
  }

  if (contentForm) {
    contentForm.addEventListener('submit', handleSaveContent);
  }
}

function openContentModal(type, item = null) {
  if (!contentModal) return;

  contentForm.reset();
  if (fileInputLabel) fileInputLabel.classList.remove('has-file');
  if (fileNameLabel) fileNameLabel.textContent = '';

  contentTypeInput.value = type;
  contentIdInput.value = item ? item.id : '';

  // Mostrar/ocultar campos según tipo
  if (type === 'phrase') {
    phraseFields.style.display = 'block';
    fileInputGroup.style.display = 'none';
  } else {
    phraseFields.style.display = 'none';
    fileInputGroup.style.display = 'block';
  }

  if (item) {
    modalTitleEl.textContent = 'Editar ' + getTypeLabel(type);
    contentTitleInput.value = item.title || '';
    contentDescriptionInput.value = item.description || '';
    contentTagsInput.value = (item.tags || []).join(', ');
    contentAuthorInput.value = item.author || '';
  } else {
    modalTitleEl.textContent = 'Agregar ' + getTypeLabel(type);
  }

  contentModal.classList.add('active');
}

function closeContentModal() {
  if (contentModal) contentModal.classList.remove('active');
}

function getTypeLabel(type) {
  switch (type) {
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'image': return 'Imagen';
    case 'phrase': return 'Frase';
    default: return 'Contenido';
  }
}

async function fetchAndRenderContent() {
  try {
    const { data, error } = await supabaseClient
      .from('content')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando contenido:', error);
      return;
    }

    creatorContent = data || [];
    updateStats();
    renderContentGrid(contentFilter?.value || 'all');
  } catch (err) {
    console.error(err);
  }
}

function updateStats() {
  const total = creatorContent.length;
  const videos = creatorContent.filter(c => c.type === 'video').length;
  const audios = creatorContent.filter(c => c.type === 'audio').length;
  const images = creatorContent.filter(c => c.type === 'image').length;

  if (totalContentEl) totalContentEl.textContent = total;
  if (totalVideosEl) totalVideosEl.textContent = videos;
  if (totalAudiosEl) totalAudiosEl.textContent = audios;
  if (totalImagesEl) totalImagesEl.textContent = images;
}

function renderContentGrid(filter) {
  if (!contentGrid) return;
  contentGrid.innerHTML = '';

  const items = filter === 'all'
    ? creatorContent
    : creatorContent.filter(c => c.type === filter);

  if (!items.length) {
    contentGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Aún no has subido contenido.</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'dashboard-card';

    const tagsHtml = (item.tags || [])
      .map(t => `<span class="tag">${t}</span>`)
      .join('');

    let mediaHtml = '';
    if (item.type === 'video') {
      mediaHtml = `
        <div class="dashboard-media">
          <video controls preload="metadata">
            <source src="${item.url}" type="video/mp4">
            Tu navegador no soporta video.
          </video>
        </div>`;
    } else if (item.type === 'audio') {
      mediaHtml = `
        <div class="dashboard-media audio">
          <audio controls preload="metadata">
            <source src="${item.url}" type="audio/mpeg">
            Tu navegador no soporta audio.
          </audio>
        </div>`;
    } else if (item.type === 'image') {
      mediaHtml = `
        <div class="dashboard-media">
          <img src="${item.url}" alt="${item.title || ''}">
        </div>`;
    } else if (item.type === 'phrase') {
      mediaHtml = `
        <div class="dashboard-phrase">
          <p class="phrase-text">"${item.description || ''}"</p>
          ${item.author ? `<p class="phrase-author">- ${item.author}</p>` : ''}
        </div>`;
    }

    card.innerHTML = `
      <div class="dashboard-card-header">
        <h3>${item.title || '(Sin título)'}</h3>
        <span class="type-pill type-${item.type}">${getTypeLabel(item.type)}</span>
      </div>
      ${mediaHtml}
      <div class="dashboard-card-body">
        ${item.type !== 'phrase' && item.description ? `<p class="card-desc">${item.description}</p>` : ''}
        <div class="tags">${tagsHtml}</div>
        <div class="card-actions">
          <button class="btn-sm" data-action="edit">Editar</button>
          <button class="btn-sm btn-danger" data-action="delete">Eliminar</button>
        </div>
      </div>
    `;

    const editBtn = card.querySelector('[data-action="edit"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    if (editBtn) {
      editBtn.addEventListener('click', () => openContentModal(item.type, item));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteContent(item.id));
    }

    contentGrid.appendChild(card);
  });
}

async function handleSaveContent(e) {
  e.preventDefault();

  const type = contentTypeInput.value;
  const id = contentIdInput.value || null;

  const title = contentTitleInput.value.trim();
  const description = contentDescriptionInput.value.trim();
  const tags = contentTagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  const author = contentAuthorInput.value.trim();
  const file = contentFileInput.files[0];

  if (!title || !description) {
    alert('Completa al menos título y descripción.');
    return;
  }

  // Subir archivo a Storage si aplica
  let url = null;
  if (type !== 'phrase') {
    if (!id && !file) {
      alert('Selecciona un archivo para subir.');
      return;
    }

    if (file) {
      let fileToUpload = file;

      // 🔧 Si es imagen, primero la comprimimos/redimensionamos
      if (type === 'image') {
        try {
          const compressedBlob = await compressImageFile(file, {
            maxWidth: 1600,  // puedes bajar esto si quieres aún menos peso
            maxHeight: 1600,
            quality: 0.7     // 0.5 = más compresión, menos calidad
          });

          const newFileName = file.name.replace(/\.\w+$/, '') + '.jpg';
          fileToUpload = new File([compressedBlob], newFileName, {
            type: 'image/jpeg'
          });
        } catch (err) {
          console.error('Error comprimiendo la imagen:', err);
          alert('No se pudo optimizar la imagen. Intenta con otra imagen o más pequeña.');
          return;
        }
      }

      // 🔼 Subimos el archivo (original para video/audio, comprimido para imagen)
      url = await uploadFileToStorage(fileToUpload, type);
      if (!url) return; // ya mostró error
    } else if (id) {
      const existing = creatorContent.find(c => c.id === id);
      url = existing?.url || null;
    }
  }

  if (id) {
    await updateContent({
      id,
      type,
      title,
      description,
      tags,
      author,
      url
    });
  } else {
    await createContent({
      type,
      title,
      description,
      tags,
      author,
      url
    });
  }

  await fetchAndRenderContent();
  closeContentModal();
}


// Subir archivo a Supabase Storage (crea un bucket llamado "media" en Supabase)
async function uploadFileToStorage(file, type) {
  const bucket = 'media'; // asegúrate de tener un bucket con este nombre
  const ext = file.name.split('.').pop();
  const path = `${currentUser.id}/${type}/${Date.now()}.${ext}`;

  const { error } = await supabaseClient
    .storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    console.error('Error subiendo archivo:', error);
    alert('No se pudo subir el archivo. Revisa la consola.');
    return null;
  }

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function createContent(data) {
  try {
    const payload = {
      user_id: currentUser.id,
      type: data.type,
      title: data.title,
      description: data.description,
      tags: data.tags,
      url: data.url,
      author: data.type === 'phrase' ? data.author : null
    };

    const { error } = await supabaseClient
      .from('content')
      .insert(payload);

    if (error) {
      console.error('Error insertando contenido:', error);
      alert('No se pudo guardar el contenido en la base de datos.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateContent(data) {
  try {
    const payload = {
      title: data.title,
      description: data.description,
      tags: data.tags,
      url: data.url,
      author: data.type === 'phrase' ? data.author : null
    };

    const { error } = await supabaseClient
      .from('content')
      .update(payload)
      .eq('id', data.id);

    if (error) {
      console.error('Error actualizando contenido:', error);
      alert('No se pudo actualizar el contenido.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteContent(id) {
  if (!confirm('¿Seguro que quieres eliminar este contenido?')) return;

  try {
    const { error } = await supabaseClient
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando contenido:', error);
      alert('No se pudo eliminar el contenido.');
      return;
    }

    creatorContent = creatorContent.filter(c => c.id !== id);
    renderContentGrid(contentFilter?.value || 'all');
  } catch (err) {
    console.error(err);
  }
}
