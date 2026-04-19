// ── Guard — if not logged in, send to login page ──
const token = localStorage.getItem('token');
const name = localStorage.getItem('name');
if (!token) window.location.href = '/';

// ── Welcome message ──
document.getElementById('welcome-text').textContent = `Welcome, ${name}!`;

// ── Dates ──
const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
document.getElementById('diary-date').textContent = today;
document.getElementById('todos-date').textContent = today;

// ── Dark mode ──
if (localStorage.getItem('dark') === 'true') {
  document.body.classList.add('dark');
}

function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark', document.body.classList.contains('dark'));
}

// ── Logout ──
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  window.location.href = '/';
}

// ── Section switcher — diary and todos completely separate ──
function showSection(section) {
  document.querySelectorAll('.page-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(section + '-panel').classList.add('active');
  event.target.classList.add('active');
}

// ══════════════════════════════════════════
// DIARY
// ══════════════════════════════════════════

let selectedMood = 'great';

function selectMood(btn) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMood = btn.dataset.mood;
}

// Load all diary entries from backend
async function loadDiary() {
  const res = await fetch('/diary', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  const entries = await res.json();
  const list = document.getElementById('diary-list');

  if (!entries.length) {
    list.innerHTML = '<div class="empty-state">Your diary is empty... start writing!</div>';
    return;
  }

  list.innerHTML = entries.map(entry => `
    <div class="diary-entry" id="entry-${entry.id}">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(entry.title)}</span>
        <div class="entry-meta">
          <span class="mood-tag ${entry.mood}">${moodEmoji(entry.mood)} ${entry.mood}</span>
          <span class="entry-date">${formatDate(entry.created_at)}</span>
          <button class="btn-small" onclick="deleteEntry(${entry.id})">Delete</button>
        </div>
      </div>
      <div class="entry-content">${escapeHtml(entry.content)}</div>
    </div>
  `).join('');
}

// Save a new diary entry
async function saveDiaryEntry() {
  const title = document.getElementById('diary-title').value.trim();
  const content = document.getElementById('diary-content').value.trim();
  const errorEl = document.getElementById('diary-error');

  errorEl.textContent = '';

  if (!title || !content) {
    errorEl.textContent = 'Please fill in both title and content!';
    return;
  }

  const res = await fetch('/diary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ title, content, mood: selectedMood })
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error;
    return;
  }

  // Clear form
  document.getElementById('diary-title').value = '';
  document.getElementById('diary-content').value = '';

  // Reload entries
  loadDiary();
}

// Delete a diary entry
async function deleteEntry(id) {
  if (!confirm('Delete this diary entry?')) return;

  const res = await fetch('/diary/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (res.ok) {
    document.getElementById('entry-' + id).remove();
    const list = document.getElementById('diary-list');
    if (!list.children.length) {
      list.innerHTML = '<div class="empty-state">Your diary is empty... start writing!</div>';
    }
  }
}

// ══════════════════════════════════════════
// TODOS
// ══════════════════════════════════════════

let selectedPriority = 'medium';

function selectPriority(btn) {
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedPriority = btn.dataset.p;
}

// Load all todos from backend
async function loadTodos() {
  const res = await fetch('/todos', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  const todos = await res.json();
  const list = document.getElementById('todos-list');

  if (!todos.length) {
    list.innerHTML = '<div class="empty-state">No tasks yet... add one above!</div>';
    return;
  }

  list.innerHTML = todos.map(todo => `
    <div class="todo-item ${todo.completed ? 'done' : ''}" id="todo-${todo.id}">
      <div class="priority-dot ${todo.priority}"></div>
      <span class="todo-task">${escapeHtml(todo.task)}</span>
      <div class="todo-actions">
        <button class="btn-small ${todo.completed ? '' : 'complete'}"
          onclick="toggleTodo(${todo.id})">
          ${todo.completed ? 'Undo' : 'Done'}
        </button>
        <button class="btn-small" onclick="deleteTodo(${todo.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Save a new todo
async function saveTodo() {
  const task = document.getElementById('todo-task').value.trim();
  const errorEl = document.getElementById('todo-error');

  errorEl.textContent = '';

  if (!task) {
    errorEl.textContent = 'Please enter a task!';
    return;
  }

  const res = await fetch('/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ task, priority: selectedPriority })
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error;
    return;
  }

  document.getElementById('todo-task').value = '';
  loadTodos();
}

// Toggle todo complete/incomplete
async function toggleTodo(id) {
  const res = await fetch('/todos/' + id + '/complete', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (res.ok) loadTodos();
}

// Delete a todo
async function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;

  const res = await fetch('/todos/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (res.ok) {
    document.getElementById('todo-' + id).remove();
    const list = document.getElementById('todos-list');
    if (!list.children.length) {
      list.innerHTML = '<div class="empty-state">No tasks yet... add one above!</div>';
    }
  }
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function moodEmoji(mood) {
  return { great: '😄', good: '🙂', okay: '😐', bad: '😔' }[mood] || '😐';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Load everything on page start ──
loadDiary();
loadTodos();
