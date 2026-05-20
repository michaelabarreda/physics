// =========================
// SIMPLE CUSTOM RENDERER (WEBFLOW SAFE)
// =========================
const { Engine, Runner, Bodies, Composite, Body } = Matter;

// Global tracking variables
let frameId = null; 
let triangle = null;
let rectangle = null;
let circle = null;

// HARD BOUNDARY: Stop multiple scripts from initializing simultaneously
if (window.__PHYSICS_INIT_LOCK__) {
  console.log("Physics engine script execution blocked — already running.");
} else {
  window.__PHYSICS_INIT_LOCK__ = true;
  initPhysics();
}

function initPhysics() {
  // If an old runtime engine instance is active, completely destroy it first
  if (window.__PHYSICS_RUNTIME__) {
    try {
      Runner.stop(window.__PHYSICS_RUNTIME__.runner);
      Composite.clear(window.__PHYSICS_RUNTIME__.engine.world, false);
      if (frameId) cancelAnimationFrame(frameId);
    } catch (e) {
      console.warn("Cleanup skipped:", e);
    }
  }

  // -------------------------
  // CANVAS DETECTION
  // -------------------------
  const canvas = document.getElementById("physics-canvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  // -------------------------
  // ENGINE SETUP
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
  // SHAPES CREATION (STRICT TOTAL COUNT GUARD)
  // -------------------------
  function createShapes() {
    // Check Matter's world directly. If we have more than the 3 boundary walls, DO NOT SPAWN.
    const currentBodies = Composite.allBodies(world);
    if (currentBodies.length > 3) {
      console.log("Shapes already present in physics world. Aborting spawn.");
      return;
    }

    // Spawn exactly 1 of each
    triangle = Bodies.polygon(window.innerWidth / 2, -200, 3, 45);
    rectangle = Bodies.rectangle(window.innerWidth / 2, -380, 70, 50);
    circle = Bodies.circle(window.innerWidth / 2, -560, 35);

    Composite.add(world, [triangle, rectangle, circle]);
  }

  // -------------------------
  // START TRIGGER (RACE CONDITION PROOF)
  // -------------------------
  window.startPhysicsGlobal = function(e) {
    // If already triggered, immediately unbind everything and exit
    if (window.__PHYSICS_STARTED__) {
      cleanupListeners();
      return;
    }
    
    window.__PHYSICS_STARTED__ = true;
    cleanupListeners();
    createShapes();
  };

  function cleanupListeners() {
    window.removeEventListener("mousemove", window.startPhysicsGlobal);
    window.removeEventListener("touchstart", window.startPhysicsGlobal);
  }

  // Bind interaction triggers
  window.addEventListener("mousemove", window.startPhysicsGlobal);
  window.addEventListener("touchstart", window.startPhysicsGlobal);

  // Fallback engine check
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

  draw();

  // -------------------------
  // SCROLL FORCE
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
  // FINAL STACKING TOWER
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

  window.addEventListener("resize", resize);
}
