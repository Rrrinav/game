import { SpriteAnimation } from "./spriteAnimation.js";

export class Player {
  public x: number;
  public y: number;
  public dx: number;
  public dy: number;
  public hitboxWidth: number = 30;
  public hitboxHeight: number = 30;
  public hbOffset_X: number = 20;
  public hbOffset_Y: number = 25;
  public isJumping: boolean = false;
  public currentAnimation: SpriteAnimation | null;
  public isCurrentAnimComplete: boolean = true; // DOUBT: IDK if this is right ('true' by default)? but for the first animation, others must be complete for it to start!
  public isDebug = false;

  constructor(x: number = 0, y: number = 0, defAnimation: SpriteAnimation, dx: number = 200, dy: number = 550, width: number = 30, height: number = 45) {
    this.x = x;
    this.y = y;
    this.currentAnimation = defAnimation;
    this.dx = dx;
    this.dy = dy;
    this.hitboxWidth = width;
    this.hitboxHeight = height;
  }

  setCurrentAnimation(animation: SpriteAnimation): void {
    this.currentAnimation = animation;
  }

  isCurrentAnimationComplete(): boolean {
    return this.isCurrentAnimComplete;
  }

  setAnimationComplete(value: boolean): void {
    this.isCurrentAnimComplete = value;
  }

  getHitbox(x: number, y: number, flip: boolean = false): { r_x: number, r_y: number, r_width: number, r_height: number } {

    return { r_x     : x + this.hbOffset_X,
             r_y     : y + this.hbOffset_Y,
             r_width : this.hitboxWidth,
             r_height: this.hitboxHeight };
  }
}
