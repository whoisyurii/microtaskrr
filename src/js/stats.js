import { invoke } from "@tauri-apps/api/core";

class StatsManager {
  constructor() {
    this.stats = {
      typing: { totalTests: 0, bestWpm: 0, avgWpm: 0 },
      math: { totalProblems: 0, correct: 0, bestStreak: 0 },
      snake: { gamesPlayed: 0, highScore: 0 },
      reaction: { attempts: 0, bestMs: null, avgMs: null },
    };
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    try {
      const raw = await invoke("get_stats");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const key of Object.keys(this.stats)) {
          if (parsed[key]) Object.assign(this.stats[key], parsed[key]);
        }
      }
    } catch {
      // Use defaults
    }
    this.loaded = true;
  }

  async save() {
    try {
      await invoke("save_stats", { stats: JSON.stringify(this.stats) });
    } catch {
      // Silently fail
    }
  }

  record(gameId, result) {
    const s = this.stats[gameId];
    if (!s) return;

    switch (gameId) {
      case "typing":
        s.totalTests++;
        if (result.wpm > s.bestWpm) s.bestWpm = result.wpm;
        s.avgWpm = Math.round(
          (s.avgWpm * (s.totalTests - 1) + result.wpm) / s.totalTests
        );
        break;
      case "math":
        s.totalProblems += result.total;
        s.correct += result.correct;
        if (result.streak > s.bestStreak) s.bestStreak = result.streak;
        break;
      case "snake":
        s.gamesPlayed++;
        if (result.score > s.highScore) s.highScore = result.score;
        break;
      case "reaction":
        if (result.ms > 0) {
          s.attempts++;
          if (s.bestMs === null || result.ms < s.bestMs) s.bestMs = result.ms;
          s.avgMs =
            s.avgMs === null
              ? result.ms
              : Math.round((s.avgMs * (s.attempts - 1) + result.ms) / s.attempts);
        }
        break;
    }
  }

  getSummary(gameId) {
    const s = this.stats[gameId];
    switch (gameId) {
      case "typing":
        return `Best: ${s.bestWpm} WPM | Avg: ${s.avgWpm} WPM | Tests: ${s.totalTests}`;
      case "math":
        return `Correct: ${s.correct}/${s.totalProblems} | Best streak: ${s.bestStreak}`;
      case "snake":
        return `High score: ${s.highScore} | Games: ${s.gamesPlayed}`;
      case "reaction":
        return `Best: ${s.bestMs ?? "—"}ms | Avg: ${s.avgMs ?? "—"}ms | Tries: ${s.attempts}`;
      default:
        return "";
    }
  }
}

export const stats = new StatsManager();
