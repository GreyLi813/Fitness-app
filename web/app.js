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
