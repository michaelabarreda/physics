// =========================
// SIMPLE CUSTOM RENDERER (WEBFLOW SAFE - FIXED STACKING)
// =========================

const { Engine, Runner, Bodies, Composite, Body } = Matter;

// -------------------------
// SINGLETON CLEANUP
// -------------------------
if (window.__PHYSICS_RUNTIME__) {
  try {
    Runner.stop(window.__PHYSICS_RUNTIME__.runner);
    Composite.clear(window.__PHYSICS_RUNTIME__.engine.world, false);
  } catch (e) {}
}

if (window.__PHYSICS_FRAME_ID__) {
  cancelAnimationFrame(window.__PHYSICS_FRAME_ID__);
}

window.__TR__ = null;
window.__RE__ = null;
window.__CI__ = null;

// prevent duplicate init
if (window.__PHYSICS_INIT_LOCK__) {
  console.log("Physics blocked — already running.");
} else {
  window.__PHYSICS_INIT_LOCK__ = true;
  initPhysics();
}

function initPhysics() {

  // -------------------------
  // CANVAS
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
  const ground = Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight + 40,
    window.innerWidth,
    80,
    { isStatic: true }
  );

  const leftWall = Bodies.rectangle(-40, window.innerHeight / 2, 80, window.innerHeight, { isStatic: true });
  const rightWall = Bodies.rectangle(window.innerWidth + 40, window.innerHeight / 2, 80, window.innerHeight, { isStatic: true });

  Composite.add(world, [ground, leftWall, rightWall]);

  // -------------------------
  // STABLE PHYSICS SETTINGS
  // -------------------------
  const stableOptions = {
    friction: 0.9,
    frictionStatic: 1,
    restitution: 0,
    density: 0.005,
    sleepThreshold: 20
  };

  // -------------------------
  // CREATE SHAPES (ONLY ONCE)
  // -------------------------
  function createShapes() {

    const bodies = Composite.allBodies(world);

    const triExists = bodies.find(b => b.label === "tri");
    const rectExists = bodies.find(b => b.label === "rect");
    const circExists = bodies.find(b => b.label === "circ");

    if (!triExists) {
      window.__TR__ = Bodies.polygon(
        window.innerWidth / 2,
        -200,
        3,
        60,
        { ...stableOptions, angle: Math.PI }
      );

      window.__TR__.label = "tri";
      Body.scale(window.__TR__, 1.2, 0.6);
      Body.setInertia(window.__TR__, Infinity);

      Composite.add(world, window.__TR__);
    }

    if (!rectExists) {
      window.__RE__ = Bodies.rectangle(
        window.innerWidth / 2,
        -350,
        70,
        50,
        stableOptions
      );

      window.__RE__.label = "rect";
      Body.setInertia(window.__RE__, Infinity);

      Composite.add(world, window.__RE__);
    }

    if (!circExists) {
      window.__CI__ = Bodies.circle(
        window.innerWidth / 2,
        -500,
        35,
        stableOptions
      );

      window.__CI__.label = "circ";
      Body.setInertia(window.__CI__, Infinity);

      Composite.add(world, window.__CI__);
    }

    // safety cleanup (prevents duplicates)
    const all = Composite.allBodies(world);
    const seen = { tri: 0, rect: 0, circ: 0 };

    all.forEach(b => {
      if (b.label === "tri") {
        seen.tri++;
        if (seen.tri > 1) Composite.remove(world, b);
      }
      if (b.label === "rect") {
        seen.rect++;
        if (seen.rect > 1) Composite.remove(world, b);
      }
      if (b.label === "circ") {
        seen.circ++;
        if (seen.circ > 1) Composite.remove(world, b);
      }
    });
  }

  // -------------------------
  // START TRIGGER
  // -------------------------
  window.startPhysicsGlobal = function () {
    if (window.__PHYSICS_STARTED__) return;

    window.__PHYSICS_STARTED__ = true;
    createShapes();
  };

  window.addEventListener("mousemove", window.startPhysicsGlobal, { once: true });
  window.addEventListener("touchstart", window.startPhysicsGlobal, { once: true });

  // -------------------------
  // RENDER LOOP
  // -------------------------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bodies = Composite.allBodies(world);

    const tri = bodies.find(b => b.label === "tri");
    const rect = bodies.find(b => b.label === "rect");
    const circ = bodies.find(b => b.label === "circ");

    if (tri) drawShape(tri);
    if (rect) drawShape(rect);
    if (circ) drawShape(circ);

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
  // NATURAL DRIFT (optional subtle interaction)
  // -------------------------
  function handleScrollPhysics() {
    if (!window.__PHYSICS_STARTED__) return;

    const bodies = Composite.allBodies(world);
    const tri = bodies.find(b => b.label === "tri");
    const rect = bodies.find(b => b.label === "rect");
    const circ = bodies.find(b => b.label === "circ");

    [tri, rect, circ].forEach(shape => {
      if (!shape) return;
      Body.applyForce(shape, shape.position, { x: 0, y: -0.0003 });
    });
  }

  window.addEventListener("scroll", handleScrollPhysics);

  // -------------------------
  // RESIZE
  // -------------------------
  window.addEventListener("resize", resize);
}
