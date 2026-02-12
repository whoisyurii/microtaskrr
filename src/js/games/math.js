export class MathGame {
  constructor() {
    this.problemEl = document.getElementById("math-problem");
    this.inputEl = document.getElementById("math-input");
    this.feedbackEl = document.getElementById("math-feedback");
    this.streakEl = document.getElementById("math-streak");
    this.correctEl = document.getElementById("math-correct");
    this.bestStreakEl = document.getElementById("math-best-streak");
    this.streak = 0;
    this.bestStreak = 0;
    this.correct = 0;
    this.total = 0;
    this.answer = 0;
    this.boundKeydown = this.onKeydown.bind(this);
  }

  start() {
    this.streak = 0;
    this.bestStreak = 0;
    this.correct = 0;
    this.total = 0;
    this.feedbackEl.textContent = "";
    this.feedbackEl.className = "math-feedback";
    this.updateDisplay();
    this.nextProblem();
    this.inputEl.addEventListener("keydown", this.boundKeydown);
    this.inputEl.focus();
  }

  stop() {
    this.inputEl.removeEventListener("keydown", this.boundKeydown);
    return {
      correct: this.correct,
      total: this.total,
      streak: this.bestStreak,
    };
  }

  nextProblem() {
    const ops = ["+", "−", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;

    switch (op) {
      case "+":
        a = this.rand(1, 50);
        b = this.rand(1, 50);
        this.answer = a + b;
        break;
      case "−":
        a = this.rand(2, 50);
        b = this.rand(1, a);
        this.answer = a - b;
        break;
      case "×":
        a = this.rand(2, 12);
        b = this.rand(2, 12);
        this.answer = a * b;
        break;
      case "÷":
        b = this.rand(2, 12);
        this.answer = this.rand(1, 12);
        a = b * this.answer;
        break;
    }

    this.problemEl.textContent = `${a} ${op} ${b}`;
    this.inputEl.value = "";
  }

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  onKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.submit();
    }
  }

  submit() {
    const val = parseInt(this.inputEl.value, 10);
    if (isNaN(val)) return;

    this.total++;

    if (val === this.answer) {
      this.correct++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.feedbackEl.textContent = "Correct!";
      this.feedbackEl.className = "math-feedback correct";
    } else {
      this.streak = 0;
      this.feedbackEl.textContent = `Wrong — ${this.answer}`;
      this.feedbackEl.className = "math-feedback incorrect";
    }

    this.updateDisplay();

    // Clear feedback after a brief moment
    setTimeout(() => {
      this.feedbackEl.textContent = "";
      this.feedbackEl.className = "math-feedback";
    }, 800);

    this.nextProblem();
  }

  updateDisplay() {
    this.streakEl.textContent = `Streak: ${this.streak}`;
    this.correctEl.textContent = `${this.correct}/${this.total}`;
    this.bestStreakEl.textContent = `Best: ${this.bestStreak}`;
  }
}
