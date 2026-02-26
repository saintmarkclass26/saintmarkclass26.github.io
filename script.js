/**
 * St. Mark Class 26 — script.js
 * Database: Supabase (shared, works on GitHub Pages)
 * Notes placement: Organized grid — 5 per row, then next row
 */

'use strict';

/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================ */
const SUPABASE_URL  = 'https://xckclgunqxzemgjqpjvc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhja2NsZ3VucXh6ZW1nanFwanZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODMzMDcsImV4cCI6MjA4NzQ1OTMwN30.SS2pIh__tCsG7IshJOHYJFiJLpWUlo0HHEWZx3pZcpo';

/* ============================================================
   DATA
   ============================================================ */
const WEEKS = [
  {
    id:          'week-1',
    type:        'week',
    number:      1,
    emoji:       '🏛️',
    title:       'Orientation',
    description: 'Welcome to Class 26! Setting the stage for our journey — introductions, expectations, and the spirit of exploration.',
  },
  {
    id:          'week-2',
    type:        'week',
    number:      2,
    emoji:       '📖',
    title:       'The Chronicles of Narnia',
    description: 'Diving into the world of Narnia — discovering deeper meanings, themes of courage, faith, and wonder woven through the story.',
  },
  {
    id:          'week-3',
    type:        'week',
    number:      3,
    emoji:       '✝️',
    title:       'Baptism — Entering into the Covenant',
    description: 'Exploring the sacred sacrament of Baptism and what it means to enter into a covenant relationship with God.',
  },
];

const ASSIGNMENTS = [
  {
    id:          'assignment-1',
    type:        'assignment',
    number:      1,
    emoji:       '✝️',
    title:       'Sweetness of Jesus and Zacchaeus',
    description: 'Reflect on the encounter between Jesus and Zacchaeus. What does this story reveal about grace, transformation, and being truly known?',
  },
  {
    id:          'assignment-2',
    type:        'assignment',
    number:      2,
    emoji:       '🌟',
    title:       'You Are Known',
    description: 'A personal reflection on being known fully — by God, by others, by yourself. Share what this means to you and how it shapes your journey.',
  },
  {
    id:          'assignment-3',
    type:        'assignment',
    number:      3,
    emoji:       '🕊️',
    title:       'Healing Hurts: Part 1 — The Journey to Healing',
    description: 'Begin the journey toward healing. Reflect on the first steps of recognizing hurt and opening your heart to God\'s restorative grace.',
  },
];

const NOTE_COLORS    = ['note-yellow', 'note-green', 'note-pink', 'note-blue', 'note-purple', 'note-orange'];
const ADMIN_PASSWORD = 'foundation2024';

/* ============================================================
   STATE
   ============================================================ */
let isAdmin         = false;
let currentBoardId  = null;
let pollingInterval = null;
let lastNoteCount   = 0;

/* ============================================================
   SUPABASE HELPERS
   ============================================================ */
function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':         SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Prefer':        'return=representation',
  };
}

async function fetchNotes(boardId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?board_id=eq.${encodeURIComponent(boardId)}&order=timestamp.asc`,
      { headers: sbHeaders() }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('fetchNotes error:', err);
    return [];
  }
}

async function insertNote(note) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
      method:  'POST',
      headers: sbHeaders(),
      body:    JSON.stringify(note),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error('insertNote error:', err);
    return false;
  }
}

async function deleteAllNotes(boardId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?board_id=eq.${encodeURIComponent(boardId)}`,
      { method: 'DELETE', headers: sbHeaders() }
    );
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error('deleteAllNotes error:', err);
    return false;
  }
}

async function getNoteCount(boardId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?board_id=eq.${encodeURIComponent(boardId)}&select=id`,
      {
        headers: {
          ...sbHeaders(),
          'Prefer':     'count=exact',
          'Range-Unit': 'items',
          'Range':      '0-0',
        }
      }
    );
    const contentRange = res.headers.get('content-range');
    if (contentRange) return parseInt(contentRange.split('/')[1], 10) || 0;
    return 0;
  } catch {
    return 0;
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  showPage('home');
  renderWeekCards();
  renderAssignmentCards();

  setupScrollEffects();
  setupAdminModal();

  document.querySelectorAll('.scroll-link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  await refreshAllCardCounts();
});

/* ============================================================
   PAGE ROUTING
   ============================================================ */
function showPage(page) {
  const homePage  = document.getElementById('home-page');
  const boardPage = document.getElementById('board-page');

  if (page === 'home') {
    homePage.classList.add('active');
    boardPage.classList.remove('active');
    document.title = 'St. Mark Class 26';
    window.scrollTo({ top: 0 });
  } else if (page === 'board') {
    homePage.classList.remove('active');
    boardPage.classList.add('active');
    window.scrollTo({ top: 0 });
  }
}

/* ============================================================
   RENDER CARDS
   ============================================================ */
function renderWeekCards() {
  const grid = document.getElementById('weeks-grid');
  if (!grid) return;
  WEEKS.forEach((week, idx) => grid.appendChild(createCard(week, idx)));
  requestAnimationFrame(animateCardsInView);
}

function renderAssignmentCards() {
  const grid = document.getElementById('assignments-grid');
  if (!grid) return;
  ASSIGNMENTS.forEach((assignment, idx) => grid.appendChild(createCard(assignment, idx)));
  requestAnimationFrame(animateCardsInView);
}

function createCard(item, idx) {
  const card = document.createElement('article');
  card.className = `journey-card ${item.type === 'assignment' ? 'assignment-card' : ''}`;
  card.style.transitionDelay = `${idx * 0.07}s`;
  card.setAttribute('data-board-id', item.id);

  const tagText = item.type === 'week' ? `Week ${item.number}` : `Assignment ${item.number}`;

  card.innerHTML = `
    <div class="card-tag">${tagText}</div>
    <div class="card-emoji">${item.emoji}</div>
    <div class="card-title">${item.title}</div>
    <div class="card-sub">${item.description}</div>
    <div class="card-footer">
      <span class="card-note-count">📌 — notes</span>
      <span class="card-arrow">Open board →</span>
    </div>
  `;

  card.addEventListener('click', () => openBoard(item));
  return card;
}

/* ============================================================
   OPEN BOARD
   ============================================================ */
async function openBoard(item) {
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }

  currentBoardId = item.id;
  lastNoteCount  = 0;

  document.getElementById('board-page-tag').textContent =
    item.type === 'week' ? `Week ${item.number}` : `Assignment ${item.number}`;
  document.getElementById('board-page-title').textContent = item.title;
  document.title = `${item.title} — St. Mark Class 26`;

  clearCorkboardDOM();
  resetBoardForm();

  const clearBtn = document.getElementById('clear-board-btn');
  if (clearBtn) clearBtn.onclick = () => clearBoard(item.id);

  showPage('board');

  document.getElementById('back-btn').onclick = () => {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
    currentBoardId = null;
    lastNoteCount  = 0;
    showPage('home');
    refreshAllCardCounts();
  };

  setupBoardForm(item.id);
  await reloadBoard(item.id);

  pollingInterval = setInterval(() => pollBoard(item.id), 10000);
}

async function pollBoard(boardId) {
  const notes = await fetchNotes(boardId);
  if (notes.length !== lastNoteCount) {
    renderNotes(notes);
  }
}

async function reloadBoard(boardId) {
  const notes = await fetchNotes(boardId);
  renderNotes(notes);
}

function renderNotes(notes) {
  clearCorkboardDOM();
  lastNoteCount = notes.length;

  const board  = document.getElementById('corkboard');
  const boardW = board.offsetWidth || 800;

  let cols = 5;
  if (boardW < 500) cols = 2;
  else if (boardW < 700) cols = 3;
  else if (boardW < 900) cols = 4;

  const PAD    = 28;
  const GAP_X  = 14;
  const GAP_Y  = 40;
  const NOTE_W = Math.floor((boardW - PAD * 2 - GAP_X * (cols - 1)) / cols);
  const NOTE_H = Math.round(NOTE_W * 0.9);

  const ROTATIONS = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6];

  notes.forEach((note, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x   = PAD + col * (NOTE_W + GAP_X);
    const y   = PAD + row * (NOTE_H + GAP_Y) + 10;
    const rot = ROTATIONS[idx % ROTATIONS.length];
    addNoteToDOM(note, false, x, y, NOTE_W, NOTE_H, rot);
  });

  const totalRows = Math.ceil(notes.length / cols);
  const minH = totalRows > 0
    ? PAD + totalRows * (NOTE_H + GAP_Y) + PAD + 20
    : 320;
  board.style.minHeight = `${Math.max(minH, 320)}px`;

  updateEmptyState();
}

/* ============================================================
   BOARD FORM
   ============================================================ */
function setupBoardForm(boardId) {
  const form    = document.getElementById('board-share-form');
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  const newMsgArea = newForm.querySelector('#bsf-message');
  const newCharEl  = newForm.querySelector('#bsf-char-remaining');
  const newErrEl   = newForm.querySelector('#bsf-error');

  newMsgArea.addEventListener('input', () => {
    const rem = 300 - newMsgArea.value.length;
    newCharEl.textContent = rem;
    newCharEl.style.color = rem < 30 ? '#c0392b' : '';
  });

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    newErrEl.textContent = '';

    const name    = newForm.querySelector('#bsf-name').value.trim();
    const message = newMsgArea.value.trim();

    if (!message) {
      newErrEl.textContent = '⚠️ Please write a message before pinning.';
      newMsgArea.focus();
      return;
    }
    if (message.length < 5) {
      newErrEl.textContent = '⚠️ Message must be at least 5 characters.';
      newMsgArea.focus();
      return;
    }

    const submitBtn       = newForm.querySelector('.btn-pin');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Pinning…';

    const note = {
      board_id:  boardId,
      name:      name || 'Anonymous',
      message,
      color:     NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      rotation:  randomBetween(-7, 7),
      timestamp: new Date().toISOString(),
    };

    const ok = await insertNote(note);

    submitBtn.disabled    = false;
    submitBtn.textContent = '📌 Pin Note';

    if (ok) {
      newForm.reset();
      newCharEl.textContent = '300';
      await reloadBoard(boardId);
      document.getElementById('corkboard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      newErrEl.textContent = '⚠️ Could not save note. Please try again.';
    }
  });
}

function resetBoardForm() {
  const form = document.getElementById('board-share-form');
  if (!form) return;
  form.reset();
  const charEl = form.querySelector('#bsf-char-remaining');
  if (charEl) charEl.textContent = '300';
  const errEl = form.querySelector('#bsf-error');
  if (errEl) errEl.textContent = '';
}

/* ============================================================
   CORKBOARD DOM
   ============================================================ */
function clearCorkboardDOM() {
  document.getElementById('corkboard')
    .querySelectorAll('.sticky-note')
    .forEach(el => el.remove());
}

function addNoteToDOM(note, animate, posX, posY, noteW, noteH, rotOverride) {
  const board = document.getElementById('corkboard');
  const rot   = rotOverride !== undefined ? rotOverride : (note.rotation || 0);

  const el = document.createElement('div');
  el.className = `sticky-note ${note.color}`;
  el.style.left      = `${posX}px`;
  el.style.top       = `${posY}px`;
  el.style.transform = `rotate(${rot}deg)`;
  if (noteW) el.style.width     = `${noteW}px`;
  if (noteH) el.style.minHeight = `${noteH}px`;
  el.setAttribute('data-id', note.id);

  el.innerHTML = `
    <div class="sn-name">${escapeHtml(note.name)}</div>
    <div class="sn-msg">${escapeHtml(note.message)}</div>
  `;

  if (animate) {
    el.style.opacity   = '0';
    el.style.transform = `rotate(${rot}deg) scale(0.4)`;
    board.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity    = '1';
      el.style.transform  = `rotate(${rot}deg) scale(1)`;
    });
  } else {
    board.appendChild(el);
  }
}

function updateEmptyState() {
  const emptyEl = document.getElementById('corkboard-empty');
  if (!emptyEl) return;
  const hasNotes = document.getElementById('corkboard').querySelectorAll('.sticky-note').length > 0;
  emptyEl.style.display = hasNotes ? 'none' : 'block';
}

/* ============================================================
   CLEAR BOARD (ADMIN ONLY)
   ============================================================ */
async function clearBoard(boardId) {
  if (!isAdmin) return;
  if (!confirm('Clear all notes on this board? This cannot be undone.')) return;

  await deleteAllNotes(boardId);
  clearCorkboardDOM();
  lastNoteCount = 0;
  updateEmptyState();
  refreshAllCardCounts();
}

/* ============================================================
   REFRESH CARD NOTE COUNTS
   ============================================================ */
async function refreshAllCardCounts() {
  const allItems = [...WEEKS, ...ASSIGNMENTS];
  await Promise.all(allItems.map(async (item) => {
    const count = await getNoteCount(item.id);
    const card  = document.querySelector(`[data-board-id="${item.id}"]`);
    if (card) {
      const el = card.querySelector('.card-note-count');
      if (el) el.textContent = `📌 ${count} note${count !== 1 ? 's' : ''}`;
    }
  }));
}

/* ============================================================
   ADMIN MODAL
   ============================================================ */
function setupAdminModal() {
  const triggerBtn = document.getElementById('admin-trigger-btn');
  const modal      = document.getElementById('admin-modal');
  const closeBtn   = document.getElementById('modal-close-btn');
  const submitBtn  = document.getElementById('modal-submit-btn');
  const passwordIn = document.getElementById('admin-password-input');
  const errorEl    = document.getElementById('modal-error');

  const openModal  = () => { modal.classList.add('open'); passwordIn.value = ''; errorEl.textContent = ''; setTimeout(() => passwordIn.focus(), 150); };
  const closeModal = () => modal.classList.remove('open');

  triggerBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const tryLogin = () => {
    if (passwordIn.value === ADMIN_PASSWORD) {
      isAdmin = true;
      document.body.classList.add('admin-mode');
      closeModal();
    } else {
      errorEl.textContent = 'Incorrect password. Try again.';
      passwordIn.value = '';
      passwordIn.focus();
    }
  };

  submitBtn.addEventListener('click', tryLogin);
  passwordIn.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
}

/* ============================================================
   SCROLL EFFECTS
   ============================================================ */
function setupScrollEffects() {
  window.addEventListener('scroll', onHomeScroll, { passive: true });
  onHomeScroll();
}

function onHomeScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const frac      = docHeight > 0 ? scrollTop / docHeight : 0;
  const pct       = frac * 100;

  const bar = document.getElementById('page-progress');
  if (bar) bar.style.width = `${pct}%`;

  animateCardsInView();
}

function animateCardsInView() {
  const threshold = window.innerHeight * 0.9;
  document.querySelectorAll('.journey-card').forEach(card => {
    if (card.getBoundingClientRect().top < threshold) card.classList.add('visible');
  });
}

/* ============================================================
   UTILITIES
   ============================================================ */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
