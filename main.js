const canvas = document.getElementById("canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
}

resizeCanvas();

const CELL_COUNT = 64;

function drawFillRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawStrokeRect(ctx, x, y, width, height, color) {
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, width, height);
}

function drawGrid(ctx, cellSize, color) {
  for (let i = 0; i < canvas.width; i += cellSize) {
    for (let j = 0; j < canvas.height; j += cellSize) {
      drawStrokeRect(ctx, i, j, cellSize, cellSize, color);
    }
  }
}

let lastTime = performance.now();
const main = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
  lastTime = currentTime;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate cell size
  const cellWidth = canvas.width / CELL_COUNT;
  const cellHeight = canvas.height / CELL_COUNT;
  const cellSize = Math.max(Math.min(cellWidth, cellHeight), 0);

  // Draw grid
  drawGrid(ctx, cellSize, "#777");

  requestAnimationFrame(main);
};

main();

window.addEventListener("resize", () => {
  resizeCanvas();
});
