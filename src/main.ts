import { SpriteAnimation, AnimationConfig } from "./spriteAnimation.js";
import { Player } from "./player.js";
import { Vec2 } from "./vec2.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const debug: boolean = true;

const keys = {
  space: false,
  left: false,
  right: false,
  key_X: false,
};

enum Sides {
  LEFT = "__left__",
  RIGHT = "__right__",
  UP = "__up__",
  DOWN = "__down__",
}

type CollisionInfo = {
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
  outofBounds: boolean,
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

// INFO: Temporary feature
function drawDebugInfoPLayer(ctx: CanvasRenderingContext2D, player: Player, rectColor: string = "red", isArrow: boolean = false, arrowColor: string = "white") {
  if (player.isDebug) {
    ctx.strokeStyle = rectColor;
    ctx.strokeRect(player.x, player.y, CELL_SIZE, CELL_SIZE);
    //ctx.font = "10px Arial";
    //ctx.fillStyle = "white";
    //ctx.fillText(`X: ${player.x.toFixed(2)}`, player.x + 5, player.y + 10);
    if (isArrow) {

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
    if (i < MAP_WIDTH && 4 < MAP_HEIGHT) {
      map[4][i] = 1;
    }
  }

  for (let i = 8; i < (8 + 7); i++) {
    if (i < MAP_WIDTH && 4 < MAP_HEIGHT) {
      map[4][i] = 1;
    }
  }

  map[3][11] = 1;
  map[3][8] = 1;
  map[1][5] = 1;

  for (let i = 0; i < 3; i++) {
    if (i < MAP_WIDTH && 2 < MAP_HEIGHT) {
      map[2][i] = 1;
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
      if (debug) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(`${x},${y}`, posX + 5, posY + 10);
        ctx.strokeStyle = "black";
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
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

//  BUG: Sprite sheets make hitboxes weird!
// TODO: Make collision complete on all sides!
function checkCollision(x: number, y: number): boolean {
  const cellX = Math.floor(x / CELL_SIZE);
  const cellY = Math.floor(y / CELL_SIZE);

  if (cellY >= 0 && cellY < MAP_HEIGHT && cellX >= 0 && cellX < MAP_WIDTH) {
    return map[cellY][cellX] === 1;
  }
  return false;
}

// Types for collision detection
type CollisionSides = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

type CollisionResult = {
  collided: boolean;
  sides: CollisionSides;
  snapPosition: Vec2;
};

function checkCollisionSides(x: number, y: number, width: number, height: number): CollisionResult {
  const result: CollisionResult = {
    collided: false,
    sides: {
      top: false,
      bottom: false,
      left: false,
      right: false
    },
    snapPosition: new Vec2(x, y)
  };

  // Calculate the player's bounding box edges
  const playerLeft = x;
  const playerRight = x + width;
  const playerTop = y;
  const playerBottom = y + height;

  // Calculate the cells the player is overlapping
  const leftCell = Math.floor(playerLeft / CELL_SIZE);
  const rightCell = Math.floor((playerRight - 1) / CELL_SIZE); // Subtract 1 to avoid detecting next cell
  const topCell = Math.floor(playerTop / CELL_SIZE);
  const bottomCell = Math.floor((playerBottom - 1) / CELL_SIZE); // Subtract 1 to avoid detecting next cell

  // Check each potentially colliding cell
  for (let cy = topCell; cy <= bottomCell; cy++) {
    for (let cx = leftCell; cx <= rightCell; cx++) {
      // Skip if out of bounds
      if (cy < 0 || cy >= MAP_HEIGHT || cx < 0 || cx >= MAP_WIDTH) continue;

      if (map[cy][cx] === 1) {
        // Calculate cell edges
        const cellLeft = cx * CELL_SIZE;
        const cellRight = (cx + 1) * CELL_SIZE;
        const cellTop = cy * CELL_SIZE;
        const cellBottom = (cy + 1) * CELL_SIZE;

        // Calculate overlap amounts
        const overlapLeft = playerRight - cellLeft;
        const overlapRight = cellRight - playerLeft;
        const overlapTop = playerBottom - cellTop;
        const overlapBottom = cellBottom - playerTop;

        // Find the smallest overlap
        const overlaps = [
          { amount: overlapLeft, type: 'left' },
          { amount: overlapRight, type: 'right' },
          { amount: overlapTop, type: 'top' },
          { amount: overlapBottom, type: 'bottom' }
        ].filter(overlap => overlap.amount > 0);

        if (overlaps.length > 0) {
          result.collided = true;
          const minOverlap = overlaps.reduce((min, current) =>
            current.amount < min.amount ? current : min
          );

          // Apply resolution based on smallest overlap
          switch (minOverlap.type) {
            case 'left':
              result.sides.right = true;
              result.snapPosition.x = cellLeft - width;
              break;
            case 'right':
              result.sides.left = true;
              result.snapPosition.x = cellRight;
              break;
            case 'top':
              result.sides.bottom = true;
              result.snapPosition.y = cellTop - height;
              break;
            case 'bottom':
              result.sides.top = true;
              result.snapPosition.y = cellBottom;
              break;
          }
        }
      }
    }
  }

  return result;
}

let lastTime: number = performance.now();
let isJumping: boolean = false;
let jumpVel: number = 550;
let gravity: number = 980;
let runVelocity: number = 200;
let color = "red"

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
    animationCooldown: 0.06,
    loop: true,
    autoplay: true,
  };

  // Create animations
  const idleAnimation = new SpriteAnimation(spriteIdle, idleAnimationConfig);
  const attackAnimation = new SpriteAnimation(spriteAttack, attackAnimationConfig);
  const walkAnimation = new SpriteAnimation(spriteWalk, walkAnimationConfig);

  let player: Player = new Player(CELL_SIZE * 6, CELL_SIZE * 3, idleAnimation);
  player.isDebug = true;
  let isAttacking: boolean = false;

  function loop(): void {
    const currentTime = performance.now();
    const deltaTime: number = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    let nextX = player.x;
    let nextY = player.y;

    // Handle horizontal movement
    if (keys.left === true && player.isCurrentAnimationComplete()) {
      nextX = player.x - runVelocity * deltaTime;
      player.setCurrentAnimation(walkAnimation);
      player.currentAnimation?.setFlip(true, false);
    }
    else if (keys.right === true && player.isCurrentAnimationComplete()) {
      nextX = player.x + runVelocity * deltaTime;
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
      nextY = player.y - jumpVel * deltaTime;
      jumpVel -= gravity * deltaTime;
    }

    // Check collisions at new position
    const collision = checkCollisionSides(nextX, nextY, CELL_SIZE, CELL_SIZE);

    // Apply horizontal movement if no collision
    if (!collision.sides.left && !collision.sides.right) {
      player.x = nextX;
    } else {
      player.x = collision.snapPosition.x;
    }

    // Apply vertical movement and handle collisions with preserved momentum
    if (!collision.sides.top && !collision.sides.bottom) {
      player.y = nextY;
    } else {
      player.y = collision.snapPosition.y;

      if (collision.sides.bottom) {
        // Only stop jumping if we're moving downward
        if (jumpVel < 0) {
          isJumping = false;
          jumpVel = 550; // Reset jump velocity
        } else {
          // We hit something while moving upward - preserve remaining upward velocity
          player.y = collision.snapPosition.y;
        }
      } else if (collision.sides.top) {
        // Hit ceiling - reverse velocity
        jumpVel = -jumpVel * 0.3; // Add some bounce/rebound effect (optional)
      }
    }

    // Check if we should fall
    if (!isJumping) {
      const groundCheck = checkCollisionSides(player.x, player.y + 1, CELL_SIZE, CELL_SIZE);
      if (!groundCheck.sides.bottom) {
        isJumping = true;
        jumpVel = 0; // Start falling from rest
      }
    }

    // Reset position if fallen off the screen
    if (player.y > window.innerHeight) {
      player.y = 0;
      player.x = 0;
      jumpVel = 550;
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
    if (debug) {
      drawDebugInfoPLayer(ctx, player, color)
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
