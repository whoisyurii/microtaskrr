const CELL = 20;
const COLS = 24;
const ROWS = 13;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;
const TICK_MS = 125; // ~8 moves/sec

export class SnakeGame {
  constructor() {
    this.canvas = document.getElementById("snake-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.scoreEl = document.getElementById("snake-score");
    this.highEl = document.getElementById("snake-high");
    this.overlayEl = document.getElementById("snake-overlay");
    this.highScore = 0;
    this.running = false;
    this.boundKeydown = this.onKeydown.bind(this);
  }

  start() {
    this.reset();
    this.running = true;
    this.overlayEl.classList.remove("visible");
    document.addEventListener("keydown", this.boundKeydown);
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("keydown", this.boundKeydown);
    clearTimeout(this.restartTimer);
    return { score: this.score };
  }

  reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.food = null;
    this.dead = false;
    this.placeFood();
    this.updateHud();
  }

  placeFood() {
    const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (occupied.has(`${pos.x},${pos.y}`));
    this.food = pos;
  }

  onKeydown(e) {
    const key = e.key.toLowerCase();
    const dirs = {
      arrowup: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const nd = dirs[key];
    if (nd && (nd.x + this.dir.x !== 0 || nd.y + this.dir.y !== 0)) {
      this.nextDir = nd;
      e.preventDefault();
    }
  }

  loop(now) {
    if (!this.running) return;

    if (now - this.lastTick >= TICK_MS) {
      this.lastTick = now;
      this.tick();
    }

    this.draw();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  tick() {
    if (this.dead) return;

    this.dir = this.nextDir;
    const head = this.snake[0];
    const nx = head.x + this.dir.x;
    const ny = head.y + this.dir.y;

    // Wall collision
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      this.die();
      return;
    }

    // Self collision
    for (const seg of this.snake) {
      if (seg.x === nx && seg.y === ny) {
        this.die();
        return;
      }
    }

    this.snake.unshift({ x: nx, y: ny });

    // Food collision
    if (this.food && nx === this.food.x && ny === this.food.y) {
      this.score++;
      this.placeFood();
    } else {
      this.snake.pop();
    }

    this.updateHud();
  }

  die() {
    this.dead = true;
    if (this.score > this.highScore) this.highScore = this.score;
    this.updateHud();
    this.overlayEl.classList.add("visible");

    this.restartTimer = setTimeout(() => {
      if (!this.running) return;
      this.overlayEl.classList.remove("visible");
      this.reset();
    }, 1500);
  }

  draw() {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(CANVAS_W, y * CELL);
      ctx.stroke();
    }

    // Food
    if (this.food) {
      ctx.fillStyle = "#e94560";
      ctx.beginPath();
      ctx.arc(
        this.food.x * CELL + CELL / 2,
        this.food.y * CELL + CELL / 2,
        CELL / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Snake
    this.snake.forEach((seg, i) => {
      const brightness = Math.max(0.4, 1 - i * 0.03);
      ctx.fillStyle =
        i === 0
          ? "#4ecca3"
          : `rgba(78, 204, 163, ${brightness})`;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  updateHud() {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.highEl.textContent = `Best: ${this.highScore}`;
  }
}
