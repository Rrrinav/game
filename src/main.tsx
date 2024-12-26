const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let CELL_SIZE: number = 70;
let MAP_WIDTH: number = 0,
  MAP_HEIGHT: number = 0;
let map: number[][];

/**
 * Initializes the map with cells.
 */
function initializeMap(): void {
  MAP_WIDTH = Math.ceil(canvas.width / CELL_SIZE);
  MAP_HEIGHT = Math.ceil(canvas.height / CELL_SIZE);

  // Reinitialize the map with new dimensions
  map = Array.from({ length: MAP_HEIGHT }, () => new Array(MAP_WIDTH).fill(0));

  // Example: Set some cells to 1
  for (let i = 0; i < 7; i++) {
    if (i < MAP_HEIGHT && 4 < MAP_WIDTH) {
      map[4][i] = 1;
    }
  }
}

/**
 * Resizes the canvas and reinitializes the map.
 */
function resizeCanvas(): void {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
  initializeMap();
}

/**
 * Draws a filled rectangle.
 */
function drawFillRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

/**
 * Draws a stroked rectangle.
 */
function drawStrokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, width, height);
}

/**
 * Draws the map grid and cells.
 */
function drawMap(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  fillColor: string,
  strokeColor: string,
): void {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const posX = x * cellSize;
      const posY = y * cellSize;

      drawStrokeRect(ctx, posX, posY, cellSize, cellSize, strokeColor);

      if (map[y][x] === 1) {
        drawFillRect(ctx, posX, posY, cellSize, cellSize, fillColor);
      }
    }
  }
}

/**
 * Asynchronously loads an image.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${src}. [ ERROR ]: ${err}`));

    img.src = src;
  });
}

let spriteAttack: HTMLImageElement;
let spriteWalk: HTMLImageElement;

/**
 * Initializes resources.
 */
async function initialize(): Promise<void> {
  spriteAttack = await loadImage("./Shinobi/Attack_1.png");
  spriteWalk = await loadImage("./Shinobi/Walk.png");
}

let frameIndex: number = 0;
let frameTimer: number = 0;
let animationSpeed: number = 0.1;

let walkTimer: number = 0;
let walkSpeed: number = 0.1;
let walkDirection: number = 1;
let walkIndex: number = 0;

let lastTime: number = performance.now();

/**
 * Main animation loop.
 */
const main = async (): Promise<void> => {
  const currentTime = performance.now();
  const deltaTime: number = (currentTime - lastTime) / 1000; // Time in seconds
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

  // Draw the current frame of the attack sprite
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

  // Draw the current frame of the walk sprite
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

// Initial setup
resizeCanvas();
