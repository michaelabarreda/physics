// =========================
// physics.js (FIXED Webflow + Matter.js)
// =========================

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Body,
  Events
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
// CREATE SHAPES (FORCED SAFE)
// -------------------------
function createShapes() {
  if (shapes.length > 0) return;

  const w = window.innerWidth;
  const colors = "rgba(196, 96, 58, 0.18)";

  const startY = -300;

  // 1. CIRCLE
  const circle = Bodies.circle(w * 0.3, startY, 35, {
    render: { fillStyle: colors }
  });

  // 2. RECTANGLE
  const rectangle = Bodies.rectangle(w * 0.5, startY - 150, 70, 50, {
    render: { fillStyle: colors }
  });

  // 3. TRIANGLE
  const triangle = Bodies.polygon(w * 0.7, startY - 300, 3, 40, {
    render: { fillStyle: colors }
  });

  shapes.push(circle, rectangle, triangle);

  Composite.add(world, shapes);

  console.log("3 shapes created ✔");
}

// -------------------------
// EVENTS
// -------------------------
function bindEvents() {

  // FIRST INTERACTION → SPAWN SHAPES
  window.addEventListener("mousemove", startOnce, { once: true });
  window.addEventListener("touchstart", startOnce, { once: true });

  // SCROLL FORCE
  window.addEventListener("scroll", () => {
    shapes.forEach(s => {
      Body.applyForce(s, s.position, {
        x: 0,
        y: -0.0008
      });
    });
  });

  // CONTACT DRIFT
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

  // PAGE END → TOWER
  window.addEventListener("scroll", () => {
    const atBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;

    if (atBottom) {
      buildTower();
    }
  });
}

// -------------------------
// START SHAPES (FIXED)
// -------------------------
function startOnce() {
  if (started) return;

  started = true;

  console.log("Starting physics ✔");

  createShapes();
}

// -------------------------
// CONTACT DRIFT
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
// TOWER BUILD
// -------------------------
function buildTower() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const baseX = w - 150;

  const order = {
    circle: 0,
    rectangle: 1,
    polygon: 2
  };

  shapes.forEach((s) => {
    let index = s.circleRadius ? 0 : s.vertices.length === 3 ? 2 : 1;

    Body.setVelocity(s, { x: 0, y: 0 });

    Body.setPosition(s, {
      x: baseX,
      y: h - 80 - index * 60
    });
  });
}

// -------------------------
// RESIZE FIX
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
