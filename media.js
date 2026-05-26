// ===========================
// BLACK RICE - MEDIA MANAGER
// ===========================
// Photos: stored as base64 in localStorage (persist across sessions)
// Video URLs: stored in localStorage (YouTube embeds, iCloud links, etc.)
// Local video files: object URLs, session-only (cannot be persisted)

const PHOTO_KEY = 'br_photos_v1';
const VIDEO_KEY = 'br_videos_v1';

// ---- UTILS ----

function loadPhotos() {
    try { return JSON.parse(localStorage.getItem(PHOTO_KEY)) || []; }
    catch { return []; }
}
function savePhotos(arr) {
    try { localStorage.setItem(PHOTO_KEY, JSON.stringify(arr)); }
    catch { alert('Storage full! Remove some photos to make room.'); }
}
function loadVideos() {
    try {
        return (JSON.parse(localStorage.getItem(VIDEO_KEY)) || [])
               .filter(v => !v.isLocal); // local blobs don't survive reload
    }
    catch { return []; }
}
function saveVideos(arr) {
    const toSave = arr.filter(v => !v.isLocal);
    localStorage.setItem(VIDEO_KEY, JSON.stringify(toSave));
}
function dateStr() {
    return new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function uid() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ---- TABS ----

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
    });
});

// ---- PHOTOS ----

function renderPhotos() {
    const grid   = document.getElementById('photo-grid');
    const photos = loadPhotos();
    if (!photos.length) {
        grid.innerHTML = '<div class="empty-state"><span style="font-size:3rem">📷</span><p>No photos yet — drop some in!</p></div>';
        return;
    }
    grid.innerHTML = photos.map(p => `
        <div class="media-item" id="photo-${p.id}">
            <img src="${p.src}" alt="${escHtml(p.title)}" loading="lazy">
            <div class="media-item-info">
                <div>
                    <div class="media-item-title">${escHtml(p.title)}</div>
                    <div class="media-item-date">${p.date}</div>
                </div>
                <button class="delete-btn" onclick="deletePhoto('${p.id}')" title="Remove">&#x2715;</button>
            </div>
        </div>
    `).join('');
}

function addPhotos(files) {
    const photos = loadPhotos();
    let pending  = 0;
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        pending++;
        const reader = new FileReader();
        reader.onload = e => {
            photos.push({ id: uid(), src: e.target.result,
                          title: stripExt(file.name), date: dateStr() });
            pending--;
            if (pending === 0) { savePhotos(photos); renderPhotos(); }
        };
        reader.readAsDataURL(file);
    });
}

function deletePhoto(id) {
    savePhotos(loadPhotos().filter(p => p.id !== id));
    renderPhotos();
}

// Drag-and-drop + click for photos
const photoDropZone = document.getElementById('photo-drop-zone');
const photoInput    = document.getElementById('photo-input');

photoDropZone.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', e => { addPhotos(e.target.files); photoInput.value = ''; });
photoDropZone.addEventListener('dragover',  e => { e.preventDefault(); photoDropZone.classList.add('drag-over'); });
photoDropZone.addEventListener('dragleave', ()  => photoDropZone.classList.remove('drag-over'));
photoDropZone.addEventListener('drop', e => {
    e.preventDefault();
    photoDropZone.classList.remove('drag-over');
    addPhotos(e.dataTransfer.files);
});

// ---- VIDEOS ----

// Convert a YouTube URL to an embed URL
function youtubeEmbed(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? 'https://www.youtube.com/embed/' + m[1] : null;
}

// In-memory list (includes session-local blobs)
let allVideos = loadVideos();

function renderVideosFromList(list) {
    const grid = document.getElementById('video-grid');
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state"><span style="font-size:3rem">🎬</span><p>No videos yet — add a link or upload a file!</p></div>';
        return;
    }
    grid.innerHTML = list.map(v => {
        let media;
        if (v.embedUrl) {
            media = `<iframe src="${v.embedUrl}" allowfullscreen loading="lazy"></iframe>`;
        } else if (v.isLocal) {
            media = `<video controls><source src="${v.src}"></video>`;
        } else {
            media = `<div class="video-link-card">
                        <span class="link-icon">&#127916;</span>
                        <a href="${v.src}" target="_blank" rel="noopener" class="btn btn-primary"
                           style="display:inline-block;margin:8px 0">&#9654; Open Video</a>
                        <div class="link-url">${escHtml(v.src)}</div>
                     </div>`;
        }
        const sessionNote = v.isLocal ? ' <span style="color:var(--text-muted);font-size:0.72rem">(session only)</span>' : '';
        return `
            <div class="media-item" id="video-${v.id}">
                ${media}
                <div class="media-item-info">
                    <div>
                        <div class="media-item-title">${escHtml(v.title)}${sessionNote}</div>
                        <div class="media-item-date">${v.date}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteVideo('${v.id}')" title="Remove">&#x2715;</button>
                </div>
            </div>`;
    }).join('');
}

function renderVideos() { renderVideosFromList(allVideos); }

function addVideoLink() {
    const titleEl = document.getElementById('video-title');
    const urlEl   = document.getElementById('video-url');
    const title   = titleEl.value.trim() || 'Untitled Video';
    const url     = urlEl.value.trim();
    if (!url) { urlEl.focus(); return; }

    const entry = { id: uid(), title, src: url,
                    embedUrl: youtubeEmbed(url), isLocal: false, date: dateStr() };
    allVideos.push(entry);
    saveVideos(allVideos);
    renderVideos();
    titleEl.value = '';
    urlEl.value   = '';
    document.getElementById('video-grid').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteVideo(id) {
    allVideos = allVideos.filter(v => v.id !== id);
    saveVideos(allVideos);
    renderVideos();
}

// Enter key submits video URL
document.getElementById('video-url').addEventListener('keydown', e => {
    if (e.key === 'Enter') addVideoLink();
});

// Local video file upload (session only)
const videoDropZone = document.getElementById('video-drop-zone');
const videoInput    = document.getElementById('video-input');

videoDropZone.addEventListener('click', () => videoInput.click());
videoInput.addEventListener('change', e => { addLocalVideos(e.target.files); videoInput.value = ''; });
videoDropZone.addEventListener('dragover',  e => { e.preventDefault(); videoDropZone.classList.add('drag-over'); });
videoDropZone.addEventListener('dragleave', ()  => videoDropZone.classList.remove('drag-over'));
videoDropZone.addEventListener('drop', e => {
    e.preventDefault();
    videoDropZone.classList.remove('drag-over');
    addLocalVideos(e.dataTransfer.files);
});

function addLocalVideos(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('video/')) return;
        allVideos.push({
            id: uid(),
            title: stripExt(file.name),
            src: URL.createObjectURL(file),
            embedUrl: null,
            isLocal: true,
            date: dateStr()
        });
    });
    renderVideos();
    document.getElementById('video-grid').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- HELPERS ----
function stripExt(name) { return name.replace(/\.[^.]+$/, ''); }
function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---- INIT ----
renderPhotos();
renderVideos();
