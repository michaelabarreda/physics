// =========================
// physics.js (CLEAN + CONTROLLED SYSTEM)
// =========================

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Body
} = Matter;

let engine, render, runner;
let world;

let shapes = [];
let started = false;

// -------------------------
// INIT
// -------------------------
function initPhysics() {
  const canvas = document.getElementById("physics-canvas");

  if (!canvas) {
    console.warn("Canvas not found");
    return;
  }

  engine = Engine.create();
  world = engine.world;

  render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      wireframes: false,
      background: "transparent",
      pixelRatio: window.devicePixelRatio
    }
  });

  runner = Runner.create();

  Runner.run(runner, engine);
  Render.run(render);

  createBounds();
  bindEvents();
}

// -------------------------
// BOUNDS
// -------------------------
function createBounds() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const ground = Bodies.rectangle(w / 2, h + 40, w, 80, {
    isStatic: true,
    render: { visible: false }
  });

  const leftWall = Bodies.rectangle(-40, h / 2, 80, h, {
    isStatic: true,
    render: { visible: false }
  });

  const rightWall = Bodies.rectangle(w + 40, h / 2, 80, h, {
    isStatic: true,
    render: { visible: false }
  });

  Composite.add(world, [ground, leftWall, rightWall]);
}

// -------------------------
// CREATE EXACTLY 3 SHAPES
// ORDER IS FIXED:
// [0] triangle = bottom
// [1] rectangle = middle
// [2] circle = top
// -------------------------
function createShapes() {
  if (shapes.length > 0) return;

  const w = window.innerWidth;
  const colors = "rgba(196, 96, 58, 0.18)";

  const baseY = -400;

  const triangle = Bodies.polygon(w / 2, baseY, 3, 45, {
    render: { fillStyle: colors }
  });

  const rectangle = Bodies.rectangle(w / 2, baseY - 160, 70, 50, {
    render: { fillStyle: colors }
  });

  const circle = Bodies.circle(w / 2, baseY - 320, 35, {
    render: { fillStyle: colors }
  });

  shapes = [triangle, rectangle, circle];

  Composite.add(world, shapes);

  console.log("3 shapes created ✔");
}

// -------------------------
// EVENTS
// -------------------------
function bindEvents() {

  window.addEventListener("mousemove", startOnce, { once: true });
  window.addEventListener("touchstart", startOnce, { once: true });

  window.addEventListener("scroll", onScroll);

  const contact = document.querySelector("#contact-section");

  if (contact) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          driftToCorner();
        }
      });
    });

    observer.observe(contact);
  }
}

// -------------------------
// START
// -------------------------
function startOnce() {
  if (started) return;

  started = true;

  console.log("Physics started ✔");

  createShapes();
}

// -------------------------
// SCROLL FORCE
// -------------------------
function onScroll() {
  if (!started) return;

  shapes.forEach(s => {
    Body.applyForce(s, s.position, {
      x: 0,
      y: -0.0008
    });
  });

  const atBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;

  if (atBottom) {
    buildTower();
  }
}

// -------------------------
// DRIFT TO CONTACT
// -------------------------
function driftToCorner() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  shapes.forEach(s => {
    Body.applyForce(s, s.position, {
      x: (w - s.position.x) * 0.000002,
      y: (h - s.position.y) * 0.000002
    });
  });
}

// -------------------------
// FINAL TOWER (STRICT ORDER)
// -------------------------
function buildTower() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const baseX = w - 150;
  const baseY = h - 80;

  const triangle = shapes[0];
  const rectangle = shapes[1];
  const circle = shapes[2];

  Body.setVelocity(triangle, { x: 0, y: 0 });
  Body.setVelocity(rectangle, { x: 0, y: 0 });
  Body.setVelocity(circle, { x: 0, y: 0 });

  Body.setPosition(triangle, {
    x: baseX,
    y: baseY
  });

  Body.setPosition(rectangle, {
    x: baseX,
    y: baseY - 60
  });

  Body.setPosition(circle, {
    x: baseX,
    y: baseY - 120
  });
}

// -------------------------
// RESIZE
// -------------------------
window.addEventListener("resize", () => {
  if (!render) return;

  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
});

// -------------------------
// INIT
// -------------------------
window.addEventListener("load", initPhysics);
