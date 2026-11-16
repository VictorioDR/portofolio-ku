// Workout Tracker - HTML, CSS, dan JavaScript murni.
// Data disimpan di localStorage browser, jadi tidak butuh server.

const STORAGE_KEY = 'workout-tracker:v1';

const form = document.getElementById('workout-form');
const dateInput = document.getElementById('w-date');
const nameInput = document.getElementById('w-name');
const setsInput = document.getElementById('w-sets');
const repsInput = document.getElementById('w-reps');
const weightInput = document.getElementById('w-weight');
const history = document.getElementById('history');
const emptyMessage = document.getElementById('empty');
const chart = document.getElementById('chart');
const statDays = document.getElementById('stat-days');
const statSets = document.getElementById('stat-sets');
const statVolume = document.getElementById('stat-volume');

let workouts = loadWorkouts();

function loadWorkouts() {
      try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
      } catch (error) {
            return [];
      }
}

function saveWorkouts() {
      try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      } catch (error) {
            // Penyimpanan penuh atau diblokir: aplikasi tetap jalan tanpa menyimpan.
      }
}

function toDateString(date) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(dateString) {
      return new Date(`${dateString}T00:00:00`).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
      });
}

function formatNumber(value) {
      return Number(value.toFixed(1)).toLocaleString('id-ID');
}

function volumeOf(workout) {
      return workout.sets * workout.reps * workout.weight;
}

// Daftar 7 tanggal terakhir (hari ini paling akhir).
function lastSevenDays() {
      const days = [];
      for (let offset = 6; offset >= 0; offset--) {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            days.push(date);
      }
      return days;
}

function addWorkout(entry) {
      workouts.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ...entry
      });
      saveWorkouts();
      render();
}

function deleteWorkout(id) {
      workouts = workouts.filter((item) => item.id !== id);
      saveWorkouts();
      render();
}

function renderStats() {
      const dayStrings = lastSevenDays().map(toDateString);
      const recent = workouts.filter((item) => dayStrings.includes(item.date));

      statDays.textContent = new Set(recent.map((item) => item.date)).size;
      statSets.textContent = recent.reduce((total, item) => total + item.sets, 0);
      statVolume.textContent = formatNumber(recent.reduce((total, item) => total + volumeOf(item), 0));
}

function renderChart() {
      const days = lastSevenDays();
      const setsPerDay = days.map((date) => {
            const dateString = toDateString(date);
            return workouts
                  .filter((item) => item.date === dateString)
                  .reduce((total, item) => total + item.sets, 0);
      });
      const maxSets = Math.max(...setsPerDay, 1);

      const columns = days.map((date, index) => {
            const column = document.createElement('div');
            column.className = 'bar-col';

            const value = document.createElement('span');
            value.className = 'bar-value';
            value.textContent = setsPerDay[index] || '';

            const bar = document.createElement('div');
            bar.className = 'bar' + (setsPerDay[index] ? ' has-data' : '');
            bar.style.height = `${(setsPerDay[index] / maxSets) * 100}px`;

            const label = document.createElement('span');
            label.className = 'bar-label';
            label.textContent = date.toLocaleDateString('id-ID', { weekday: 'short' });

            column.append(value, bar, label);
            return column;
      });

      chart.replaceChildren(...columns);
}

function buildEntry(workout) {
      const item = document.createElement('li');
      item.className = 'entry';

      const body = document.createElement('div');
      body.className = 'entry-body';

      const name = document.createElement('div');
      name.className = 'entry-name';
      name.textContent = workout.name;

      const detail = document.createElement('div');
      detail.className = 'entry-detail';
      const load = workout.weight > 0 ? `${formatNumber(workout.weight)} kg` : 'berat badan';
      detail.textContent = `${workout.sets} set \u00d7 ${workout.reps} reps \u00b7 ${load}`;

      body.append(name, detail);

      const remove = document.createElement('button');
      remove.className = 'delete';
      remove.type = 'button';
      remove.textContent = '\u00d7';
      remove.setAttribute('aria-label', `Hapus: ${workout.name}`);
      remove.addEventListener('click', () => deleteWorkout(workout.id));

      item.append(body, remove);
      return item;
}

function renderHistory() {
      emptyMessage.hidden = workouts.length > 0;

      const dates = [...new Set(workouts.map((item) => item.date))].sort().reverse();

      const groups = dates.map((date) => {
            const entries = workouts.filter((item) => item.date === date);
            const totalSets = entries.reduce((total, item) => total + item.sets, 0);

            const group = document.createElement('div');
            group.className = 'day';

            const header = document.createElement('div');
            header.className = 'day-header';
            const title = document.createElement('span');
            title.textContent = formatDate(date);
            const summary = document.createElement('span');
            summary.textContent = `${totalSets} set`;
            header.append(title, summary);

            const listElement = document.createElement('ul');
            listElement.className = 'entries';
            listElement.append(...entries.map(buildEntry));

            group.append(header, listElement);
            return group;
      });

      history.replaceChildren(...groups);
}

function render() {
      renderStats();
      renderChart();
      renderHistory();
}

form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;

      addWorkout({
            date: dateInput.value,
            name,
            sets: Number(setsInput.value),
            reps: Number(repsInput.value),
            weight: Number(weightInput.value) || 0
      });

      nameInput.value = '';
      setsInput.value = '';
      repsInput.value = '';
      weightInput.value = '';
      nameInput.focus();
});

dateInput.value = toDateString(new Date());
render();
