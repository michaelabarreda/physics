// =========================
// CLEAN SINGLETON PHYSICS
// =========================

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Body
} = Matter;

// -----------------------------------
// DESTROY PREVIOUS INSTANCE
// -----------------------------------
if (window.physicsCleanup) {
  window.physicsCleanup();
}

// -----------------------------------
// GLOBALS
// -----------------------------------
let engine;
let render;
let runner;
let world;

let started = false;

let triangle;
let rectangle;
let circle;

// -----------------------------------
// INIT
// -----------------------------------
function initPhysics() {

  const canvas = document.getElementById("physics-canvas");

  if (!canvas) {
    console.warn("Canvas not found");
    return;
  }

  // CLEAR CANVAS MANUALLY
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ENGINE
  engine = Engine.create();
  world = engine.world;

  // RENDER
  render = Render.create({
    canvas,
    engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      wireframes: false,
      background: "transparent"
    }
  });

  // RUNNER
  runner = Runner.create();

  Runner.run(runner, engine);
  Render.run(render);

  createBounds();
  bindEvents();

  // GLOBAL CLEANUP FUNCTION
  window.physicsCleanup = () => {

    try {

      Render.stop(render);
      Runner.stop(runner);

      Composite.clear(world, false);

      Engine.clear(engine);

      const context = render.canvas.getContext("2d");

      context.clearRect(
        0,
        0,
        render.canvas.width,
        render.canvas.height
      );

    } catch (e) {
      console.warn(e);
    }

  };

  console.log("Physics initialized");
}

// -----------------------------------
// BOUNDS
// -----------------------------------
function createBounds() {

  const w = window.innerWidth;
  const h = window.innerHeight;

  const ground = Bodies.rectangle(
    w / 2,
    h + 40,
    w,
    80,
    {
      isStatic: true,
      render: { visible: false }
    }
  );

  const leftWall = Bodies.rectangle(
    -40,
    h / 2,
    80,
    h,
    {
      isStatic: true,
      render: { visible: false }
    }
  );

  const rightWall = Bodies.rectangle(
    w + 40,
    h / 2,
    80,
    h,
    {
      isStatic: true,
      render: { visible: false }
    }
  );

  Composite.add(world, [
    ground,
    leftWall,
    rightWall
  ]);
}

// -----------------------------------
// CREATE ONLY 3 SHAPES
// -----------------------------------
function createShapes() {

  if (triangle || rectangle || circle) return;

  const w = window.innerWidth;

  const color = "rgba(196,96,58,0.18)";

  // TRIANGLE
  triangle = Bodies.polygon(
    w / 2,
    -200,
    3,
    45,
    {
      render: {
        fillStyle: color
      }
    }
  );

  // RECTANGLE
  rectangle = Bodies.rectangle(
    w / 2,
    -380,
    70,
    50,
    {
      render: {
        fillStyle: color
      }
    }
  );

  // CIRCLE
  circle = Bodies.circle(
    w / 2,
    -560,
    35,
    {
      render: {
        fillStyle: color
      }
    }
  );

  Composite.add(world, [
    triangle,
    rectangle,
    circle
  ]);

  console.log("ONLY 3 SHAPES CREATED");
}

// -----------------------------------
// FIRST INTERACTION
// -----------------------------------
function startPhysics() {

  if (started) return;

  started = true;

  createShapes();
}

// -----------------------------------
// EVENTS
// -----------------------------------
function bindEvents() {

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

  window.addEventListener(
    "scroll",
    onScroll
  );

  // CONTACT SECTION
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
}

// -----------------------------------
// SCROLL FORCE
// -----------------------------------
function onScroll() {

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

  const atBottom =
    window.innerHeight +
    window.scrollY >=
    document.body.offsetHeight - 50;

  if (atBottom) {
    buildTower();
  }
}

// -----------------------------------
// DRIFT
// -----------------------------------
function driftToCorner() {

  const w = window.innerWidth;
  const h = window.innerHeight;

  [triangle, rectangle, circle]
    .forEach(shape => {

      if (!shape) return;

      Body.applyForce(
        shape,
        shape.position,
        {
          x: (w - shape.position.x) * 0.000002,
          y: (h - shape.position.y) * 0.000002
        }
      );

    });
}

// -----------------------------------
// FINAL TOWER
// -----------------------------------
function buildTower() {

  const w = window.innerWidth;
  const h = window.innerHeight;

  const x = w - 120;
  const y = h - 80;

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

  Body.setVelocity(triangle, { x: 0, y: 0 });
  Body.setVelocity(rectangle, { x: 0, y: 0 });
  Body.setVelocity(circle, { x: 0, y: 0 });
}

// -----------------------------------
// RESIZE
// -----------------------------------
window.addEventListener(
  "resize",
  () => {

    if (!render) return;

    render.canvas.width =
      window.innerWidth;

    render.canvas.height =
      window.innerHeight;

  }
);

// -----------------------------------
// START
// -----------------------------------
initPhysics();
