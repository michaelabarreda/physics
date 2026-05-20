// =========================
// SIMPLE CUSTOM RENDERER (WEBFLOW SAFE)
// =========================
const { Engine, Runner, Bodies, Composite, Body } = Matter;

// 1. HARD CLEANUP: WIPE ALL GLOBAL FOOTPRINTS IMMEDIATELY BEFORE INITIALIZING
if (window.__PHYSICS_RUNTIME__) {
  try {
    Matter.Runner.stop(window.__PHYSICS_RUNTIME__.runner);
    Matter.Composite.clear(window.__PHYSICS_RUNTIME__.engine.world, false);
  } catch (e) {}
}
if (window.__PHYSICS_FRAME_ID__) {
  cancelAnimationFrame(window.__PHYSICS_FRAME_ID__);
}

// Reset the shape references globally so old iterations cannot be rendered
window.__SHAPE_TRIANGLE__ = null;
window.__SHAPE_RECTANGLE__ = null;
window.__SHAPE_CIRCLE__ = null;

// Prevent script concurrency layout races
if (window.__PHYSICS_INIT_LOCK__) {
  console.log("Physics blocked — instance already running.");
} else {
  window.__PHYSICS_INIT_LOCK__ = true;
  initPhysics();
}

function initPhysics() {
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
  // SHAPES CREATION (STRICT SINGLETON CEILING)
  // -------------------------
  function createShapes() {
    // If ANY shape key holds a body reference, absolutely reject spawning any more
    if (window.__SHAPE_TRIANGLE__ || window.__SHAPE_RECTANGLE__ || window.__SHAPE_CIRCLE__) {
      return;
    }

    window.__SHAPE_TRIANGLE__ = Bodies.polygon(window.innerWidth / 2, -200, 3, 45);
    window.__SHAPE_RECTANGLE__ = Bodies.rectangle(window.innerWidth / 2, -380, 70, 50);
    window.__SHAPE_CIRCLE__ = Bodies.circle(window.innerWidth / 2, -560, 35);

    Composite.add(world, [window.__SHAPE_TRIANGLE__, window.__SHAPE_RECTANGLE__, window.__SHAPE_CIRCLE__]);
  }

  // -------------------------
  // START INTERACTION TRIGGER
  // -------------------------
  window.startPhysicsGlobal = function(e) {
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

  window.addEventListener("mousemove", window.startPhysicsGlobal);
  window.addEventListener("touchstart", window.startPhysicsGlobal);

  // Safe recovery execution check
  if (window.__PHYSICS_STARTED__) {
    createShapes();
  }

  // -------------------------
  // CLEAN RENDERING DRAW LOOP
  // -------------------------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Strictly draw ONLY what is currently tied to our global keys
    if (window.__SHAPE_TRIANGLE__) drawShape(window.__SHAPE_TRIANGLE__);
    if (window.__SHAPE_RECTANGLE__) drawShape(window.__SHAPE_RECTANGLE__);
    if (window.__SHAPE_CIRCLE__) drawShape(window.__SHAPE_CIRCLE__);

    window.__PHYSICS_FRAME_ID__ = requestAnimationFrame(draw);
  }

  function drawShape(body) {
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
  // EVENT FUNCTIONS (PERSISTENCE PROOF)
  // -------------------------
  function handleScrollPhysics() {
    if (!window.__PHYSICS_STARTED__) return;
    
    const shapes = [window.__SHAPE_TRIANGLE__, window.__SHAPE_RECTANGLE__, window.__SHAPE_CIRCLE__];
    shapes.forEach(shape => {
      if (!shape) return;
      Body.applyForce(shape, shape.position, { x: 0, y: -0.0008 });
    });

    // Final Stacking Tower Execution Logic
    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    if (atBottom && window.__SHAPE_TRIANGLE__ && window.__SHAPE_RECTANGLE__ && window.__SHAPE_CIRCLE__) {
      const x = window.innerWidth - 120;
      const y = window.innerHeight - 80;

      Body.setPosition(window.__SHAPE_TRIANGLE__, { x, y });
      Body.setPosition(window.__SHAPE_RECTANGLE__, { x, y: y - 70 });
      Body.setPosition(window.__SHAPE_CIRCLE__, { x, y: y - 140 });
    }
  }

  // Clear previous identical window scroll loops to prevent stacking loops
  window.removeEventListener("scroll", handleScrollPhysics);
  window.addEventListener("scroll", handleScrollPhysics);

  // Intersection Observer Drift Setup
  const contact = document.querySelector("#contact-section");
  if (contact) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const shapes = [window.__SHAPE_TRIANGLE__, window.__SHAPE_RECTANGLE__, window.__SHAPE_CIRCLE__];
          shapes.forEach(shape => {
            if (!shape) return;
            Body.applyForce(shape, shape.position, { x: 0.002, y: 0.001 });
          });
        }
      });
    });
    observer.observe(contact);
  }

  window.addEventListener("resize", resize);
}
