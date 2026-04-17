const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

let state = "start";
let level = 1;

let story = {
  introSeen: false,
  messages: [
    "SYSTEM BOOTING...",
    "ROBOT CORE: DAMAGED",
    "OBJECTIVE: COLLECT ENERGY CORES",
    "RESTORE SYSTEM FUNCTION"
  ],
  messageIndex: 0
};

let spawnPoint = { x: 50, y: 300 };

let player = {
  x: spawnPoint.x,
  y: spawnPoint.y,
  width: 30,
  height: 30,
  dx: 0,
  dy: 0,
  speed: 3,
  jumping: false
};

const gravity = 0.6;

let energy = 100;

let levels = {
  1: {
    platforms: [
      { x: 0, y: 380, width: 800, height: 20 },
      { x: 120, y: 320, width: 90, height: 10 },
      { x: 260, y: 270, width: 90, height: 10 },
      { x: 400, y: 220, width: 90, height: 10 }
    ],
    coins: [
      { x: 140, y: 280, r: 8, collected: false },
      { x: 280, y: 230, r: 8, collected: false },
      { x: 420, y: 180, r: 8, collected: false }
    ],
    spikes: [
      { x: 320, y: 360, w: 30, h: 30 }
    ],
    checkpoint: { x: 400, y: 180, reached: false }
  },

  2: {
    platforms: [
      { x: 0, y: 380, width: 800, height: 20 },
      { x: 100, y: 330, width: 80, height: 10 },
      { x: 220, y: 280, width: 80, height: 10 },
      { x: 340, y: 230, width: 80, height: 10 },
      { x: 460, y: 180, width: 80, height: 10 },
      { x: 580, y: 130, width: 80, height: 10 }
    ],
    coins: [
      { x: 120, y: 300, r: 8, collected: false },
      { x: 240, y: 250, r: 8, collected: false },
      { x: 360, y: 200, r: 8, collected: false },
      { x: 480, y: 150, r: 8, collected: false },
      { x: 600, y: 100, r: 8, collected: false }
    ],
    spikes: [
      { x: 200, y: 360, w: 30, h: 30 },
      { x: 420, y: 360, w: 30, h: 30 }
    ],
    checkpoint: { x: 580, y: 130, reached: false }
  }
};

let movingPlatform = {
  x: 250,
  y: 240,
  width: 80,
  height: 10,
  dir: 1,
  speed: 3
};

document.addEventListener("keydown", (e) => {
  if (state === "start") {
    if (!story.introSeen) {
      story.introSeen = true;
    } else {
      story.messageIndex++;
      if (story.messageIndex >= story.messages.length) {
        state = "playing";
      }
    }
    return;
  }

  if (state !== "playing") return;

  if (e.key === "ArrowLeft") player.dx = -player.speed;
  if (e.key === "ArrowRight") player.dx = player.speed;

  if (e.key === " ") {
    if (!player.jumping) {
      player.dy = -11;
      player.jumping = true;
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.dx = 0;
  }
});

function collide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function respawn() {
  player.x = spawnPoint.x;
  player.y = spawnPoint.y;
  player.dy = 0;

  energy -= 15;

  if (energy <= 0) {
    state = "dead";
  }
}

function restart() {
  state = "start";
  level = 1;
  energy = 100;
  story.messageIndex = 0;
  story.introSeen = false;
  resetLevel();
}

function resetLevel() {
  let lvl = levels[level];

  player.x = 50;
  player.y = 300;
  player.dx = 0;
  player.dy = 0;

  spawnPoint = { x: 50, y: 300 };

  lvl.coins.forEach(c => c.collected = false);
  lvl.checkpoint.reached = false;

  movingPlatform.x = 250;
}

function update() {
  if (state !== "playing") return;

  let lvl = levels[level];

  energy -= 0.06;
  if (energy <= 0) state = "dead";

  player.x += player.dx;
  player.dy += gravity;
  player.y += player.dy;

  player.jumping = true;

  let allPlatforms = [...lvl.platforms, movingPlatform];

  allPlatforms.forEach(p => {
    if (collide(player, p)) {
      if (player.dy > 0) {
        player.y = p.y - player.height;
        player.dy = 0;
        player.jumping = false;
      }
    }
  });

  movingPlatform.x += movingPlatform.dir * movingPlatform.speed;
  if (movingPlatform.x > 500 || movingPlatform.x < 120) {
    movingPlatform.dir *= -1;
  }

  lvl.coins.forEach(c => {
    if (
      !c.collected &&
      player.x < c.x + c.r &&
      player.x + player.width > c.x &&
      player.y < c.y + c.r &&
      player.y + player.height > c.y
    ) {
      c.collected = true;
      energy = Math.min(100, energy + 10);
    }
  });

  lvl.spikes.forEach(s => {
    if (
      player.x < s.x + s.w &&
      player.x + player.width > s.x &&
      player.y < s.y + s.h &&
      player.y + player.height > s.y
    ) {
      respawn();
    }
  });

  if (collide(player, lvl.checkpoint)) {
    spawnPoint = { x: lvl.checkpoint.x, y: lvl.checkpoint.y - 40 };
    lvl.checkpoint.reached = true;
  }

  let done = lvl.coins.every(c => c.collected);

  if (done) {
    level++;
    energy = 100;

    if (level > Object.keys(levels).length) {
      state = "win";
    } else {
      resetLevel();
    }
  }

  if (player.y > canvas.height) {
    respawn();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === "start") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    ctx.font = "28px monospace";
    ctx.fillText("BROKEN ROBOT", 250, 150);

    ctx.fillStyle = "white";
    ctx.font = "16px monospace";

    if (!story.introSeen) {
      ctx.fillText("Press any key to boot system...", 220, 200);
    } else {
      ctx.fillText(story.messages[story.messageIndex], 200, 200);
      ctx.fillText("Press any key to continue", 240, 240);
    }
    return;
  }

  if (state === "dead") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "40px monospace";
    ctx.fillText("SYSTEM FAILURE", 200, 180);

    ctx.font = "18px monospace";
    ctx.fillStyle = "white";
    ctx.fillText("Click to restart simulation", 260, 230);

    canvas.onclick = restart;
    return;
  }

  if (state === "win") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    ctx.font = "28px monospace";
    ctx.fillText("SYSTEM RESTORED", 230, 180);

    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText("The robot remembers fragments of itself...", 150, 220);
    ctx.fillText("But something still lingers in the code.", 170, 250);

    ctx.fillText("Click to restart simulation", 260, 290);

    canvas.onclick = restart;
    return;
  }

  let lvl = levels[level];

  ctx.fillStyle = "white";
  lvl.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  ctx.fillStyle = "cyan";
  ctx.fillRect(movingPlatform.x, movingPlatform.y, movingPlatform.width, movingPlatform.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "gold";
  lvl.coins.forEach(c => {
    if (!c.collected) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = "red";
  lvl.spikes.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));

  ctx.fillStyle = lvl.checkpoint.reached ? "green" : "orange";
  ctx.fillRect(lvl.checkpoint.x, lvl.checkpoint.y, 20, 40);

  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText(`Level: ${level}`, 10, 20);
  ctx.fillText(`Energy: ${Math.floor(energy)}`, 10, 40);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

