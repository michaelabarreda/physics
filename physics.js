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
  if (shapes.length > 0) return; // prevent duplicates

  const w = window.innerWidth;
  const colors = "rgba(196, 96, 58, 0.18)";

  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w;
    const y = -300 - Math.random() * 600;

    let shape;

    if (i % 3 === 0) {
      shape = Bodies.circle(x, y, 30, {
        render: { fillStyle: colors }
      });
    } else if (i % 3 === 1) {
      shape = Bodies.rectangle(x, y, 60, 60, {
        render: { fillStyle: colors }
      });
    } else {
      shape = Bodies.polygon(x, y, 3, 40, {
        render: { fillStyle: colors }
      });
    }

    shapes.push(shape);
  }

  Composite.add(world, shapes);

  console.log("Shapes created ✔");
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
  const baseY = h - 80;

  shapes.forEach((s, i) => {

    Body.setVelocity(s, { x: 0, y: 0 });
    Body.setAngularVelocity(s, 0);

    Body.setPosition(s, {
      x: baseX,
      y: baseY - i * 55
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
