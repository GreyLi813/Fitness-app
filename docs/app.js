const form = document.getElementById("exercise-form");
const list = document.getElementById("exercise-list");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("exercise-count");
const timerCard = document.getElementById("timer");
const timerExercise = document.getElementById("timer-exercise");
const timerCount = document.getElementById("timer-count");
const skipTimer = document.getElementById("skip-timer");

let exercises = [];
let activeTimer = null;
let remainingSeconds = 0;
let intervalId = null;

const toPercent = (value) => `${Math.min(100, Math.max(0, value))}%`;

const formatTime = (value) => {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const updateCountLabel = () => {
  const total = exercises.length;
  countLabel.textContent = `${total} 个动作`;
};

const renderList = () => {
  list.innerHTML = "";

  if (exercises.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  exercises.forEach((exercise) => {
    const item = document.createElement("li");
    item.className = `list__item${exercise.completed ? " list__item--done" : ""}`;
    const progress = ((exercise.totalSets - exercise.remainingSets) / exercise.totalSets) * 100;

    item.innerHTML = `
      <div class="list__item-header">
        <div>
          <div class="list__item-title">${exercise.name}</div>
          <div class="list__meta">
            <span>目标: ${exercise.totalSets} 组</span>
            <span>剩余: ${exercise.remainingSets} 组</span>
            <span>休息: ${exercise.rest}s</span>
          </div>
        </div>
        <div class="list__badge">${exercise.remainingSets} / ${exercise.totalSets}</div>
      </div>
      <div class="progress">
        <div class="progress__bar" style="width: ${toPercent(progress)};"></div>
      </div>
      <div class="list__actions">
        <button class="button button--primary" data-action="start" ${
          exercise.completed ? "disabled" : ""
        }>
          ${exercise.completed ? "已完成" : "完成本组并休息"}
        </button>
        <button class="button button--ghost" data-action="delete">删除</button>
      </div>
    `;

    item.querySelector("[data-action='delete']").addEventListener("click", () => {
      if (activeTimer?.id === exercise.id) {
        stopTimer();
      }
      exercises = exercises.filter((item) => item.id !== exercise.id);
      updateCountLabel();
      renderList();
    });

    item.querySelector("[data-action='start']").addEventListener("click", () => {
      if (!exercise.completed) {
        startTimer(exercise);
      }
    });

    list.appendChild(item);
  });
};

const showTimer = () => {
  timerCard.classList.remove("hidden");
};

const hideTimer = () => {
  timerCard.classList.add("hidden");
};

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = null;
  activeTimer = null;
  remainingSeconds = 0;
  hideTimer();
};

const tickTimer = () => {
  if (remainingSeconds <= 0) {
    stopTimer();
    return;
  }
  remainingSeconds -= 1;
  timerCount.textContent = formatTime(remainingSeconds);
};

const startTimer = (exercise) => {
  stopTimer();
  activeTimer = exercise;
  if (exercise.remainingSets > 0) {
    exercise.remainingSets -= 1;
  }
  if (exercise.remainingSets <= 0) {
    exercise.remainingSets = 0;
    exercise.completed = true;
  }
  remainingSeconds = exercise.rest;
  timerExercise.textContent = `动作: ${exercise.name}`;
  timerCount.textContent = formatTime(remainingSeconds);
  showTimer();
  intervalId = setInterval(tickTimer, 1000);
  updateCountLabel();
  renderList();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const sets = Number(data.get("sets"));
  const rest = Number(data.get("rest"));

  if (!name || Number.isNaN(sets) || Number.isNaN(rest) || sets <= 0 || rest < 0) {
    return;
  }

  const exercise = {
    id: Date.now(),
    name,
    totalSets: sets,
    remainingSets: sets,
    rest,
    completed: false,
  };

  exercises = [exercise, ...exercises];
  form.reset();
  updateCountLabel();
  renderList();
});

skipTimer.addEventListener("click", () => {
  stopTimer();
});

updateCountLabel();
renderList();
