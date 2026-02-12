export class ReactionGame {
  constructor() {
    this.zoneEl = document.getElementById("reaction-zone");
    this.textEl = document.getElementById("reaction-text");
    this.hintEl = document.getElementById("reaction-hint");
    this.timeEl = document.getElementById("reaction-time");
    this.bestEl = document.getElementById("reaction-best");
    this.avgEl = document.getElementById("reaction-avg");
    this.state = "idle";
    this.bestMs = null;
    this.times = [];
    this.timeout = null;
    this.readyAt = 0;
    this.boundKeydown = this.onKeydown.bind(this);
  }

  start() {
    this.state = "idle";
    this.bestMs = null;
    this.times = [];
    this.textEl.textContent = "Press Space to start";
    this.hintEl.textContent = "Press Space as fast as you can!";
    this.hintEl.style.display = "";
    this.timeEl.textContent = "";
    this.zoneEl.className = "reaction-zone";
    this.bestEl.textContent = "Best: —";
    this.avgEl.textContent = "Avg: —";
    document.addEventListener("keydown", this.boundKeydown);
  }

  stop() {
    document.removeEventListener("keydown", this.boundKeydown);
    clearTimeout(this.timeout);
    const avg = this.times.length > 0
      ? Math.round(this.times.reduce((a, b) => a + b, 0) / this.times.length)
      : 0;
    return {
      ms: this.bestMs || 0,
      avg,
      attempts: this.times.length,
    };
  }

  onKeydown(e) {
    if (e.key === " ") {
      e.preventDefault();
      this.onAction();
    }
  }

  onAction() {
    switch (this.state) {
      case "idle":
      case "result":
      case "too-early":
        this.startWaiting();
        break;
      case "waiting":
        this.tooEarly();
        break;
      case "ready":
        this.recordTime();
        break;
    }
  }

  startWaiting() {
    this.state = "waiting";
    this.zoneEl.className = "reaction-zone waiting";
    this.textEl.textContent = "Wait for green...";
    this.hintEl.style.display = "none";
    this.timeEl.textContent = "";

    const delay = 1500 + Math.random() * 3500;
    this.timeout = setTimeout(() => this.goGreen(), delay);
  }

  goGreen() {
    this.state = "ready";
    this.readyAt = performance.now();
    this.zoneEl.className = "reaction-zone ready";
    this.textEl.textContent = "SPACE!";
  }

  tooEarly() {
    clearTimeout(this.timeout);
    this.state = "too-early";
    this.zoneEl.className = "reaction-zone too-early";
    this.textEl.textContent = "Too early!";
    this.hintEl.textContent = "Press Space to retry";
    this.hintEl.style.display = "";
    this.timeEl.textContent = "";
  }

  recordTime() {
    const ms = Math.round(performance.now() - this.readyAt);
    this.state = "result";
    this.zoneEl.className = "reaction-zone result";
    this.textEl.textContent = "";
    this.hintEl.textContent = "Press Space for next round";
    this.hintEl.style.display = "";
    this.timeEl.textContent = `${ms}ms`;

    this.times.push(ms);
    if (this.bestMs === null || ms < this.bestMs) this.bestMs = ms;

    const avg = Math.round(
      this.times.reduce((a, b) => a + b, 0) / this.times.length
    );
    this.bestEl.textContent = `Best: ${this.bestMs}ms`;
    this.avgEl.textContent = `Avg: ${avg}ms`;
  }
}
