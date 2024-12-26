const canvas = document.getElementById("canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const CELL_SIZE = 100;
let MAP_WIDTH, MAP_HEIGHT, map;

function initializeMap() {
  MAP_WIDTH = Math.floor(canvas.width / CELL_SIZE);
  MAP_HEIGHT = Math.floor(canvas.height / CELL_SIZE);

  // Reinitialize the map with new dimensions
  map = new Array(MAP_HEIGHT)
    .fill(null)
    .map(() => new Array(MAP_WIDTH).fill(0));

  // Example: Set some cells to 1
  for (let i = 0; i < 7; i++) {
    if (i < MAP_HEIGHT && 4 < MAP_WIDTH) {
      map[4][i] = 1;
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
  initializeMap();
}

// Initial setup
resizeCanvas();

function drawFillRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawStrokeRect(ctx, x, y, width, height, color) {
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, width, height);
}

function drawMap(ctx, cellSize, fillColor, strokeColor) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const posX = x * cellSize;
      const posY = y * cellSize;

      drawStrokeRect(ctx, posX, posY, cellSize, cellSize, strokeColor);

      if (map[y][x] === 1) {
        drawFillRect(ctx, posX, posY, cellSize, cellSize, fillColor);
      } else {
        drawStrokeRect(ctx, posX, posY, cellSize, cellSize, strokeColor);
      }
    }
  }
}

/**
 * Asynchronously loads an image.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));

    img.src = src;
  });
}

let spriteAttack;
let spriteWalk;

async function initialize() {
  spriteAttack = await loadImage("./Shinobi/Attack_1.png");
  spriteWalk = await loadImage("./Shinobi/Walk.png");
}

let frameIndex = 0;
let frameTimer = 0;
let animationSpeed = 0.1;
let walkTimer = 0
let walkSpeed = 0.1;
let walkDirection = 1;
let walkIndex = 0;

let lastTime = performance.now();
const main = async () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
  lastTime = currentTime;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the map
  drawMap(ctx, CELL_SIZE, "#777", "#111");

  // Update sprite animation frame
  frameTimer += deltaTime;
  if (frameTimer >= animationSpeed) {
    frameTimer = 0;
    frameIndex = (frameIndex + 1) % 5;
  }

  walkTimer += deltaTime;
  if (walkTimer >= walkSpeed) {
    walkTimer = 0;
    walkIndex = (walkIndex + 1) % 8;
  }

  // Draw the current frame of the sprite
  ctx.drawImage(
    spriteAttack,
    (spriteAttack.width / 5) * frameIndex,
    0,
    spriteAttack.width / 5,
    spriteAttack.height,
    CELL_SIZE,
    CELL_SIZE * 3,
    CELL_SIZE,
    CELL_SIZE,
  );

  ctx.drawImage(
    spriteWalk,
    (spriteWalk.width / 8) * walkIndex,
    0,
    spriteWalk.width / 8,
    spriteWalk.height,
    CELL_SIZE * 2,
    CELL_SIZE * 3,
    CELL_SIZE,
    CELL_SIZE,
  );

  requestAnimationFrame(main);
};

// Initialize and start the main loop
initialize().then(main);

window.addEventListener("resize", () => {
  resizeCanvas();
});
