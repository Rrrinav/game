const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let CELL_SIZE: number = 70;
let MAP_WIDTH: number = 0,
  MAP_HEIGHT: number = 0;
let map: number[][];

type AnimationConfig = {
  frameCount: number; // Total frames in the animation
  frameWidth: number; // Width of each frame
  frameHeight: number; // Height of each frame
  animationCooldown: number; // Time (in ms) between frames
  loop?: boolean; // Should the animation loop
  autoplay?: boolean; // Should the animation start playing immediately
};

type Frame = {
  sourceX: number; // X coordinate in the sprite sheet
  sourceY: number; // Y coordinate in the sprite sheet
  sourceWidth: number; // Width of the frame in the sprite sheet
  sourceHeight: number; // Height of the frame in the sprite sheet
};

// DOUBT: Shall we implement the lock aspect ratio functionality?
class SpriteAnimation {
  private sprite: HTMLImageElement;
  private currentFrame: number;
  private frameTimer: number;
  private isPlaying: boolean;
  private config: AnimationConfig;
  private frames: Frame[];

  constructor(
    spriteSheet: HTMLImageElement,
    config: AnimationConfig,
    initialFrames?: Frame[], // Optional argument for providing custom frames
  ) {
    this.sprite = spriteSheet;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = config.autoplay ?? true;
    this.config = config;

    // Use provided frames or generate default frames
    this.frames = initialFrames ?? this.generateFrames();
  }

  /**
   * Generates frames based on the animation configuration.
   */
  private generateFrames(): Frame[] {
    const frames: Frame[] = [];
    for (let i = 0; i < this.config.frameCount; i++) {
      frames.push({
        sourceX: i * this.config.frameWidth,
        sourceY: 0,
        sourceWidth: this.config.frameWidth,
        sourceHeight: this.config.frameHeight,
      });
    }
    return frames;
  }

  /**
   * Updates the animation state based on the delta time.
   */
  update(deltaTime: number): void {
    if (!this.isPlaying || this.frames.length === 0) return;

    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.config.animationCooldown) {
      this.frameTimer = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.frames.length) {
        this.currentFrame = this.config.loop ? 0 : this.frames.length - 1;
        if (!this.config.loop) this.isPlaying = false;
      }
    }
  }

  /**
   * Draws the current frame of the animation to the canvas.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    destWidth: number = this.config.frameWidth,
    destHeight: number = this.config.frameHeight,
  ): void {
    if (this.frames.length === 0) return;

    const frame = this.frames[this.currentFrame];
    ctx.drawImage(
      this.sprite,
      frame.sourceX,
      frame.sourceY,
      frame.sourceWidth,
      frame.sourceHeight,
      x,
      y,
      destWidth,
      destHeight,
    );
  }

  /**
   * Starts or resumes the animation.
   */
  play(): void {
    this.isPlaying = true;
  }

  /**
   * Pauses the animation.
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Resets the animation to the first frame.
   */
  reset(): void {
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  /**
   * Updates the entire frame array with new frames.
   */
  setFrames(newFrames: Frame[]): void {
    this.frames = newFrames;
    this.reset();
  }

  /**
   * Adds a single frame to the animation.
   */
  addFrame(frame: Frame): void {
    this.frames.push(frame);
  }

  /**
   * Removes a frame at a specified index.
   */
  removeFrame(index: number): void {
    if (index >= 0 && index < this.frames.length) {
      this.frames.splice(index, 1);
      if (this.currentFrame >= this.frames.length) {
        this.currentFrame = this.frames.length - 1;
      }
    }
  }

  /**
   * Dynamically updates the animation configuration.
   */
  updateConfig(newConfig: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.frameCount || newConfig.frameWidth || newConfig.frameHeight) {
      this.frames = this.generateFrames();
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
  const attackAnimationConfig: AnimationConfig = {
    frameCount: 5,
    frameWidth: spriteAttack.width / 5,
    frameHeight: spriteAttack.height,
    animationCooldown: 0.1,
    loop: true,
    autoplay: true,
  };

  console.log(spriteWalk.width)
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
