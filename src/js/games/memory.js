export class MemoryGame {
  constructor() {
    this.container = document.getElementById("memory-game");
    this.statusEl = document.getElementById("memory-status");
    this.levelEl = document.getElementById("memory-level");
    this.bestLevelEl = document.getElementById("memory-best-level");
    this.tiles = {
      up: document.getElementById("memory-up"),
      down: document.getElementById("memory-down"),
      left: document.getElementById("memory-left"),
      right: document.getElementById("memory-right"),
    };
    this.tileKeys = ["up", "down", "left", "right"];
    this.sequence = [];
    this.inputIndex = 0;
    this.level = 0;
    this.bestLevel = 0;
    this.state = "idle"; // idle | showing | input | gameover
    this.timeouts = [];
    this.boundKeydown = this.onKeydown.bind(this);
  }

  start() {
    this.level = 0;
    this.bestLevel = 0;
    this.sequence = [];
    this.inputIndex = 0;
    this.state = "idle";
    this.statusEl.textContent = "";
    this.updateDisplay();
    document.addEventListener("keydown", this.boundKeydown);
    this.nextLevel();
  }

  stop() {
    document.removeEventListener("keydown", this.boundKeydown);
    this.clearTimeouts();
    this.clearTiles();
    return { level: this.level, bestLevel: this.bestLevel };
  }

  clearTimeouts() {
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts = [];
  }

  clearTiles() {
    for (const key of this.tileKeys) {
      this.tiles[key].className = "memory-tile";
    }
  }

  nextLevel() {
    this.level++;
    if (this.level > this.bestLevel) this.bestLevel = this.level;
    this.updateDisplay();
    // Add one random tile to the sequence
    this.sequence.push(this.tileKeys[Math.floor(Math.random() * 4)]);
    this.inputIndex = 0;
    this.showSequence();
  }

  showSequence() {
    this.state = "showing";
    this.statusEl.textContent = "Watch...";
    this.clearTiles();

    let delay = 300;
    for (let i = 0; i < this.sequence.length; i++) {
      const key = this.sequence[i];
      // Light up
      this.timeouts.push(
        setTimeout(() => {
          this.clearTiles();
          this.tiles[key].classList.add("showing");
        }, delay)
      );
      // Turn off
      this.timeouts.push(
        setTimeout(() => {
          this.tiles[key].classList.remove("showing");
        }, delay + 400)
      );
      delay += 600;
    }

    // After sequence finishes, switch to input mode
    this.timeouts.push(
      setTimeout(() => {
        this.state = "input";
        this.statusEl.textContent = "Your turn!";
      }, delay)
    );
  }

  onKeydown(e) {
    if (this.state !== "input") return;

    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const tile = keyMap[e.key];
    if (!tile) return;
    e.preventDefault();

    if (tile === this.sequence[this.inputIndex]) {
      // Correct
      this.tiles[tile].classList.add("correct");
      this.timeouts.push(
        setTimeout(() => this.tiles[tile].classList.remove("correct"), 200)
      );
      this.inputIndex++;

      if (this.inputIndex >= this.sequence.length) {
        // Completed the level
        this.state = "idle";
        this.statusEl.textContent = "Correct!";
        this.timeouts.push(setTimeout(() => this.nextLevel(), 800));
      }
    } else {
      // Wrong
      this.state = "gameover";
      this.tiles[tile].classList.add("wrong");
      // Highlight the correct one
      this.tiles[this.sequence[this.inputIndex]].classList.add("showing");
      this.statusEl.textContent = `Wrong! Reached level ${this.level}`;

      this.timeouts.push(
        setTimeout(() => {
          this.clearTiles();
          this.level = 0;
          this.sequence = [];
          this.nextLevel();
        }, 1500)
      );
    }
  }

  updateDisplay() {
    this.levelEl.textContent = `Level: ${this.level}`;
    this.bestLevelEl.textContent = `Best: ${this.bestLevel}`;
  }
}
