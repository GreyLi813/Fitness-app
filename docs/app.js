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
    item.className = "list__item";

    item.innerHTML = `
      <div class="list__item-header">
        <div>
          <div class="list__item-title">${exercise.name}</div>
          <div class="list__meta">
            <span>组数: ${exercise.sets}</span>
            <span>休息: ${exercise.rest}s</span>
          </div>
        </div>
        <button class="button button--danger" data-action="delete">删除</button>
      </div>
      <div class="list__actions">
        <button class="button button--primary" data-action="start">开始休息</button>
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
      startTimer(exercise);
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
  remainingSeconds = exercise.rest;
  timerExercise.textContent = `动作: ${exercise.name}`;
  timerCount.textContent = formatTime(remainingSeconds);
  showTimer();
  intervalId = setInterval(tickTimer, 1000);
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
    sets,
    rest,
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
