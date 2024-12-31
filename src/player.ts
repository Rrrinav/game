import { SpriteAnimation } from "./spriteAnimation.js";

export class Player {
  public x: number;
  public y: number;
  public dy: number;
  public currentAnimation: SpriteAnimation | null;

  constructor(x: number = 0, y: number = 0, defAnimation: SpriteAnimation) {
    this.x = x;
    this.y = y;
    this.dy = 0;
    this.currentAnimation = defAnimation;
  }

  setCurrentAnimation(animation: SpriteAnimation): void {
    this.currentAnimation = animation;
  }
}
