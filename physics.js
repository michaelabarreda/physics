// =========================
// physics.js (FINAL WEBFLOW FIX - NO DUPLICATES)
// =========================

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Body
} = Matter;

// -------------------------
// HARD DOM SINGLETON LOCK (CRITICAL)
// -------------------------
const LOCK_KEY = "physics_v2_initialized";

if (document.documentElement.dataset[LOCK_KEY] === "true") {
  console.warn("Physics blocked (DOM singleton active)");
  throw new Error("Duplicate physics instance blocked");
}

document.documentElement.dataset[LOCK_KEY] = "true";

// -------------------------
// EXTRA JS SAFETY LOCK
// -------------------------
if (window.__PHYSICS_ENGINE_ACTIVE__) {
  console.warn("Physics already active");
  throw new Error("Duplicate JS instance blocked");
}
window.__PHYSICS_ENGINE_ACTIVE__ = true;

// -------------------------
// STATE
// -------------------------
let engine, render, runner;
let world;

let shapes = [];
let started = false;

// store engine globally for cleanup safety
window.__ENGINE = null;

// -------------------------
// INIT ENGINE
// -------------------------
function initPhysics() {
  const canvas = document.getElementById("physics-canvas");

  if (!canvas) {
    console.warn("Canvas not found");
    return;
  }

  // HARD CLEAN PREVIOUS ENGINE IF ANY
  if (window.__ENGINE) {
    try {
      Composite.clear(window.__ENGINE.world, false);
      Engine.clear(window.__ENGINE);
    } catch (e) {}
  }

  engine = Engine.create();
  world = engine.world;

  window.__ENGINE = engine;

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

  console.log("✔ Physics initialized once");
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
// -------------------------
function createShapes() {
  if (started && shapes.length > 0) return;

  // HARD RESET WORLD OBJECTS
  shapes.forEach(s => {
    try {
      Composite.remove(world, s);
    } catch (e) {}
  });

  shapes = [];

  const w = window.innerWidth;
  const color = "rgba(196, 96, 58, 0.18)";

  const triangle = Bodies.polygon(w / 2, -400, 3, 45, {
    render: { fillStyle: color }
  });

  const rectangle = Bodies.rectangle(w / 2, -560, 70, 50, {
    render: { fillStyle: color }
  });

  const circle = Bodies.circle(w / 2, -720, 35, {
    render: { fillStyle: color }
  });

  shapes = [triangle, rectangle, circle];

  Composite.add(world, shapes);

  console.log("✔ EXACT 3 SHAPES CREATED");
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
// START ON FIRST INTERACTION
// -------------------------
function startOnce() {
  if (started) return;

  started = true;

  console.log("✔ Interaction triggered");

  createShapes();
}

// -------------------------
// SCROLL FORCE + TOWER TRIGGER
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
// DRIFT
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
// FINAL TOWER
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
// INIT (IMPORTANT: NO window.load)
// -------------------------
initPhysics();
