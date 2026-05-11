const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let deck = [];
let player = [];
let dealer = [];
let bank = 100;
let bet = 1;
let currencySymbol = localStorage.getItem("noirjackCurrencySymbol") || "£";
let currencyLabel = localStorage.getItem("noirjackCurrencyLabel") || "Pound";

if (!["£", "$", "€"].includes(currencySymbol)) {
  currencySymbol = "£";
  currencyLabel = "Pound";
  localStorage.setItem("noirjackCurrencySymbol", currencySymbol);
  localStorage.setItem("noirjackCurrencyLabel", currencyLabel);
}
let soundsOn = localStorage.getItem("noirjackSoundsOn") !== "false";
let backgroundTheme = localStorage.getItem("noirjackBackgroundTheme") || "green";
let inRound = false;
let dealingInProgress = false;
let settlingRound = false;
let hideDealer = true;
let animatedCards = [];

const bankEl = document.getElementById("bank");
const bankButton = document.getElementById("bankButton");
const topUpScreen = document.getElementById("topUpScreen");
const closeTopUp = document.getElementById("closeTopUp");
const topUpOptions = document.querySelectorAll(".topup-option");
const betEl = document.getElementById("bet");
const messageEl = document.getElementById("message");
const tableEl = document.getElementById("table");
const dealerCardsEl = document.getElementById("dealerCards");
const playerCardsEl = document.getElementById("playerCards");
const dealerScoreEl = document.getElementById("dealerScore");
const playerScoreEl = document.getElementById("playerScore");

const dealBtn = document.getElementById("deal");
const hitBtn = document.getElementById("hit");
const stayBtn = document.getElementById("stay");
const hintBtn = document.getElementById("hint");
const plusBetBtn = document.getElementById("plusBet");
const minusBetBtn = document.getElementById("minusBet");
const menuBtn = document.getElementById("menuBtn");
const settingsPanel = document.getElementById("settingsPanel");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettings = document.getElementById("closeSettings");
const soundToggle = document.getElementById("soundToggle");
const currencyOptions = document.querySelectorAll(".currency-option");
const themeOptions = document.querySelectorAll(".theme-option");
const collapsibleButtons = document.querySelectorAll(".setting-collapse");
const chipButtons = document.querySelectorAll(".chip");

const particleLayer = document.getElementById("particleLayer");

let stats = JSON.parse(localStorage.getItem("noirjackStats") || "{}");

stats = {
  wins: Number(stats.wins || 0),
  losses: Number(stats.losses || 0),
  blackjacks: Number(stats.blackjacks || 0),
  bestStreak: Number(stats.bestStreak || 0),
  currentStreak: Number(stats.currentStreak || 0),
  hands: Number(stats.hands || 0),
  sessionProfit: Number(stats.sessionProfit || 0)
};

function saveStats(){
  localStorage.setItem("noirjackStats", JSON.stringify(stats));
}

function updateStatsUI(){
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("statWins", stats.wins);
  setText("statLosses", stats.losses);
  setText("statBlackjacks", stats.blackjacks);
  setText("statCurrentStreak", stats.currentStreak);
  setText("statStreak", stats.bestStreak);
  setText("statHands", stats.hands);
  setText("statProfit", money(stats.sessionProfit));
}

function chipSound(){
  try{
    const ctx = new(window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = 920;

    gain.gain.setValueAtTime(.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + .08);
  }catch(e){}
}

function blackjackParticles(){
  for(let i=0;i<28;i++){
    const p = document.createElement("div");
    p.className = "particle";

    const x = (Math.random()*400-200) + "px";
    const y = (Math.random()*-400-80) + "px";

    p.style.left = (window.innerWidth/2) + "px";
    p.style.top = (window.innerHeight/2) + "px";
    p.style.setProperty("--x", x);
    p.style.setProperty("--y", y);

    particleLayer.appendChild(p);

    setTimeout(()=>p.remove(),1400);
  }
}

const splashScreen = document.getElementById("splashScreen");
const gameApp = document.getElementById("gameApp");
const playBtn = document.getElementById("playBtn");
const resetStatsBtn = document.getElementById("resetStats");

let audioCtx;


/* V23 custom particle network splash animation */
const splashParticles = document.getElementById("splashParticles");
const appParticles = document.getElementById("appParticles");
let splashParticleAnimationId = null;

function startSplashParticles() {
  if (!splashParticles) return;

  const ctx = splashParticles.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!ctx || prefersReducedMotion) return;

  let particles = [];
  let width = 0;
  let height = 0;
  let pointer = { x: null, y: null, active: false };

  function resizeParticles() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = splashParticles.offsetWidth;
    height = splashParticles.offsetHeight;

    splashParticles.width = Math.floor(width * ratio);
    splashParticles.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(34, Math.min(86, Math.floor((width * height) / 13500)));

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.4 + .6
    }));
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -12 || p.x > width + 12) p.vx *= -1;
      if (p.y < -12 || p.y > height + 12) p.vy *= -1;

      ctx.beginPath();
      ctx.globalAlpha = .68;
      ctx.fillStyle = "#f5f5f2";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 118;

        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.globalAlpha = (1 - distance / maxDistance) * .28;
          ctx.strokeStyle = "#f5f5f2";
          ctx.lineWidth = .7;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      if (pointer.active && pointer.x !== null) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 135;

        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.globalAlpha = (1 - distance / maxDistance) * .38;
          ctx.strokeStyle = "#d9ff6a";
          ctx.lineWidth = .8;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    splashParticleAnimationId = requestAnimationFrame(drawParticles);
  }

  splashParticles.addEventListener("pointermove", event => {
    const rect = splashParticles.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });

  splashParticles.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resizeParticles, { passive: true });

  resizeParticles();
  drawParticles();
}

function stopSplashParticles() {
  if (splashParticleAnimationId) {
    cancelAnimationFrame(splashParticleAnimationId);
    splashParticleAnimationId = null;
  }
}


/* V29 main table particle background */
let appParticleAnimationId = null;
let appParticleResizeBound = false;

function themeColour() {
  const styles = getComputedStyle(document.body);
  const rgb = styles.getPropertyValue("--active-rgb").trim() || "112, 150, 62";
  return `rgb(${rgb})`;
}

function startAppParticles() {
  if (!appParticles) return;

  const ctx = appParticles.getContext("2d");
  if (!ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let particles = [];
  let width = 0;
  let height = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    appParticles.width = Math.floor(width * ratio);
    appParticles.height = Math.floor(height * ratio);
    appParticles.style.width = `${width}px`;
    appParticles.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(28, Math.min(70, Math.floor((width * height) / 16500)));
    particles = Array.from({ length: count }, () => {
      const edge = Math.random();
      let x = Math.random() * width;
      let y = Math.random() * height;

      if (edge < .25) x = Math.random() * 42;
      else if (edge < .5) x = width - Math.random() * 42;
      else if (edge < .75) y = Math.random() * 90;
      else y = height - Math.random() * 90;

      return {
        x,
        y,
        vx: (Math.random() - .5) * .16,
        vy: (Math.random() - .5) * .16,
        r: Math.random() * 1.3 + .55
      };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const accent = themeColour();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      ctx.beginPath();
      ctx.globalAlpha = .42;
      ctx.fillStyle = accent;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const max = 95;

        if (d < max) {
          ctx.beginPath();
          ctx.globalAlpha = (1 - d / max) * .16;
          ctx.strokeStyle = accent;
          ctx.lineWidth = .7;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    appParticleAnimationId = requestAnimationFrame(draw);
  }

  if (appParticleAnimationId) cancelAnimationFrame(appParticleAnimationId);

  resize();

  if (!appParticleResizeBound) {
    window.addEventListener("resize", resize, { passive: true });
    appParticleResizeBound = true;
  }

  draw();
}

function refreshAppParticles() {
  if (appParticleAnimationId) {
    cancelAnimationFrame(appParticleAnimationId);
    appParticleAnimationId = null;
  }
  startAppParticles();
}


function haptic(type = "light") {
  try {
    if (!navigator.vibrate) return;

  const patterns = {
    light: 8,
    tap: 12,
    win: [18, 35, 18],
    lose: [45],
    deal: 10
  };

    navigator.vibrate(patterns[type] || 8);
  } catch (e) {}
}

function money(amount) {
  return `${currencySymbol}${amount}`;
}

function updateBankState() {
  if (!bankButton || !bankEl) return;

  bankButton.classList.remove("bank-low", "bank-critical", "bank-empty");

  if (bank <= 0) {
    bankButton.classList.add("bank-empty");
    bankEl.textContent = "TOP UP";
  } else {
    bankEl.textContent = money(bank);

    if (bank <= 5) {
      bankButton.classList.add("bank-critical");
    } else if (bank <= 25) {
      bankButton.classList.add("bank-low");
    }
  }
}

function openTopUpScreen() {
  if (!topUpScreen) return;
  topUpScreen.hidden = false;
  haptic("tap");
}

function closeTopUpScreen() {
  if (!topUpScreen) return;
  topUpScreen.hidden = true;
  haptic("tap");
}

function addTopUpTokens(amount) {
  bank += amount;
  updateBankState();
  draw();
  closeTopUpScreen();
}

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(type) {
  if (!soundsOn) return;

  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  const notes = type === "win" ? [523.25, 659.25, 783.99] : [220, 174.61];

  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, now + index * 0.11);

    gain.gain.setValueAtTime(0.0001, now + index * 0.11);
    gain.gain.exponentialRampToValueAtTime(0.11, now + index * 0.11 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.11 + 0.16);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now + index * 0.11);
    oscillator.stop(now + index * 0.11 + 0.18);
  });
}

function setResultState(state) {
  tableEl.classList.remove("win", "lose");
  if (state) tableEl.classList.add(state);
}

function buildDeck() {
  deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => deck.push({ suit, rank }));
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function value(hand) {
  let total = 0;
  let aces = 0;

  hand.forEach(card => {
    if (card.rank === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function cardHtml(card, hidden = false, animate = false) {
  if (hidden) return `<div class="card back ${animate ? 'dealing' : ''}"></div>`;

  const red = card.suit === "♥" || card.suit === "♦" ? "red" : "";
  return `
    <div class="card ${red} ${animate ? 'dealing' : ''}">
      <span>${card.rank}</span>
      <span class="suit">${card.suit}</span>
    </div>
  `;
}

function visibleRemainingDeck() {
  const visibleCards = [...player, dealer[0]];
  const fullDeck = [];

  suits.forEach(suit => {
    ranks.forEach(rank => fullDeck.push({ suit, rank }));
  });

  visibleCards.forEach(card => {
    const index = fullDeck.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    if (index !== -1) fullDeck.splice(index, 1);
  });

  return fullDeck;
}

function shuffleCopy(cards) {
  const copy = cards.map(card => ({ ...card }));

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function simulateStayChance(rounds = 1000) {
  const playerTotal = value(player);
  let wins = 0;
  let pushes = 0;
  let losses = 0;

  for (let i = 0; i < rounds; i++) {
    const simulationDeck = shuffleCopy(visibleRemainingDeck());
    const simDealer = [{ ...dealer[0] }, simulationDeck.pop()];

    while (value(simDealer) < 17 && simulationDeck.length) {
      simDealer.push(simulationDeck.pop());
    }

    const dealerTotal = value(simDealer);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      wins++;
    } else if (playerTotal === dealerTotal) {
      pushes++;
    } else {
      losses++;
    }
  }

  return {
    winRate: Math.round((wins / rounds) * 100),
    pushRate: Math.round((pushes / rounds) * 100),
    lossRate: Math.round((losses / rounds) * 100)
  };
}

function showHint() {
  if (!inRound || !dealer.length || !player.length) return;
  setHintPrompt(false);

  const chance = simulateStayChance();
  messageEl.textContent = `WIN ${chance.winRate}%  PUSH ${chance.pushRate}%  LOSE ${chance.lossRate}%`;
}


function openSettings() {
  settingsOverlay.hidden = false;
  settingsPanel.classList.add("open");
  settingsPanel.setAttribute("aria-hidden", "false");
}

function closeSettingsPanel() {
  settingsPanel.classList.remove("open");
  settingsPanel.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    if (!settingsPanel.classList.contains("open")) settingsOverlay.hidden = true;
  }, 220);
}

function setHintPrompt(active) {
  if (!hintBtn) return;
  hintBtn.classList.toggle("hint-prompt", active && inRound && !hintBtn.disabled);
}

function applyBackgroundTheme() {
  document.body.classList.remove("theme-red", "theme-blue", "theme-purple", "theme-green", "theme-orange");
  document.body.classList.add(`theme-${backgroundTheme}`);
}

function syncSettingsUI() {
  soundToggle.textContent = soundsOn ? "On" : "Off";
  soundToggle.classList.toggle("is-on", soundsOn);

  currencyOptions.forEach(option => {
    option.classList.toggle("is-selected", option.dataset.symbol === currencySymbol);
  });

  
collapsibleButtons.forEach(button => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.collapse);
    const icon = button.querySelector(".collapse-icon");
    const expanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!expanded));

    if (panel) panel.hidden = expanded;
    if (icon) icon.textContent = expanded ? "+" : "−";

    haptic("tap");
  });
});


themeOptions.forEach(option => {
    option.classList.toggle("is-selected", option.dataset.theme === backgroundTheme);
  });

  applyBackgroundTheme();
}


function recordWin(amount, naturalBlackjack = false) {
  stats.wins++;
  stats.hands++;
  stats.currentStreak++;
  stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  stats.sessionProfit += amount;
  if (naturalBlackjack) stats.blackjacks++;
}

function recordLoss(amount) {
  stats.losses++;
  stats.hands++;
  stats.currentStreak = 0;
  stats.sessionProfit -= amount;
}

function recordPush() {
  stats.hands++;
}

function draw(animatedIndexes = []) {
  animatedCards = animatedIndexes || [];

  if (!dealerCardsEl || !playerCardsEl) return;

  updateBankState();
  betEl.textContent = money(bet);

  dealerCardsEl.innerHTML = dealer.map((card, index) => {
    const animate = animatedCards.includes(`d${index}`);
    const reveal = animatedCards.includes(`r${index}`);
    const dealerDraw = animatedCards.includes(`dealer${index}`);
    const hidden = hideDealer && index === 1;
    return cardHtml(card, hidden, animate || reveal || dealerDraw)
      .replace('dealing', reveal ? 'reveal' : dealerDraw ? 'dealer-draw' : 'dealing');
  }).join("");

  playerCardsEl.innerHTML = player.map((card, index) => {
    const animate = animatedCards.includes(`p${index}`);
    const playerDraw = animatedCards.includes(`player${index}`);
    return cardHtml(card, false, animate || playerDraw)
      .replace('dealing', playerDraw ? 'player-draw' : 'dealing');
  }).join("");

  dealerScoreEl.textContent = hideDealer && dealer.length ? value([dealer[0]]) : value(dealer);
  playerScoreEl.textContent = value(player);

  dealBtn.disabled = inRound || dealingInProgress || bank < bet;
  hitBtn.disabled = !inRound || dealingInProgress;
  stayBtn.disabled = !inRound || dealingInProgress;
  hintBtn.disabled = !inRound || dealingInProgress;
  if (!inRound) setHintPrompt(false);
  plusBetBtn.disabled = inRound || bet >= bank;
  minusBetBtn.disabled = !inRound ? bet <= 1 : true;

  chipButtons.forEach(button => {
    button.disabled = inRound || dealingInProgress;
  });
}

async function startRound() {
  if (bank < bet || dealingInProgress || inRound) return;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  dealingInProgress = true;
  inRound = true;

  setResultState(null);
  if (typeof setHintPrompt === "function") setHintPrompt(false);

  buildDeck();
  player = [];
  dealer = [];
  hideDealer = true;

  messageEl.textContent = "Dealing...";
  draw();

  dealer.push(deck.pop());
  haptic("deal");
  draw(["dealer0"]);
  await wait(220);

  player.push(deck.pop());
  haptic("deal");
  draw(["player0"]);
  await wait(220);

  dealer.push(deck.pop());
  haptic("deal");
  draw(["dealer1"]);
  await wait(220);

  player.push(deck.pop());
  haptic("deal");
  draw(["player1"]);
  await wait(280);

  dealingInProgress = false;
  messageEl.textContent = "Your move.";
  draw();

  if (typeof setHintPrompt === "function") setHintPrompt(true);

  if (value(player) === 21) {
    if (typeof setHintPrompt === "function") setHintPrompt(false);
    await finishRound();
  }
}

function playerHit() {
  if (dealingInProgress || !inRound) return;
  haptic("tap");
  setHintPrompt(false);
  player.push(deck.pop());
  draw([`player${player.length - 1}`]);

  if (value(player) > 21) {
    hideDealer = false;
    bank -= bet;
    recordLoss(bet);
    saveStats();
    updateStatsUI();
    messageEl.textContent = "Bust. Dealer wins.";
    inRound = false;
    setResultState("lose");
    playTone("lose");
    haptic("lose");
  } else {
    messageEl.textContent = "Hit or stay.";
  }

  draw();
}

async function finishRound() {
  if (settlingRound) return;
  if (dealingInProgress && player.length < 2) return;
  settlingRound = true;
  setHintPrompt(false);
  haptic("tap");
  hideDealer = false;
  draw(["r1"]);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  await wait(360);

  while (value(dealer) < 17) {
    dealer.push(deck.pop());
    haptic("deal");
    draw([`dealer${dealer.length - 1}`]);
    await wait(360);
  }

  const playerTotal = value(player);
  const dealerTotal = value(dealer);

  if (playerTotal > 21) {
    bank -= bet;
    recordLoss(bet);
    messageEl.textContent = "Bust. Dealer wins.";
    setResultState("lose");
    playTone("lose");
    haptic("lose");
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    const naturalBlackjack = playerTotal === 21 && player.length === 2;
    const win = naturalBlackjack ? Math.floor(bet * 1.5) : bet;

    bank += win;
    recordWin(win, naturalBlackjack);
    messageEl.textContent = `You win ${money(win)}.`;
    setResultState("win");
    playTone("win");
    haptic("win");

    if (naturalBlackjack) blackjackParticles();
  } else if (playerTotal < dealerTotal) {
    bank -= bet;
    recordLoss(bet);
    messageEl.textContent = "Dealer wins.";
    setResultState("lose");
    playTone("lose");
    haptic("lose");
  } else {
    recordPush();
    messageEl.textContent = "Push. Bet returned.";
    setResultState(null);
  }

  inRound = false;

  if (bank <= 0) {
    bank = 0;
    messageEl.textContent = "Bank empty. Tap TOP UP.";
  }

  saveStats();
  updateStatsUI();
  settlingRound = false;
  draw();
}

plusBetBtn.addEventListener("click", () => {
  if (bet < bank) {
    bet += 1;
    haptic("tap");
    chipSound();
  }
  draw();
});

minusBetBtn.addEventListener("click", () => {
  if (bet > 1) {
    bet -= 1;
    haptic("tap");
    chipSound();
  }
  draw();
});

dealBtn.addEventListener("click", startRound);
hitBtn.addEventListener("click", playerHit);
stayBtn.addEventListener("click", finishRound);
hintBtn.addEventListener("click", showHint);

if (bankButton) {
  bankButton.addEventListener("click", () => {
    if (bank <= 0) openTopUpScreen();
  });
}

if (closeTopUp) {
  closeTopUp.addEventListener("click", closeTopUpScreen);
}

if (topUpScreen) {
  topUpScreen.addEventListener("click", event => {
    if (event.target === topUpScreen) closeTopUpScreen();
  });
}

topUpOptions.forEach(option => {
  option.addEventListener("click", () => {
    const seconds = Number(option.dataset.seconds);
    const tokens = Number(option.dataset.tokens);

    option.disabled = true;
    const originalText = option.innerHTML;
    option.innerHTML = `<strong>Watching ad...</strong><span>${seconds} second reward simulated</span>`;

    setTimeout(() => {
      option.disabled = false;
      option.innerHTML = originalText;
      addTopUpTokens(tokens);
    }, 650);
  });
});

menuBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsPanel);
settingsOverlay.addEventListener("click", closeSettingsPanel);

soundToggle.addEventListener("click", () => {
  soundsOn = !soundsOn;
  localStorage.setItem("noirjackSoundsOn", soundsOn);
  updateStatsUI();
syncSettingsUI();
});

currencyOptions.forEach(option => {
  option.addEventListener("click", () => {
    currencySymbol = option.dataset.symbol;
    currencyLabel = option.dataset.label;
    localStorage.setItem("noirjackCurrencySymbol", currencySymbol);
    localStorage.setItem("noirjackCurrencyLabel", currencyLabel);
    updateStatsUI();
syncSettingsUI();
    draw();
  });
});


collapsibleButtons.forEach(button => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.collapse);
    const icon = button.querySelector(".collapse-icon");
    const expanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!expanded));

    if (panel) panel.hidden = expanded;
    if (icon) icon.textContent = expanded ? "+" : "−";

    haptic("tap");
  });
});


themeOptions.forEach(option => {
  option.addEventListener("click", event => {
    event.preventDefault();
    backgroundTheme = option.dataset.theme;
    localStorage.setItem("noirjackBackgroundTheme", backgroundTheme);
    syncSettingsUI();
    refreshAppParticles();
    haptic("tap");
  });
});

playBtn.addEventListener("click", () => {
  haptic("tap");
  stopSplashParticles();
  splashScreen.classList.add("hide");
  gameApp.classList.remove("app-hidden");
  gameApp.classList.add("app-ready");
  startAppParticles();
});

chipButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (inRound) return;

    haptic("tap");
    chipSound();

    const value = button.dataset.chip;

    if (value === "clear") {
      bet = 1;
    } else {
      bet = Math.min(bank, bet + Number(value));
    }

    draw();
  });
});

updateStatsUI();
if (resetStatsBtn) {
  resetStatsBtn.addEventListener("click", () => {
    stats = {
      wins: 0,
      losses: 0,
      blackjacks: 0,
      bestStreak: 0,
      currentStreak: 0,
      hands: 0,
      sessionProfit: 0
    };
    saveStats();
    updateStatsUI();
    haptic("tap");
  });
}

syncSettingsUI();
updateStatsUI();
draw();
startSplashParticles();
