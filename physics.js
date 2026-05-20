// =========================
// SIMPLE CUSTOM RENDERER
// =========================

const {
  Engine,
  Runner,
  Bodies,
  Composite,
  Body
} = Matter;

// -------------------------
// SINGLETON LOCK
// -------------------------
if (window.__PHYSICS_ACTIVE__) {
  console.log("Physics already running");
} else {
  window.__PHYSICS_ACTIVE__ = true;

  initPhysics();
}

function initPhysics() {

// -------------------------
// CANVAS
// -------------------------
const canvas = document.getElementById("physics-canvas");

if (!canvas) {
  throw new Error("Canvas missing");
}

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// -------------------------
// ENGINE
// -------------------------
const engine = Engine.create();
const world = engine.world;

const runner = Runner.create();

Runner.run(runner, engine);

// -------------------------
// BOUNDS
// -------------------------
const ground = Bodies.rectangle(
  window.innerWidth / 2,
  window.innerHeight + 40,
  window.innerWidth,
  80,
  { isStatic: true }
);

const leftWall = Bodies.rectangle(
  -40,
  window.innerHeight / 2,
  80,
  window.innerHeight,
  { isStatic: true }
);

const rightWall = Bodies.rectangle(
  window.innerWidth + 40,
  window.innerHeight / 2,
  80,
  window.innerHeight,
  { isStatic: true }
);

Composite.add(world, [
  ground,
  leftWall,
  rightWall
]);

// -------------------------
// SHAPES
// -------------------------
let started = false;

let triangle;
let rectangle;
let circle;

function createShapes() {

  if (triangle || rectangle || circle) return;

  const color = "#C4603A";

  triangle = Bodies.polygon(
    window.innerWidth / 2,
    -200,
    3,
    45
  );

  rectangle = Bodies.rectangle(
    window.innerWidth / 2,
    -380,
    70,
    50
  );

  circle = Bodies.circle(
    window.innerWidth / 2,
    -560,
    35
  );

  triangle.renderColor = color;
  rectangle.renderColor = color;
  circle.renderColor = color;

  Composite.add(world, [
    triangle,
    rectangle,
    circle
  ]);
}

// -------------------------
// START
// -------------------------
function startPhysics() {

  if (started) return;

  started = true;

  createShapes();
}

window.addEventListener(
  "mousemove",
  startPhysics,
  { once: true }
);

window.addEventListener(
  "touchstart",
  startPhysics,
  { once: true }
);

// -------------------------
// DRAW LOOP
// -------------------------
function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawShape(triangle);
  drawShape(rectangle);
  drawShape(circle);

  requestAnimationFrame(draw);
}

function drawShape(body) {

  if (!body) return;

  ctx.save();

  ctx.translate(
    body.position.x,
    body.position.y
  );

  ctx.rotate(body.angle);

  ctx.fillStyle = "rgba(196,96,58,0.18)";

  // CIRCLE
  if (body.circleRadius) {

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      body.circleRadius,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  // POLYGON / RECTANGLE
  else {

    ctx.beginPath();

    ctx.moveTo(
      body.vertices[0].x - body.position.x,
      body.vertices[0].y - body.position.y
    );

    for (let i = 1; i < body.vertices.length; i++) {

      ctx.lineTo(
        body.vertices[i].x - body.position.x,
        body.vertices[i].y - body.position.y
      );

    }

    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

draw();

// -------------------------
// SCROLL BOUNCE
// -------------------------
window.addEventListener("scroll", () => {

  if (!started) return;

  [triangle, rectangle, circle]
    .forEach(shape => {

      if (!shape) return;

      Body.applyForce(
        shape,
        shape.position,
        {
          x: 0,
          y: -0.0008
        }
      );

    });

});

// -------------------------
// CONTACT DRIFT
// -------------------------
const contact =
  document.querySelector("#contact-section");

if (contact) {

  const observer =
    new IntersectionObserver(entries => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {
          driftToCorner();
        }

      });

    });

  observer.observe(contact);
}

function driftToCorner() {

  [triangle, rectangle, circle]
    .forEach(shape => {

      if (!shape) return;

      Body.applyForce(
        shape,
        shape.position,
        {
          x: 0.002,
          y: 0.001
        }
      );

    });

}

// -------------------------
// FINAL TOWER
// -------------------------
window.addEventListener("scroll", () => {

  const atBottom =
    window.innerHeight +
    window.scrollY >=
    document.body.offsetHeight - 50;

  if (!atBottom) return;

  const x = window.innerWidth - 120;
  const y = window.innerHeight - 80;

  Body.setPosition(
    triangle,
    { x, y }
  );

  Body.setPosition(
    rectangle,
    { x, y: y - 70 }
  );

  Body.setPosition(
    circle,
    { x, y: y - 140 }
  );

});

// -------------------------
// RESIZE
// -------------------------
window.addEventListener("resize", () => {

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

})};
