
// =========================
// SIMPLE CUSTOM RENDERER (WEBFLOW SAFE)
// =========================
const { Engine, Runner, Bodies, Composite, Body } = Matter;

// 1. HARD CLEANUP: WIPE ALL GLOBAL FOOTPRINTS IMMEDIATELY BEFORE INITIALIZING
if (window.__PHYSICS_RUNTIME__) {
  try {
    Runner.stop(window.__PHYSICS_RUNTIME__.runner);
    Composite.clear(window.__PHYSICS_RUNTIME__.engine.world, false);
  } catch (e) {}
}
if (window.__PHYSICS_FRAME_ID__) {
  cancelAnimationFrame(window.__PHYSICS_FRAME_ID__);
}

// Reset references globally on rebuild
window.__TR__ = null;
window.__RE__ = null;
window.__CI__ = null;

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
  // SHAPES CREATION (BALANCED FOR TOWER)
  // -------------------------
  function createShapes() {
    const bodies = Composite.allBodies(world);
    
    const existingTriangle = bodies.find(b => b.label === "tri");
    const existingRectangle = bodies.find(b => b.label === "rect");
    const existingCircle = bodies.find(b => b.label === "circ");

    // Physics options to prevent sliding/rolling apart too easily
    const stableOptions = { friction: 0.5, frictionStatic: 1, restitution: 0.1 };

    if (!existingTriangle) {
      // Spawning the triangle upside down (angle: Math.PI) so it has a flat top to support the rectangle!
      window.__TR__ = Bodies.polygon(window.innerWidth / 2, -200, 3, 45, { ...stableOptions, angle: Math.PI });
      window.__TR__.label = "tri";
      Composite.add(world, window.__TR__);
    }
    if (!existingRectangle) {
      window.__RE__ = Bodies.rectangle(window.innerWidth / 2, -380, 70, 50, stableOptions);
      window.__RE__.label = "rect";
      Composite.add(world, window.__RE__);
    }
    if (!existingCircle) {
      window.__CI__ = Bodies.circle(window.innerWidth / 2, -560, 35, stableOptions);
      window.__CI__.label = "circ";
      Composite.add(world, window.__CI__);
    }

    // ABSOLUTE CEILING GUARD
    const finalCheck = Composite.allBodies(world);
    let triCount = 0, rectCount = 0, circCount = 0;
    finalCheck.forEach(b => {
      if (b.label === "tri") { triCount++; if (triCount > 1) Composite.remove(world, b); }
      if (b.label === "rect") { rectCount++; if (rectCount > 1) Composite.remove(world, b); }
      if (b.label === "circ") { circCount++; if (circCount > 1) Composite.remove(world, b); }
    });
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

    // Strictly draw ONLY what is currently tied to our unified engine labels
    const active = Composite.allBodies(world);
    const drawTri = active.find(b => b.label === "tri");
    const drawRect = active.find(b => b.label === "rect");
    const drawCirc = active.find(b => b.label === "circ");

    if (drawTri) drawShape(drawTri);
    if (drawRect) drawShape(drawRect);
    if (drawCirc) drawShape(drawCirc);

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
    
    const active = Composite.allBodies(world);
    const drawTri = active.find(b => b.label === "tri");
    const drawRect = active.find(b => b.label === "rect");
    const drawCirc = active.find(b => b.label === "circ");

    [drawTri, drawRect, drawCirc].forEach(shape => {
      if (!shape) return;
      Body.applyForce(shape, shape.position, { x: 0, y: -0.0008 });
    });

    // Final Stacking Tower Execution Logic (Perfect Alignment)
    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    if (atBottom && drawTri && drawRect && drawCirc) {
      const targetX = window.innerWidth - 120;
      const groundY = window.innerHeight - 45; // Just above the static ground boundary

      // 1. Triangle Base (Flipped upside down so its flat top handles weight)
      Body.setPosition(drawTri, { x: targetX, y: groundY });
      Body.setVelocity(drawTri, { x: 0, y: 0 });
      Body.setAngle(drawTri, Math.PI); 

      // 2. Rectangle Middle (Stacked centered on top of triangle platform)
      Body.setPosition(drawRect, { x: targetX, y: groundY - 45 });
      Body.setVelocity(drawRect, { x: 0, y: 0 });
      Body.setAngle(drawRect, 0); 

      // 3. Circle Top (Perfectly balanced directly on the rectangle)
      Body.setPosition(drawCirc, { x: targetX, y: groundY - 85 });
      Body.setVelocity(drawCirc, { x: 0, y: 0 });
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
          const active = Composite.allBodies(world);
          const drawTri = active.find(b => b.label === "tri");
          const drawRect = active.find(b => b.label === "rect");
          const drawCirc = active.find(b => b.label === "circ");

          [drawTri, drawRect, drawCirc].forEach(shape => {
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
