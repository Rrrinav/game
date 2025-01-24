export type AnimationConfig = {
  frameCount: number; // Total frames in the animation
  frameWidth: number; // Width of each frame
  frameHeight: number; // Height of each frame
  animationCooldown: number; // Time (in ms) between frames
  loop?: boolean; // Should the animation loop
  autoplay?: boolean; // Should the animation start playing immediately
  singleUse?: boolean; // Marks finished after every loop
};

export type Frame = {
  sourceX: number; // X coordinate in the sprite sheet
  sourceY: number; // Y coordinate in the sprite sheet
  sourceWidth: number; // Width of the frame in the sprite sheet
  sourceHeight: number; // Height of the frame in the sprite sheet
};

// DOUBT: Shall we implement the lock aspect ratio functionality?
export class SpriteAnimation {
  private sprite: HTMLImageElement;
  private currentFrame: number;
  private frameTimer: number;
  private isPlaying: boolean;
  private config: AnimationConfig;
  private frames: Frame[];
  private flipH: boolean; // Horizontal flip flag
  private flipV: boolean; // Vertical flip flag
  private rotation: number; // Rotation angle in radians
  private isFinished: boolean;
  private isSingleUse: boolean;

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
    this.frames = initialFrames ?? this.generateFrames();
    this.flipH = false;
    this.flipV = false;
    this.rotation = 0;
    this.isFinished = false;
    this.isSingleUse = config.singleUse ?? false;
  }

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

  update(deltaTime: number): void {
    if (!this.isPlaying || this.frames.length === 0) return;

    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.config.animationCooldown) {
      this.frameTimer = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.frames.length) {
        if (this.config.loop) {
          this.currentFrame = 0; // Reset to the first frame if looping
          if(this.isSingleUse) {
            this.isFinished = true;
          }
        } else {
          this.currentFrame = this.frames.length - 1; // Stay on the last frame
          this.isPlaying = false; // Stop playing
          this.isFinished = true; // Mark as finished
        }
      } else {
        this.isFinished = false; // Reset isFinished if not at the end
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    destWidth: number = this.config.frameWidth,
    destHeight: number = this.config.frameHeight,
  ): void {
    if (this.frames.length === 0) return;

    const frame = this.frames[this.currentFrame];
    const centerX = x + destWidth / 2;
    const centerY = y + destHeight / 2;

    ctx.save(); // Save the current state
    ctx.translate(centerX, centerY); // Translate to the sprite's center

    if (this.rotation !== 0) ctx.rotate(this.rotation); // Rotate if needed
    if (this.flipH || this.flipV) {
      ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1); // Flip horizontally or vertically
    }

    ctx.drawImage(
      this.sprite,
      frame.sourceX,
      frame.sourceY,
      frame.sourceWidth,
      frame.sourceHeight,
      -destWidth / 2,
      -destHeight / 2,
      destWidth,
      destHeight,
    );

    ctx.restore(); // Restore the state
  }

  setFlip(horizontal: boolean, vertical: boolean): void {
    this.flipH = horizontal;
    this.flipV = vertical;
  }

  setRotation(angle: number): void {
    this.rotation = angle;
  }

  play(): void {
    this.isPlaying = true;
    this.isFinished = false;
  }

  pause(): void {
    this.isPlaying = false;
  }

  reset(): void {
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isFinished = false;
  }

  setFrames(newFrames: Frame[]): void {
    this.frames = newFrames;
    this.reset();
  }

  addFrame(frame: Frame): void {
    this.frames.push(frame);
  }

  isAnimFinished(): boolean {
    return this.isFinished;
  }

  removeFrame(index: number): void {
    if (index >= 0 && index < this.frames.length) {
      this.frames.splice(index, 1);
      if (this.currentFrame >= this.frames.length) {
        this.currentFrame = this.frames.length - 1;
      }
    }
  }

  updateConfig(newConfig: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.frameCount || newConfig.frameWidth || newConfig.frameHeight) {
      this.frames = this.generateFrames();
    }
  }

  isFlipped(vertically: boolean = false): boolean {
    return vertically ? this.flipV : this.flipH;
  }
}
