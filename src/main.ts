import { SpriteAnimation, AnimationConfig } from "./spriteAnimation.js";
import { Player } from "./player.js";
import { Vec2 } from "./vec2.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const DEBUG: boolean = true;
let isExplosion: boolean = false;

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
let explosion: HTMLImageElement;

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

let explosionAnimation: SpriteAnimation;

async function initialize(): Promise<void> {
  spriteIdle = await loadImage("../assets/Shinobi/Idle.png");
  spriteAttack = await loadImage("../assets/Shinobi/Attack_1.png");
  spriteWalk = await loadImage("../assets/Shinobi/Run.png");
  groundSprite = await loadImage("../assets/Tileset.png");
  explosion = await loadImage("../assets/Pixel Holy Spell Effect 32x32 Pack 3/00.png")

  const explosionConfig: AnimationConfig = {
    frameCount: 19,
    frameWidth: explosion.width / 19,
    frameHeight: explosion.height / 3,
    animationCooldown: 0.03,
    loop: true,
    autoplay: true,
    singleUse: true
  };
  explosionAnimation = new SpriteAnimation(explosion, explosionConfig);
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
  map[2][11] = 1;
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

function drawMapDebug(ctx: CanvasRenderingContext2D) {

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const posX = x * CELL_SIZE;
      const posY = y * CELL_SIZE;
      ctx.font = "10px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`${x},${y}`, posX + 5, posY + 10);
      ctx.strokeStyle = "black";
      ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
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

  // Calculate the grid cells that could collide with the player
  const leftCell = Math.floor(playerLeft / CELL_SIZE);
  const rightCell = Math.floor((playerRight - 1) / CELL_SIZE);
  const topCell = Math.floor(playerTop / CELL_SIZE);
  const bottomCell = Math.floor((playerBottom - 1) / CELL_SIZE);

  // Helper function to check if a cell is solid
  const isSolid = (cy: number, cx: number): boolean => {
    return cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH && map[cy][cx] === 1;
  };

  // Check each cell that the player could be colliding with
  for (let cy = topCell; cy <= bottomCell; cy++) {
    for (let cx = leftCell; cx <= rightCell; cx++) {
      if (!isSolid(cy, cx)) continue;

      // Find connected solid tiles in the 8 neighboring cells
      const connected = {
        left: isSolid(cy, cx - 1),
        right: isSolid(cy, cx + 1),
        top: isSolid(cy - 1, cx),
        bottom: isSolid(cy + 1, cx),
        topLeft: isSolid(cy - 1, cx - 1),
        topRight: isSolid(cy - 1, cx + 1),
        bottomLeft: isSolid(cy + 1, cx - 1),
        bottomRight: isSolid(cy + 1, cx + 1)
      };

      // Calculate region bounds based on connected tiles
      let region = {
        left: cx * CELL_SIZE,
        right: (cx + 1) * CELL_SIZE,
        top: cy * CELL_SIZE,
        bottom: (cy + 1) * CELL_SIZE
      };

      // TODO: Remove checking some unnecessary regions where player will never reach
      //
      // Extend region based on connected tiles
      // We dont need to check left and right of these
      //if (connected.left) region.left = (cx - 1) * CELL_SIZE;
      //if (connected.right) region.right = (cx + 2) * CELL_SIZE;
      if (connected.top) region.top = (cy - 1) * CELL_SIZE;
      if (connected.bottom) region.bottom = (cy + 2) * CELL_SIZE;

      // Check collision with this region
      const overlapLeft = playerRight - region.left;
      const overlapRight = region.right - playerLeft;
      const overlapTop = playerBottom - region.top;
      const overlapBottom = region.bottom - playerTop;

      if (overlapLeft > 0 && overlapRight > 0 && overlapTop > 0 && overlapBottom > 0) {
        result.collided = true;

        // Find the smallest overlap
        const overlaps = [
          { amount: overlapLeft, type: 'right', snapTo: region.left - width },
          { amount: overlapRight, type: 'left', snapTo: region.right },
          { amount: overlapTop, type: 'bottom', snapTo: region.top - height },
          { amount: overlapBottom, type: 'top', snapTo: region.bottom }
        ].sort((a, b) => a.amount - b.amount);

        const smallest = overlaps[0];

        // Apply the correction
        switch (smallest.type) {
          case 'right':
            result.sides.right = true;
            result.snapPosition.x = smallest.snapTo;
            break;
          case 'left':
            result.sides.left = true;
            result.snapPosition.x = smallest.snapTo;
            break;
          case 'top':
            result.sides.top = true;
            result.snapPosition.y = smallest.snapTo;
            break;
          case 'bottom':
            result.sides.bottom = true;
            result.snapPosition.y = smallest.snapTo;
            break;
        }
      }
    }
  }

  return result;
}

let lastTime: number = performance.now();
const GRAVITY: number = 980;
let hitBoxColor = "blue"
let mouseX = 0;
let mouseY = 0;

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
      nextX = player.x - player.dx * deltaTime;
      player.setCurrentAnimation(walkAnimation);
      player.currentAnimation?.setFlip(true, false);
    }
    else if (keys.right === true && player.isCurrentAnimationComplete()) {
      nextX = player.x + player.dx * deltaTime;
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
    if (keys.space === true && !player.isJumping) {
      player.isJumping = true;
    }
    // Handle jumping and gravity
    if (player.isJumping) {
      nextY = player.y - player.dy * deltaTime;
      player.dy -= GRAVITY * deltaTime;
    }

    // Check collisions at new position
    const collision = checkCollisionSides(nextX, nextY, CELL_SIZE, CELL_SIZE);

    if (collision.collided)
      hitBoxColor = "red"
    else
      hitBoxColor = "blue"

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
        if (player.dy < 0 && player.isJumping) {
          player.isJumping = false;
          player.dy = 550; // Reset jump velocity
        } else {
          // We hit something while moving upward - preserve remaining upward velocity
          player.y = collision.snapPosition.y;
        }
      } else if (collision.sides.top) {
        // Hit ceiling - reverse velocity
        player.dy = -player.dy * 0.3; // Add some bounce/rebound effect (optional)
      }
    }

    // Check if we should fall
    if (!player.isJumping) {
      const groundCheck = checkCollisionSides(player.x, player.y + 1, CELL_SIZE, CELL_SIZE);
      if (!groundCheck.sides.bottom) {
        player.isJumping = true;
        player.dy = 0; // Start falling from rest
      }
    }

    // Reset position if fallen off the screen
    if (player.y > window.innerHeight) {
      player.y = 0;
      player.x = 0;
      player.dy = 550;
    }

    if (isAttacking && player.currentAnimation?.isAnimFinished()) {
      player.setAnimationComplete(true);
      player.setCurrentAnimation(idleAnimation);
      isAttacking = false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap(ctx);

    if (explosionAnimation?.isAnimFinished()) {
      isExplosion = false;
    }
    if (isExplosion) {
      explosionAnimation?.draw(ctx, mouseX - (explosion.width / 38) - 20, mouseY - 20 - explosion.height / 6, 100, 100);
    }
    explosionAnimation?.update(deltaTime);

    player.currentAnimation?.update(deltaTime);
    player.currentAnimation?.draw(ctx, player.x, player.y, CELL_SIZE, CELL_SIZE)
    if (DEBUG) {
      drawMapDebug(ctx);
      drawDebugInfoPLayer(ctx, player, hitBoxColor)
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
      //if (!player.isJumping) {
      //  player.isJumping = true;
      //}
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

window.addEventListener("mouseup", (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
  explosionAnimation.reset()
  isExplosion = true;
})
