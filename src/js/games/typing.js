import { words as wordList } from "../data/words.js";

export class TypingGame {
  constructor() {
    this.wordsEl = document.getElementById("typing-words");
    this.inputEl = document.getElementById("typing-input");
    this.wpmEl = document.getElementById("typing-wpm");
    this.accEl = document.getElementById("typing-accuracy");
    this.words = [];
    this.currentIndex = 0;
    this.correctWords = 0;
    this.totalAttempted = 0;
    this.correctChars = 0;
    this.startTime = null;
    this.endTime = null;
    this.wpmInterval = null;
    this.done = false;
    this.boundInputKeydown = this.onInputKeydown.bind(this);
    this.boundDocKeydown = this.onDocKeydown.bind(this);
  }

  start() {
    this.generateSentence();
    this.inputEl.addEventListener("keydown", this.boundInputKeydown);
    document.addEventListener("keydown", this.boundDocKeydown);
    this.inputEl.focus();
    this.wpmInterval = setInterval(() => {
      if (!this.done) this.updateWpm();
    }, 500);
  }

  stop() {
    clearInterval(this.wpmInterval);
    this.inputEl.removeEventListener("keydown", this.boundInputKeydown);
    document.removeEventListener("keydown", this.boundDocKeydown);
    return {
      wpm: Math.round(this.calcWpm()),
      accuracy: this.totalAttempted > 0
        ? Math.round((this.correctWords / this.totalAttempted) * 100)
        : 100,
    };
  }

  generateSentence() {
    const len = 5 + Math.floor(Math.random() * 8); // 5-12 words
    this.words = this.shuffle(wordList).slice(0, len);
    this.currentIndex = 0;
    this.correctWords = 0;
    this.totalAttempted = 0;
    this.correctChars = 0;
    this.startTime = null;
    this.endTime = null;
    this.wordResults = {};
    this.done = false;
    this.inputEl.value = "";
    this.inputEl.disabled = false;
    this.wpmEl.textContent = "0 WPM";
    this.accEl.textContent = "100%";
    this.renderWords();
    this.inputEl.focus();
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  renderWords() {
    if (this.done) {
      const wpm = Math.round(this.calcWpm());
      const acc = this.totalAttempted > 0
        ? Math.round((this.correctWords / this.totalAttempted) * 100)
        : 100;
      this.wordsEl.innerHTML =
        `<div class="typing-done">` +
        `<span class="done-wpm">${wpm} WPM</span>` +
        `<span class="done-acc">${acc}% accuracy</span>` +
        `<span class="done-hint">Space or Enter for next sentence</span>` +
        `</div>`;
      return;
    }

    this.wordsEl.innerHTML = this.words
      .map((w, i) => {
        let cls = "word";
        if (i === this.currentIndex) cls += " current";
        else if (i < this.currentIndex) {
          cls += this.wordResults[i] ? " correct" : " incorrect";
        }
        return `<span class="${cls}">${w}</span>`;
      })
      .join("");
  }

  // Fires on the input element — handles word submission while typing
  onInputKeydown(e) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.submitWord();
    }
  }

  // Fires on document — catches Space/Enter for next sentence when input is disabled
  onDocKeydown(e) {
    if (this.done && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      if (this.doneAt && Date.now() - this.doneAt < 100) return;
      this.generateSentence();
    }
  }

  submitWord() {
    const typed = this.inputEl.value.trim();
    if (!typed) return;

    if (!this.startTime) this.startTime = Date.now();

    const expected = this.words[this.currentIndex];
    this.totalAttempted++;

    if (typed === expected) {
      this.correctWords++;
      this.correctChars += expected.length + 1;
      this.wordResults[this.currentIndex] = true;
    } else {
      this.wordResults[this.currentIndex] = false;
    }

    this.currentIndex++;
    this.inputEl.value = "";

    if (this.currentIndex >= this.words.length) {
      this.done = true;
      this.doneAt = Date.now();
      this.endTime = Date.now();
      this.inputEl.disabled = true;
    }

    this.renderWords();
    if (!this.done) {
      this.updateWpm();
      this.updateAccuracy();
    }
  }

  calcWpm() {
    if (!this.startTime || this.correctChars === 0) return 0;
    // Use endTime if sentence is done, otherwise use now
    const end = this.endTime || Date.now();
    const minutes = (end - this.startTime) / 60000;
    if (minutes < 0.01) return 0;
    return (this.correctChars / 5) / minutes;
  }

  updateWpm() {
    this.wpmEl.textContent = `${Math.round(this.calcWpm())} WPM`;
  }

  updateAccuracy() {
    const acc = this.totalAttempted > 0
      ? Math.round((this.correctWords / this.totalAttempted) * 100)
      : 100;
    this.accEl.textContent = `${acc}%`;
  }
}
