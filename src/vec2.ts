export class Vec2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // Add another vector to this vector
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  // Subtract another vector from this vector
  subtract(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  // Multiply this vector by a scalar
  scale(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  // Divide this vector by a scalar
  divide(scalar: number): Vec2 {
    if (scalar === 0) throw new Error("Division by zero");
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  // Calculate the dot product with another vector
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  // Calculate the magnitude (length) of the vector
  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  // Normalize the vector (make its magnitude 1)
  normalize(): Vec2 {
    const mag = this.magnitude();
    return mag === 0 ? new Vec2(0, 0) : this.divide(mag);
  }

  // Calculate the distance to another vector
  distanceTo(v: Vec2): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  // Calculate the angle of this vector in radians
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  // Rotate the vector by a given angle (in radians)
  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  // Clamp the vector's magnitude to a maximum value
  clamp(max: number): Vec2 {
    const mag = this.magnitude();
    if (mag > max) {
      return this.normalize().scale(max);
    }
    return this;
  }

  // Check equality with another vector
  equals(v: Vec2): boolean {
    return this.x === v.x && this.y === v.y;
  }

  // Create a copy of this vector
  copy(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  // Static method to create a vector from an angle (in radians)
  static fromAngle(angle: number, magnitude: number = 1): Vec2 {
    return new Vec2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }

  // Static method to calculate the lerp (linear interpolation) between two vectors
  static lerp(v1: Vec2, v2: Vec2, t: number): Vec2 {
    return new Vec2(
      v1.x + (v2.x - v1.x) * t,
      v1.y + (v2.y - v1.y) * t
    );
  }

  // Convert the vector to a string representation
  toString(): string {
    return `Vec2(${this.x}, ${this.y})`;
  }
}

