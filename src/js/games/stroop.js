export class StroopGame {
  constructor() {
    this.wordEl = document.getElementById("stroop-word");
    this.feedbackEl = document.getElementById("stroop-feedback");
    this.streakEl = document.getElementById("stroop-streak");
    this.correctEl = document.getElementById("stroop-correct");
    this.totalEl = document.getElementById("stroop-total");
    this.colors = [
      { name: "RED", hex: "#e94560", key: "r" },
      { name: "BLUE", hex: "#5b8def", key: "b" },
      { name: "GREEN", hex: "#4ecca3", key: "g" },
      { name: "YELLOW", hex: "#f5c542", key: "y" },
    ];
    this.correct = 0;
    this.total = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.currentDisplayColor = null;
    this.waiting = false;
    this.timeout = null;
    this.boundKeydown = this.onKeydown.bind(this);
  }

  start() {
    this.correct = 0;
    this.total = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.waiting = false;
    this.feedbackEl.textContent = "";
    this.feedbackEl.className = "stroop-feedback";
    this.updateDisplay();
    document.addEventListener("keydown", this.boundKeydown);
    this.nextRound();
  }

  stop() {
    document.removeEventListener("keydown", this.boundKeydown);
    clearTimeout(this.timeout);
    return {
      correct: this.correct,
      total: this.total,
      streak: this.bestStreak,
    };
  }

  nextRound() {
    this.waiting = false;
    // Pick a word and a DIFFERENT display color
    const wordColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    let displayColor;
    do {
      displayColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    } while (displayColor.name === wordColor.name);

    this.currentDisplayColor = displayColor;
    this.wordEl.textContent = wordColor.name;
    this.wordEl.style.color = displayColor.hex;
  }

  onKeydown(e) {
    if (this.waiting) return;

    const pressed = e.key.toLowerCase();
    const match = this.colors.find((c) => c.key === pressed);
    if (!match) return;
    e.preventDefault();

    this.total++;
    if (match.name === this.currentDisplayColor.name) {
      this.correct++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.feedbackEl.textContent = "Correct!";
      this.feedbackEl.className = "stroop-feedback correct";
    } else {
      this.streak = 0;
      this.feedbackEl.textContent = `Wrong — it was ${this.currentDisplayColor.name}`;
      this.feedbackEl.className = "stroop-feedback incorrect";
    }

    this.updateDisplay();
    this.waiting = true;
    this.wordEl.style.color = "transparent";

    this.timeout = setTimeout(() => {
      this.feedbackEl.textContent = "";
      this.feedbackEl.className = "stroop-feedback";
      this.nextRound();
    }, 600);
  }

  updateDisplay() {
    this.streakEl.textContent = `Streak: ${this.streak}`;
    this.correctEl.textContent = `${this.correct}/${this.total}`;
    this.totalEl.textContent = `Best: ${this.bestStreak}`;
  }
}
