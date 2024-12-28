import { SpriteAnimation, Frame, AnimationConfig } from "./spriteAnimation";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let CELL_SIZE: number = 70;
let MAP_WIDTH: number = 0,
  MAP_HEIGHT: number = 0;
let map: number[][];


/**
 * Asynchronously loads an image.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = (err) =>
      reject(new Error(`Failed to load image: ${src}. [ ERROR ]: ${err}`));

    img.src = src;
  });
}

let spriteAttack: HTMLImageElement;
let spriteWalk: HTMLImageElement;
let groundSprite: HTMLImageElement;

/**
 * Initializes resources.
 */
async function initialize(): Promise<void> {
  spriteAttack = await loadImage("../assets/Shinobi/Attack_1.png");
  spriteWalk = await loadImage("../assets/Shinobi/Walk-sheet.png");
  groundSprite = await loadImage("../assets/Tileset.png");
}
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
function drawMap(ctx: CanvasRenderingContext2D): void {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const posX = x * CELL_SIZE;
      const posY = y * CELL_SIZE;

      if (map[y][x] === 1) {
        ctx.drawImage(
          groundSprite,
          (32 * 9) + 9,
          0,
          30,
          32,
          posX,
          posY,
          CELL_SIZE,
          CELL_SIZE,
        );
      }
    }
  }
}


let lastTime: number = performance.now();

/**
 * Main animation loop.
 */
const main = async (): Promise<void> => {
  const attackAnimationConfig: AnimationConfig = {
    frameCount: 5,
    frameWidth: spriteAttack.width / 5,
    frameHeight: spriteAttack.height,
    animationCooldown: 0.1,
    loop: true,
    autoplay: true,
  };

  let attackAnimation = new SpriteAnimation(
    spriteAttack,
    attackAnimationConfig,
  );

  const walkAnimationConfig: AnimationConfig = {
    frameCount: 8,
    frameWidth: spriteWalk.width / 8,
    frameHeight: spriteWalk.height,
    animationCooldown: 0.1,
    loop: true,
    autoplay: true,
  };

  let walkAnimation = new SpriteAnimation(
    spriteWalk,
    walkAnimationConfig,
  );
  let walkX = 0;
  let walkVel = 100;
  function loop(): void {
    const currentTime = performance.now();
    const deltaTime: number = (currentTime - lastTime) / 1000; // Time in seconds
    lastTime = currentTime;

    attackAnimation.update(deltaTime);
    walkAnimation.update(deltaTime);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the map
    drawMap(ctx);

    walkX += walkVel* deltaTime;
    if (walkX > CELL_SIZE * 6) {
      walkX = CELL_SIZE * 6;
      walkVel *= -1;
    }
    if (walkX <= 0) {
      walkX = 0;
      walkVel *= -1;
    }
    const aspectRatio = spriteWalk.width / (spriteWalk.height * 8);
    attackAnimation.draw(ctx, CELL_SIZE, CELL_SIZE * 3, CELL_SIZE, CELL_SIZE);
    walkAnimation.draw(ctx, walkX, CELL_SIZE * 3, CELL_SIZE * aspectRatio, CELL_SIZE );
    // Update sprite animation frame
    requestAnimationFrame(loop);
  }
  loop();
};

// Initialize and start the main loop
initialize().then(main);

window.addEventListener("resize", () => {
  resizeCanvas();
});

// Initial setup
resizeCanvas();
