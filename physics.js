// =========================
// SIMPLE CUSTOM RENDERER (WEBFLOW SAFE)
// =========================
const { Engine, Runner, Bodies, Composite, Body } = Matter;

// Track the animation frame and shapes globally so they persist across Webflow re-loads
let frameId = null; 
let triangle = null;
let rectangle = null;
let circle = null;

// Initialize global tracking state on the window object
window.__PHYSICS_STARTED__ = window.__PHYSICS_STARTED__ || false;

// -------------------------
// GLOBAL SINGLETON (HARD GUARD)
// -------------------------
if (window.__PHYSICS_INIT__) {
  console.log("Physics already initialized — skipping duplicate load");
} else {
  window.__PHYSICS_INIT__ = true;
  initPhysics();
}

function initPhysics() {
  // If something already exists, kill it safely
  if (window.__PHYSICS_RUNTIME__) {
    const prev = window.__PHYSICS_RUNTIME__;
    try {
      Runner.stop(prev.runner);
      Composite.clear(prev.engine.world, false);
      
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    } catch (e) {
      console.warn("Cleanup skipped:", e);
    }
  }

  // -------------------------
  // CANVAS
  // -------------------------
  const canvas = document.getElementById("physics-canvas");
  if (!canvas) {
    console.warn("Canvas missing — physics aborted");
    return;
  }
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  // -------------------------
  // ENGINE
  // -------------------------
  const engine = Engine.create();
  const world = engine.world;
  const runner = Runner.create();

  window.__PHYSICS_RUNTIME__ = { engine, runner };
  Runner.run(runner, engine);

  // -------------------------
  // BOUNDS
  // -------------------------
  const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 40, window.innerWidth, 80, { isStatic: true });
  const leftWall = Bodies.rectangle(-40, window.innerHeight / 2, 80, window.innerHeight, { isStatic: true });
  const rightWall = Bodies.rectangle(window.innerWidth + 40, window.innerHeight / 2, 80, window.innerHeight, { isStatic: true });

  Composite.add(world, [ground, leftWall, rightWall]);

  // -------------------------
  // SHAPES CREATION
  // -------------------------
  function createShapes() {
    // ULTIMATE GUARD: If any shape body already exists in memory, do absolutely nothing
    if (triangle || rectangle || circle) return;

    triangle = Bodies.polygon(window.innerWidth / 2, -200, 3, 45);
    rectangle = Bodies.rectangle(window.innerWidth / 2, -380, 70, 50);
    circle = Bodies.circle(window.innerWidth / 2, -560, 35);

    Composite.add(world, [triangle, rectangle, circle]);
  }

  // -------------------------
  // START TRIGGER (GLOBAL-AWARE)
  // -------------------------
  window.startPhysicsGlobal = function() {
    if (window.__PHYSICS_STARTED__) return;
    window.__PHYSICS_STARTED__ = true;
    createShapes();
  };

  // Bind the global function to user interaction
  window.addEventListener("mousemove", window.startPhysicsGlobal, { once: true });
  window.addEventListener("touchstart", window.startPhysicsGlobal, { once: true });

  // If a previous execution already started the physics, regenerate shapes for the new canvas
  if (window.__PHYSICS_STARTED__) {
    createShapes();
  }

  // -------------------------
  // DRAW LOOP
  // -------------------------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawShape(triangle);
    drawShape(rectangle);
    drawShape(circle);

    frameId = requestAnimationFrame(draw);
  }

  function drawShape(body) {
    if (!body) return;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = "rgba(196,96,58,0.18)";

    if (body.circleRadius) {
      ctx.beginPath();
      ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(body.vertices[0].x - body.position.x, body.vertices[0].y - body.position.y);
      for (let i = 1; i < body.vertices.length; i++) {
        ctx.lineTo(body.vertices[i].x - body.position.x, body.vertices[i].y - body.position.y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Kick off the drawing loop
  draw();

  // -------------------------
  // SCROLL BOUNCE
  // -------------------------
  window.addEventListener("scroll", () => {
    if (!window.__PHYSICS_STARTED__) return;
    [triangle, rectangle, circle].forEach(shape => {
      if (!shape) return;
      Body.applyForce(shape, shape.position, { x: 0, y: -0.0008 });
    });
  });

  // -------------------------
  // CONTACT DRIFT
  // -------------------------
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

  function driftToCorner() {
    [triangle, rectangle, circle].forEach(shape => {
      if (!shape) return;
      Body.applyForce(shape, shape.position, { x: 0.002, y: 0.001 });
    });
  }

  // -------------------------
  // FINAL TOWER
  // -------------------------
  window.addEventListener("scroll", () => {
    if (!triangle || !rectangle || !circle) return;

    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    if (!atBottom) return;

    const x = window.innerWidth - 120;
    const y = window.innerHeight - 80;

    Body.setPosition(triangle, { x, y });
    Body.setPosition(rectangle, { x, y: y - 70 });
    Body.setPosition(circle, { x, y: y - 140 });
  });

  // -------------------------
  // RESIZE SAFE
  // -------------------------
  window.addEventListener("resize", resize);
}
