import { SpriteAnimation, AnimationConfig } from "./spriteAnimation.js";
import { Vec2 } from "./vec2.js";
import { Player } from "./player.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const keys = {
  space: false,
  left: false,
  right: false,
  key_X: false,
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
let spriteIdle: HTMLImageElement;

function drawDebugInfoPLayer(ctx: CanvasRenderingContext2D, player: Player, rectColor: string = "red", arrowColor: string = "white") {
  if (player.isDebug) {
    ctx.strokeStyle = rectColor;
    ctx.strokeRect(player.x, player.y, CELL_SIZE, CELL_SIZE);

    // Draw direction line
    ctx.beginPath();
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 2;

    const centerX = player.x + CELL_SIZE / 2;
    const centerY = player.y + CELL_SIZE / 2;
    const lineLength = CELL_SIZE * 0.75;

    // Draw direction line based on movement
    if (keys.left) {
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - lineLength, centerY);
      // Add arrowhead
      ctx.lineTo(centerX - lineLength + 10, centerY - 10);
      ctx.moveTo(centerX - lineLength, centerY);
      ctx.lineTo(centerX - lineLength + 10, centerY + 10);
    } else if (keys.right) {
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + lineLength, centerY);
      // Add arrowhead
      ctx.lineTo(centerX + lineLength - 10, centerY - 10);
      ctx.moveTo(centerX + lineLength, centerY);
      ctx.lineTo(centerX + lineLength - 10, centerY + 10);
    }

    ctx.stroke();
  }
}

async function initialize(): Promise<void> {
  spriteIdle = await loadImage("../assets/Shinobi/Idle.png");
  spriteAttack = await loadImage("../assets/Shinobi/Attack_1.png");
  spriteWalk = await loadImage("../assets/Shinobi/Run.png");
  groundSprite = await loadImage("../assets/Tileset.png");
}

function initializeMap(): void {
  MAP_WIDTH = Math.ceil(canvas.width / CELL_SIZE);
  MAP_HEIGHT = Math.ceil(canvas.height / CELL_SIZE);

  map = Array.from({ length: MAP_HEIGHT }, () => new Array(MAP_WIDTH).fill(0));

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
let jumpVel: number = 400;
let gravity: number = 980;
let runVelocity: number = 150;

// Main Game Code
async function main(): Promise<void> {
  const idleAnimationConfig: AnimationConfig = {
    frameCount: 6,
    frameWidth: spriteIdle.width / 6,
    frameHeight: spriteIdle.height,
    animationCooldown: 0.1,
    loop: true,
    autoplay: true,
  };

  const attackAnimationConfig: AnimationConfig = {
    frameCount: 5,
    frameWidth: spriteAttack.width / 5,
    frameHeight: spriteAttack.height,
    animationCooldown: 0.04,
    loop: true,
    autoplay: true,
    singleUse: true
  };

  const walkAnimationConfig: AnimationConfig = {
    frameCount: 8,
    frameWidth: spriteWalk.width / 8,
    frameHeight: spriteWalk.height,
    animationCooldown: 0.1,
    loop: true,
    autoplay: true,
  };

  // Create animations
  const idleAnimation = new SpriteAnimation(spriteIdle, idleAnimationConfig);
  const attackAnimation = new SpriteAnimation(spriteAttack, attackAnimationConfig);
  const walkAnimation = new SpriteAnimation(spriteWalk, walkAnimationConfig);

  let player: Player = new Player(30, CELL_SIZE * 3, idleAnimation);
  player.isDebug = true;
  let isAttacking: boolean = false;

  // BUG: Sprite sheets make hitboxes weird!
  function checkCollision(x: number, y: number): boolean {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);

    if (cellY >= 0 && cellY < MAP_HEIGHT && cellX >= 0 && cellX < MAP_WIDTH) {
      console.log(cellX, cellY);
      console.log(map[cellY][cellX] === 1);
      return map[cellY][cellX] === 1;
    }
    return false;
  }

  function loop(): void {
    const currentTime = performance.now();
    const deltaTime: number = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Handle horizontal movement
    if (keys.left === true && player.isCurrentAnimationComplete()) {
      player.x -= runVelocity * deltaTime;
      player.setCurrentAnimation(walkAnimation);
      player.currentAnimation?.setFlip(true, false);
    }
    else if (keys.right === true && player.isCurrentAnimationComplete()) {
      player.x += runVelocity * deltaTime;
      player.setCurrentAnimation(walkAnimation);
      player.currentAnimation?.setFlip(false, false);
    } else if (keys.key_X === true && !isAttacking) {
      isAttacking = true;
      player.setAnimationComplete(false)
      player.setCurrentAnimation(attackAnimation);
      player.currentAnimation?.reset();
    } else if (player.isCurrentAnimationComplete()) {
      player.setCurrentAnimation(idleAnimation);
    }

    // Handle jumping and gravity
    if (isJumping) {
      player.y -= jumpVel * deltaTime;
      jumpVel -= gravity * deltaTime;

      // Check for ground collision
      if (checkCollision(player.x, player.y + CELL_SIZE)) {
        isJumping = false;
        // Snap to ground
        player.y = Math.floor(player.y / CELL_SIZE) * CELL_SIZE;
      }
    } else {
      // Check if we should fall
      if (!checkCollision(player.x, player.y + CELL_SIZE)) {
        isJumping = true;
        jumpVel = 0;
      }
    }

    if (isAttacking && player.currentAnimation?.isAnimFinished()) {
      player.setAnimationComplete(true);
      player.setCurrentAnimation(idleAnimation);
      isAttacking = false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap(ctx);

    player.currentAnimation?.update(deltaTime);
    player.currentAnimation?.draw(ctx, player.x, player.y, CELL_SIZE, CELL_SIZE)

    if (player.isDebug) {
      drawDebugInfoPLayer(ctx, player)
    }
    requestAnimationFrame(loop);
  }

  loop();
}

initialize().then(() => {
  main();
})

resizeCanvas();

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
      break;
    case "ArrowRight":
    case "KeyD":
      keys.right = true;
      break;
    case "KeyX":
      keys.key_X = true;
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
      } else {
      }
      break;
    case "ArrowRight":
    case "KeyD":
      keys.right = false;
      if (keys.left) {
      } else {
      }
      break;
    case "KeyX":
      keys.key_X = false;
      break;
  }
});
