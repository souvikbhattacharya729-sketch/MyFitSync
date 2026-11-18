import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * ActivityRing3D: Interactive 3D Activity Rings in Three.js.
 * Renders concentric fitness rings in 3D perspective with smooth rotation,
 * ambient lighting, and mouse orbit interaction.
 */
export const ActivityRing3D = ({
  caloriePct = 75,
  volumePct = 60,
  proteinPct = 85,
  size = 220,
}) => {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Subtle soft ambient & directional lighting (Mint & Sage tones)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xdcefe3, 2.0);
    dirLight1.position.set(4, 6, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa8d5b5, 1.2);
    dirLight2.position.set(-4, -4, 4);
    scene.add(dirLight2);

    const ringGroup = new THREE.Group();
    // Angle slightly in isometric perspective
    ringGroup.rotation.x = 0.55;
    ringGroup.rotation.y = -0.35;
    scene.add(ringGroup);

    // Helper to create an arc tube / torus ring with rounded caps
    const createRing = (radius, tube, progress, colorHex, opacity = 1.0) => {
      const group = new THREE.Group();

      // Track background ring
      const bgGeom = new THREE.TorusGeometry(radius, tube, 24, 64);
      const bgMat = new THREE.MeshStandardMaterial({
        color: 0xedf5ef,
        roughness: 0.5,
        metalness: 0.1,
      });
      const bgMesh = new THREE.Mesh(bgGeom, bgMat);
      group.add(bgMesh);

      // Active progress arc
      const clampedPct = Math.min(Math.max(progress / 100, 0.05), 1.0);
      const arcAngle = clampedPct * Math.PI * 2;
      const fgGeom = new THREE.TorusGeometry(radius, tube * 1.08, 24, 64, arcAngle);
      const fgMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.25,
        metalness: 0.2,
      });
      const fgMesh = new THREE.Mesh(fgGeom, fgMat);
      fgMesh.rotation.z = Math.PI / 2; // start from top
      group.add(fgMesh);

      return group;
    };

    // 1. Outer Ring (Calories): Action Green #6BA985
    const r1 = createRing(2.6, 0.22, caloriePct, 0x6ba985);
    // 2. Middle Ring (Workout Volume): Forest Green #263D32
    const r2 = createRing(2.0, 0.22, volumePct, 0x263d32);
    // 3. Inner Ring (Protein & Nutrition): Sage Green #A8D5B5
    const r3 = createRing(1.4, 0.22, proteinPct, 0xa8d5b5);

    ringGroup.add(r1);
    ringGroup.add(r2);
    ringGroup.add(r3);

    // Mouse movement interaction
    let targetRotX = 0.55;
    let targetRotY = -0.35;
    let currentRotX = 0.55;
    let currentRotY = -0.35;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = -0.35 + x * 0.45;
      targetRotX = 0.55 - y * 0.45;
    };

    const handleMouseLeave = () => {
      targetRotX = 0.55;
      targetRotY = -0.35;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Render loop
    let reqId;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle floating animation
      currentRotX += (targetRotX + Math.sin(elapsed * 0.8) * 0.05 - currentRotX) * 0.08;
      currentRotY += (targetRotY + Math.cos(elapsed * 0.6) * 0.05 - currentRotY) * 0.08;

      ringGroup.rotation.x = currentRotX;
      ringGroup.rotation.y = currentRotY;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [caloriePct, volumePct, proteinPct, size]);

  if (!hasWebGL) {
    // 2D SVG fallback if WebGL disabled
    return (
      <div className="flex items-center justify-center p-4">
        <svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[-90deg]">
          <circle cx="50" cy="50" r="40" stroke="#EDF5EF" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="40" stroke="#6BA985" strokeWidth="6" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - Math.min(caloriePct, 100) / 100)} strokeLinecap="round" />
          <circle cx="50" cy="50" r="30" stroke="#EDF5EF" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="30" stroke="#263D32" strokeWidth="6" fill="none" strokeDasharray="188.4" strokeDashoffset={188.4 * (1 - Math.min(volumePct, 100) / 100)} strokeLinecap="round" />
          <circle cx="50" cy="50" r="20" stroke="#EDF5EF" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="20" stroke="#A8D5B5" strokeWidth="6" fill="none" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - Math.min(proteinPct, 100) / 100)} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
      <div ref={mountRef} className="w-full flex items-center justify-center" />
      {/* 3D Depth Floor Shadow */}
      <div
        className="pointer-events-none absolute bottom-1 w-32 h-4 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(38, 61, 50, 0.12) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
