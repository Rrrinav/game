export type AnimationConfig = {
  frameCount: number; // Total frames in the animation
  frameWidth: number; // Width of each frame
  frameHeight: number; // Height of each frame
  animationCooldown: number; // Time (in ms) between frames
  loop?: boolean; // Should the animation loop
  autoplay?: boolean; // Should the animation start playing immediately
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

