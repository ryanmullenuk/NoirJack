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
let inRound = false;
let hideDealer = true;
let animatedCards = [];

const bankEl = document.getElementById("bank");
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
const chipButtons = document.querySelectorAll(".chip");
const splashScreen = document.getElementById("splashScreen");
const gameApp = document.getElementById("gameApp");
const playBtn = document.getElementById("playBtn");

let audioCtx;

function haptic(type = "light") {
  if (!navigator.vibrate) return;

  const patterns = {
    light: 8,
    tap: 12,
    win: [18, 35, 18],
    lose: [45],
    deal: 10
  };

  navigator.vibrate(patterns[type] || 8);
}

function money(amount) {
  return `${currencySymbol}${amount}`;
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

  const chance = simulateStayChance();
  messageEl.textContent = `${chance.winRate}% win • ${chance.pushRate}% push • ${chance.lossRate}% lose if you stay`;
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

function syncSettingsUI() {
  soundToggle.textContent = soundsOn ? "On" : "Off";
  soundToggle.classList.toggle("is-on", soundsOn);

  currencyOptions.forEach(option => {
    option.classList.toggle("is-selected", option.dataset.symbol === currencySymbol);
  });
}

function draw(animatedIndexes = []) {
  animatedCards = animatedIndexes;

  bankEl.textContent = money(bank);
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
    return cardHtml(card, false, animate);
  }).join("");

  dealerScoreEl.textContent = hideDealer && dealer.length ? value([dealer[0]]) : value(dealer);
  playerScoreEl.textContent = value(player);

  dealBtn.disabled = inRound || bank < bet;
  hitBtn.disabled = !inRound;
  stayBtn.disabled = !inRound;
  hintBtn.disabled = !inRound;
  plusBetBtn.disabled = inRound || bet >= bank;
  minusBetBtn.disabled = !inRound ? bet <= 1 : true;

  chipButtons.forEach(button => {
    button.disabled = inRound;
  });
}

function startRound() {
  if (bank < bet) return;

  setResultState(null);
  buildDeck();
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop(), deck.pop()];
  hideDealer = true;
  inRound = true;
  messageEl.textContent = "Dealing...";
  draw();

  setTimeout(() => {
    messageEl.textContent = "Your move.";
    draw();
  }, 450);
  draw();

  if (value(player) === 21) finishRound();
}

function playerHit() {
  haptic("tap");
  player.push(deck.pop());
  draw([`p${player.length - 1}`]);

  if (value(player) > 21) {
    hideDealer = false;
    bank -= bet;
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
    messageEl.textContent = "Bust. Dealer wins.";
    setResultState("lose");
    playTone("lose");
    haptic("lose");
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    const win = playerTotal === 21 && player.length === 2 ? Math.floor(bet * 1.5) : bet;
    bank += win;
    messageEl.textContent = `You win ${money(win)}.`;
    setResultState("win");
    playTone("win");
    haptic("win");
  } else if (playerTotal < dealerTotal) {
    bank -= bet;
    messageEl.textContent = "Dealer wins.";
    setResultState("lose");
    playTone("lose");
    haptic("lose");
  } else {
    messageEl.textContent = "Push. Bet returned.";
    setResultState(null);
  }

  inRound = false;

  if (bank <= 0) {
    bank = 0;
    messageEl.textContent = "Bank empty. Refresh to reset.";
  }

  draw();
}

plusBetBtn.addEventListener("click", () => {
  if (bet < bank) bet += 1;
  draw();
});

minusBetBtn.addEventListener("click", () => {
  if (bet > 1) bet -= 1;
  draw();
});

dealBtn.addEventListener("click", startRound);
hitBtn.addEventListener("click", playerHit);
stayBtn.addEventListener("click", finishRound);
hintBtn.addEventListener("click", showHint);

menuBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsPanel);
settingsOverlay.addEventListener("click", closeSettingsPanel);

soundToggle.addEventListener("click", () => {
  soundsOn = !soundsOn;
  localStorage.setItem("noirjackSoundsOn", soundsOn);
  syncSettingsUI();
});

currencyOptions.forEach(option => {
  option.addEventListener("click", () => {
    currencySymbol = option.dataset.symbol;
    currencyLabel = option.dataset.label;
    localStorage.setItem("noirjackCurrencySymbol", currencySymbol);
    localStorage.setItem("noirjackCurrencyLabel", currencyLabel);
    syncSettingsUI();
    draw();
  });
});

playBtn.addEventListener("click", () => {
  haptic("tap");
  splashScreen.classList.add("hide");
  gameApp.classList.remove("app-hidden");
  gameApp.classList.add("app-ready");
});

chipButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (inRound) return;

    haptic("tap");

    const value = button.dataset.chip;

    if (value === "clear") {
      bet = 1;
    } else {
      bet = Math.min(bank, bet + Number(value));
    }

    draw();
  });
});

syncSettingsUI();
draw();
