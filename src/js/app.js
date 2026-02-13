import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { stats } from "./stats.js";
import { TypingGame } from "./games/typing.js";
import { MathGame } from "./games/math.js";
import { SnakeGame } from "./games/snake.js";
import { ReactionGame } from "./games/reaction.js";

const appWindow = getCurrentWindow();

const games = {
  typing: { instance: new TypingGame(), label: "Typing Test" },
  math: { instance: new MathGame(), label: "Math" },
  snake: { instance: new SnakeGame(), label: "Snake" },
  reaction: { instance: new ReactionGame(), label: "Reaction" },
};

const gameIds = Object.keys(games);
let activeGameId = null;
let lastGameId = null;

// Titlebar drag — explicit handler since data-tauri-drag-region can be unreliable
document.getElementById("titlebar").addEventListener("mousedown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
  appWindow.startDragging();
});

function pickRandomGame() {
  const choices = gameIds.filter((id) => id !== lastGameId);
  return choices[Math.floor(Math.random() * choices.length)];
}

function showGame(gameId) {
  document.querySelectorAll(".game-container").forEach((el) => {
    el.classList.remove("active");
  });

  const container = document.getElementById(`${gameId}-game`);
  if (container) container.classList.add("active");

  document.getElementById("game-label").textContent = games[gameId].label;
  document.getElementById("close-hint").classList.add("visible");
}

function setClaudeStatus(text, state) {
  const el = document.getElementById("claude-status");
  el.textContent = text;
  el.className = "claude-status" + (state ? " " + state : "");
}

function hideAllGames() {
  document.querySelectorAll(".game-container").forEach((el) => {
    el.classList.remove("active");
  });
  document.getElementById("idle-screen").classList.add("active");
  document.getElementById("game-label").textContent = "";
  document.getElementById("close-hint").classList.remove("visible");
  setClaudeStatus("", "");
}

async function onShow() {
  await stats.load();
  setClaudeStatus("Claude is thinking...", "thinking");

  const gameId = pickRandomGame();
  activeGameId = gameId;
  lastGameId = gameId;

  showGame(gameId);
  games[gameId].instance.start();
}

async function onHide() {
  if (activeGameId) {
    const result = games[activeGameId].instance.stop();
    if (result) {
      stats.record(activeGameId, result);
      await stats.save();
    }
    activeGameId = null;
  }
  hideAllGames();
  // Hide window and restore focus to the previous app (e.g. terminal)
  invoke("focus_previous_app");
}

// Listen for Tauri events from the backend
listen("microtaskrr-show", () => onShow());
listen("microtaskrr-hide", () => onHide());
listen("microtaskrr-done", () => {
  setClaudeStatus("Done! Press Esc to get back", "done");
});

// Escape key hides the window from any context
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    onHide();
    return;
  }
  // Dev shortcut (only when no input focused)
  if (e.target.tagName === "INPUT") return;
  if (e.key === "s" && !activeGameId) onShow();
});
