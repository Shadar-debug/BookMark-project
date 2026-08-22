(() => {
  const STORAGE_KEY = 'bookmarks';

  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const bookmarkForm = document.getElementById('bookmarkForm');
  const bookmarkIdInput = document.getElementById('bookmarkId');
  const siteNameInput = document.getElementById('siteName');
  const siteUrlInput = document.getElementById('siteUrl');
  const formError = document.getElementById('formError');

  const openAddBtn = document.getElementById('openAddBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  let bookmarks = loadBookmarks();

  // ---------- Storage ----------

  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to read bookmarks from localStorage', err);
      return [];
    }
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }

  // ---------- Helpers ----------

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  function faviconUrl(url) {
    const host = getHostname(url);
    return host
      ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`
      : '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Rendering ----------

  function render(filterText = '') {
    const query = filterText.trim().toLowerCase();
    const list = query
      ? bookmarks.filter(b =>
          b.name.toLowerCase().includes(query) || b.url.toLowerCase().includes(query))
      : bookmarks;

    grid.innerHTML = '';

    if (bookmarks.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = '';
      emptyState.innerHTML = 'No bookmarks yet. Click <strong>+ Add Bookmark</strong> to save your first one.';
      return;
    }

    if (list.length === 0) {
      emptyState.hidden = false;
      emptyState.innerHTML = 'No bookmarks match your search.';
      return;
    }

    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();
    list.forEach(bookmark => fragment.appendChild(buildCard(bookmark)));
    grid.appendChild(fragment);
  }

  function buildCard(bookmark) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = bookmark.id;
    card.title = bookmark.url;
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `Open ${bookmark.name}`);

    const initial = bookmark.name.trim().charAt(0).toUpperCase() || '?';
    const favicon = faviconUrl(bookmark.url);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-logo">
          ${favicon ? `<img src="${favicon}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
          <span class="fallback" style="${favicon ? 'display:none;' : 'display:flex;'}">${escapeHtml(initial)}</span>
        </div>
        <div class="card-info">
          <p class="card-name" title="${escapeHtml(bookmark.name)}">${escapeHtml(bookmark.name)}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-edit" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-delete" data-action="delete">Delete</button>
      </div>
    `;

    function openBookmark() {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      openBookmark();
    });

    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBookmark();
      }
    });

    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(bookmark.id);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBookmark(bookmark.id);
    });

    return card;
  }

  // ---------- CRUD actions ----------

  function addBookmark(name, url) {
    bookmarks.push({ id: uid(), name, url });
    saveBookmarks();
    render(searchInput.value);
  }

  function updateBookmark(id, name, url) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    bookmark.name = name;
    bookmark.url = url;
    saveBookmarks();
    render(searchInput.value);
  }

  function deleteBookmark(id) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    if (!confirm(`Delete "${bookmark.name}"?`)) return;
    bookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks();
    render(searchInput.value);
  }

  // ---------- Modal ----------

  function openAddModal() {
    modalTitle.textContent = 'Add Bookmark';
    bookmarkIdInput.value = '';
    siteNameInput.value = '';
    siteUrlInput.value = '';
    hideError();
    modalOverlay.hidden = false;
    siteNameInput.focus();
  }

  function openEditModal(id) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    modalTitle.textContent = 'Edit Bookmark';
    bookmarkIdInput.value = bookmark.id;
    siteNameInput.value = bookmark.name;
    siteUrlInput.value = bookmark.url;
    hideError();
    modalOverlay.hidden = false;
    siteNameInput.focus();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    bookmarkForm.reset();
    hideError();
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function hideError() {
    formError.hidden = true;
    formError.textContent = '';
  }

  // ---------- Events ----------

  openAddBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
  });

  bookmarkForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = siteNameInput.value.trim();
    const rawUrl = siteUrlInput.value.trim();

    if (!name || !rawUrl) {
      showError('Please fill in both fields.');
      return;
    }

    const url = normalizeUrl(rawUrl);
    if (!getHostname(url)) {
      showError('Please enter a valid URL.');
      return;
    }

    const id = bookmarkIdInput.value;
    if (id) {
      updateBookmark(id, name, url);
    } else {
      addBookmark(name, url);
    }

    closeModal();
  });

  searchInput.addEventListener('input', () => render(searchInput.value));

  // ---------- Init ----------

  render();
})();
