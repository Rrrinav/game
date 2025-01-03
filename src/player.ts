import { SpriteAnimation } from "./spriteAnimation.js";

export class Player {
  public x: number;
  public y: number;
  public currentAnimation: SpriteAnimation | null;
  public isCurrentAnimComplete: boolean = true; // True because none have started yet, so none existing ones have completed!
  // DOUBT: IDK if this is right? but for first animation others must be complete for it to start!

  constructor(x: number = 0, y: number = 0, defAnimation: SpriteAnimation) {
    this.x = x;
    this.y = y;
    this.currentAnimation = defAnimation;
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
}
