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

const guideSteps = [
  "沉肩收紧肩胛骨，双脚稳定踩地。",
  "下放时肘部微内收，保持胸部发力。",
  "核心收紧，动作全程保持控制。",
];

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
    const completedSets = exercise.totalSets - exercise.remainingSets;
    const progress = (completedSets / exercise.totalSets) * 100;
    const nextSet = Math.min(exercise.totalSets, completedSets + 1);
    const guideList = guideSteps.map((step) => `<li>${step}</li>`).join("");

    const isResting = activeTimer?.id === exercise.id && remainingSeconds > 0;
    const isDisabled = exercise.completed || isResting;

    item.innerHTML = `
      <div class="list__item-header">
        <div>
          <div class="list__item-title">${exercise.name}</div>
          <p>目标: ${exercise.totalSets} 组 · 休息: ${exercise.rest}s</p>
          <div class="list__meta">
            <span>剩余: ${exercise.remainingSets} 组</span>
            <span>已完成: ${completedSets} 组</span>
          </div>
        </div>
        <div class="list__badge">${completedSets} / ${exercise.totalSets}</div>
      </div>
      <div class="progress">
        <div class="progress__bar" style="width: ${toPercent(progress)};"></div>
      </div>
      <div class="list__guide">
        <div class="list__guide-title">✨ 动作指南</div>
        <ol>
          ${guideList}
        </ol>
      </div>
      <div class="list__actions">
        <button class="button button--primary is-large" data-action="start" ${
          isDisabled ? "disabled" : ""
        }>
          ${
            exercise.completed
              ? "已完成"
              : isResting
                ? "休息中..."
                : `完成第 ${nextSet} 组`
          }
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
      const isResting = activeTimer?.id === exercise.id && remainingSeconds > 0;
      if (!exercise.completed && !isResting) {
        startTimer(exercise);
      }
    });

    list.appendChild(item);
  });
};

const showTimer = () => {
  timerCard.classList.remove("hidden");
  document.body.classList.add("timer-active");
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
  document.body.classList.remove("timer-active");
  renderList();
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
