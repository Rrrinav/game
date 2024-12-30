import { SpriteAnimation, AnimationConfig } from "./spriteAnimation.js";
import { Vec2 } from "./vec2.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const keys = {
  space: false,
  left: false,
  right: false,
};

let CELL_SIZE: number = 70;
let MAP_WIDTH: number = 0,
  MAP_HEIGHT: number = 0;
let map: number[][];

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

async function initialize(): Promise<void> {
  spriteAttack = await loadImage("../assets/Shinobi/Attack_1.png");
  spriteWalk = await loadImage("../assets/Shinobi/Walk-sheet.png");
  groundSprite = await loadImage("../assets/Tileset.png");
}

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

function resizeCanvas(): void {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
  initializeMap();
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
let isJumping: boolean = false;

let walkX: number = 0;
let walkY: number = CELL_SIZE * 3;
let walkVel: number = 0;
let jumpVel: number = 400;
let gravity: number = 980;
let groundY: number = CELL_SIZE * 3;
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


  function loop(): void {
    const currentTime = performance.now();
    const deltaTime: number = (currentTime - lastTime) / 1000; // Time in seconds
    lastTime = currentTime;

    // Handle movement
    if (!keys.left && !keys.right) {
      walkVel = 0;
    }
    walkX += walkVel * deltaTime;
    if (walkX > CELL_SIZE * 6 + (spriteWalk.width / (2 * 8))) {
      walkX = CELL_SIZE * 6 + (spriteWalk.width / (2 * 8));
      walkVel = 0;
    } else if (walkX <= 0) {
      walkX = 0;
      walkVel = 0;
    }

    // Handle jumping
    if (isJumping) {
      jumpVel -= gravity * deltaTime;
      walkY -= jumpVel * deltaTime;

      if (walkY >= groundY) {
        walkY = groundY;
        isJumping = false;
        jumpVel = 400;
      }
    }

    attackAnimation.update(deltaTime);
    walkAnimation.update(deltaTime);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the map
    drawMap(ctx);

    const aspectRatio = spriteWalk.width / (spriteWalk.height * 8);
    attackAnimation.draw(ctx, CELL_SIZE, CELL_SIZE * 3, CELL_SIZE, CELL_SIZE);
    walkAnimation.draw(ctx, walkX, walkY, CELL_SIZE * aspectRatio, CELL_SIZE);

    requestAnimationFrame(loop);
  }
  loop();
};

// Initialize and start the main loop
initialize().then(main);

window.addEventListener("resize", () => {
  resizeCanvas();
});

window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "Space":
      keys.space = true;
      if (!isJumping) {
        isJumping = true;
        jumpVel = 400;
      }
      break;
    case "ArrowLeft":
    case "KeyA":
      keys.left = true;
      walkVel = -300;
      break;
    case "ArrowRight":
    case "KeyD":
      keys.right = true;
      walkVel = 300;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "Space":
      keys.space = false;
      break;
    case "ArrowLeft":
    case "KeyA":
      keys.left = false;
      if (keys.right) {
        walkVel = 300;
      }
      break;
    case "ArrowRight":
    case "KeyD":
      keys.right = false;
      if (keys.left) {
        walkVel = -300;
      }
      break;
  }
});

// Initial setup
resizeCanvas();
