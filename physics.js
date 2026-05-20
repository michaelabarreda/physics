// -------------------------
  // SHAPES CREATION (STACKED SPAWN COLLISION)
  // -------------------------
  function createShapes() {
    const bodies = Composite.allBodies(world);
    
    const existingTriangle = bodies.find(b => b.label === "tri");
    const existingRectangle = bodies.find(b => b.label === "rect");
    const existingCircle = bodies.find(b => b.label === "circ");

    // High friction and low bounce so they grip instead of sliding off
    const stableOptions = { 
      friction: 0.8, 
      frictionStatic: 1.5, 
      restitution: 0.05, // Almost zero bounce
      density: 0.01 // Gives them enough weight to settle nicely
    };

    // We align their X centers perfectly, but tier their starting Y positions
    const spawnX = window.innerWidth / 2;

    if (!existingTriangle) {
      // Triangle spawns lowest (closest to ground), flipped upside down for a flat top platform
      window.__TR__ = Bodies.polygon(spawnX, -100, 3, 45, { ...stableOptions, angle: Math.PI });
      window.__TR__.label = "tri";
      Composite.add(world, window.__TR__);
    }
    if (!existingRectangle) {
      // Rectangle spawns right above the triangle
      window.__RE__ = Bodies.rectangle(spawnX, -220, 75, 45, stableOptions);
      window.__RE__.label = "rect";
      Composite.add(world, window.__RE__);
    }
    if (!existingCircle) {
      // Circle spawns highest up, dropping perfectly onto the flat rectangle roof
      window.__CI__ = Bodies.circle(spawnX, -340, 32, stableOptions);
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
