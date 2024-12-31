import { SpriteAnimation } from "./spriteAnimation.js";

export class Player {
  public x: number;
  public y: number;
  public currentAnimation: SpriteAnimation | null;
  public isCurrentAnimComplete: boolean = false;

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
