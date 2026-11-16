// Task Tracker - HTML, CSS, dan JavaScript murni.
// Data disimpan di localStorage browser, jadi tidak butuh server.

const STORAGE_KEY = 'task-tracker:v1';
const PRIORITY_LABEL = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' };

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dueInput = document.getElementById('task-due');
const priorityInput = document.getElementById('task-priority');
const list = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty');
const counter = document.getElementById('counter');
const clearButton = document.getElementById('clear-done');
const filterButtons = document.querySelectorAll('.filter');

let tasks = loadTasks();
let currentFilter = 'all';

function loadTasks() {
      try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
      } catch (error) {
            return [];
      }
}

function saveTasks() {
      try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
            // Penyimpanan penuh atau diblokir: aplikasi tetap jalan tanpa menyimpan.
      }
}

function todayString() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(dateString) {
      return new Date(`${dateString}T00:00:00`).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
      });
}

function addTask(title, due, priority) {
      tasks.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            title,
            due,
            priority,
            done: false
      });
      saveTasks();
      render();
}

function toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (task) {
            task.done = !task.done;
            saveTasks();
            render();
      }
}

function deleteTask(id) {
      tasks = tasks.filter((item) => item.id !== id);
      saveTasks();
      render();
}

function visibleTasks() {
      const filtered = tasks.filter((task) => {
            if (currentFilter === 'active') return !task.done;
            if (currentFilter === 'done') return task.done;
            return true;
      });
      // Tugas belum selesai di atas, lalu urut tenggat terdekat.
      return filtered.sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (a.due && b.due) return a.due.localeCompare(b.due);
            if (a.due) return -1;
            if (b.due) return 1;
            return 0;
      });
}

function buildTaskItem(task) {
      const item = document.createElement('li');
      item.className = 'task' + (task.done ? ' is-done' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', `Tandai selesai: ${task.title}`);
      checkbox.addEventListener('change', () => toggleTask(task.id));

      const body = document.createElement('div');
      body.className = 'task-body';

      const title = document.createElement('div');
      title.className = 'task-title';
      title.textContent = task.title;

      const meta = document.createElement('div');
      meta.className = 'task-meta';

      const priority = document.createElement('span');
      priority.className = `priority priority-${task.priority}`;
      priority.textContent = PRIORITY_LABEL[task.priority] || 'Sedang';
      meta.appendChild(priority);

      if (task.due) {
            const due = document.createElement('span');
            const isOverdue = !task.done && task.due < todayString();
            due.className = isOverdue ? 'overdue' : '';
            due.textContent = (isOverdue ? 'Terlambat: ' : 'Tenggat: ') + formatDate(task.due);
            meta.appendChild(due);
      }

      body.append(title, meta);

      const remove = document.createElement('button');
      remove.className = 'delete';
      remove.type = 'button';
      remove.textContent = '\u00d7';
      remove.setAttribute('aria-label', `Hapus: ${task.title}`);
      remove.addEventListener('click', () => deleteTask(task.id));

      item.append(checkbox, body, remove);
      return item;
}

function render() {
      const shown = visibleTasks();
      list.replaceChildren(...shown.map(buildTaskItem));

      emptyMessage.hidden = shown.length > 0;

      const activeCount = tasks.filter((task) => !task.done).length;
      counter.textContent = `${activeCount} tugas aktif`;
      clearButton.hidden = !tasks.some((task) => task.done);
}

form.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = titleInput.value.trim();
      if (!title) return;
      addTask(title, dueInput.value, priorityInput.value);
      form.reset();
      priorityInput.value = 'medium';
      titleInput.focus();
});

filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            filterButtons.forEach((other) => other.classList.toggle('is-active', other === button));
            render();
      });
});

clearButton.addEventListener('click', () => {
      tasks = tasks.filter((task) => !task.done);
      saveTasks();
      render();
});

render();
