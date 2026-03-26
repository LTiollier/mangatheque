'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function NekoLogoBounce() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = 180;
    const H = 180;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.width = `${W}px`;
    renderer.domElement.style.height = `${H}px`;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const half = 2.2;
    const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 20);
    camera.position.z = 10;

    // Logo chat kawaii
    const texture = new THREE.TextureLoader().load('/logo.png');
    const logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    scene.add(logoMesh);

    // 5 petits coeurs roses qui montent
    const heartProps = Array.from({ length: 5 }, (_, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffb7c5,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), mat);
      scene.add(mesh);
      return {
        mesh,
        x: (Math.random() - 0.5) * 1.4,
        phase: (i / 5) * Math.PI * 2,
      };
    });

    // Helper : crée une géométrie étoile à n branches
    function makeStarGeometry(outerR: number, innerR: number, pts: number) {
      const shape = new THREE.Shape();
      for (let j = 0; j < pts * 2; j++) {
        const angle = (j / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? outerR : innerR;
        if (j === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      shape.closePath();
      return new THREE.ShapeGeometry(shape);
    }

    // 20 étoiles scintillantes (tailles et formes variées)
    const starColors = [0xffb7c5, 0xb5d8ff, 0xffd6f5, 0xc3f0ca, 0xffe4a0, 0xe8d5ff];
    const starDefs = [
      { outerR: 0.11, innerR: 0.045, pts: 4 }, // diamant
      { outerR: 0.09, innerR: 0.038, pts: 5 }, // étoile 5 branches
      { outerR: 0.07, innerR: 0.032, pts: 6 }, // étoile 6 branches
      { outerR: 0.13, innerR: 0.055, pts: 4 }, // grand diamant
    ];
    const stars = Array.from({ length: 20 }, (_, i) => {
      const def = starDefs[i % starDefs.length];
      const mat = new THREE.MeshBasicMaterial({
        color: starColors[i % starColors.length],
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(makeStarGeometry(def.outerR, def.innerR, def.pts), mat);
      scene.add(mesh);
      return {
        mesh,
        x: (Math.random() - 0.5) * 3.8,
        y: (Math.random() - 0.5) * 3.8,
        speed: 0.3 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * 1.0,
        drift: { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 },
      };
    });

    // 30 particules rondes (points lumineux)
    const particleColors = [0xffb7c5, 0xb5d8ff, 0xffd6f5, 0xc3f0ca, 0xffe4a0];
    const particles = Array.from({ length: 30 }, (_, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: particleColors[i % particleColors.length],
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.03 + Math.random() * 0.04, 8), mat);
      scene.add(mesh);
      return {
        mesh,
        x: (Math.random() - 0.5) * 4.0,
        y: (Math.random() - 0.5) * 4.0,
        speed: 0.2 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        orbitR: 0.08 + Math.random() * 0.2,
      };
    });

    const clock = new THREE.Clock();
    let animId: number;

    function tick() {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Bounce élastique du logo
      const bounce = Math.pow(Math.abs(Math.sin(t * 1.8)), 0.6);
      logoMesh.position.y = bounce * 0.16 - 0.04;
      logoMesh.scale.y = 0.88 + bounce * 0.22;
      logoMesh.scale.x = 1.08 - bounce * 0.08;
      logoMesh.rotation.z = Math.sin(t * 3.5) * 0.025;

      // Coeurs qui montent et disparaissent
      heartProps.forEach(({ mesh, x, phase }) => {
        const progress = ((t * 0.35 + phase) % (Math.PI * 2)) / (Math.PI * 2);
        mesh.position.y = -1.8 + progress * 3.6;
        mesh.position.x = x + Math.sin(t * 1.8 + phase) * 0.18;
        const opacity = Math.min(progress * 4, 1) * Math.min((1 - progress) * 4, 1);
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.85;
        mesh.scale.setScalar(0.5 + progress * 0.7);
      });

      // Étoiles scintillantes avec drift
      stars.forEach(({ mesh, x, y, speed, phase, size, drift }) => {
        const pulse = (Math.sin(t * speed + phase) + 1) / 2;
        mesh.position.x = x + Math.cos(t * speed * 0.25 + phase) * 0.2 + Math.sin(t * drift.x + phase) * 0.1;
        mesh.position.y = y + Math.sin(t * speed * 0.3 + phase) * 0.18 + Math.cos(t * drift.y + phase) * 0.1;
        mesh.rotation.z = t * speed * 0.8;
        mesh.scale.setScalar(size * (0.55 + pulse * 0.45));
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + pulse * 0.75;
      });

      // Particules rondes qui pulsent
      particles.forEach(({ mesh, x, y, speed, phase, orbitR }) => {
        const pulse = (Math.sin(t * speed * 1.5 + phase) + 1) / 2;
        mesh.position.x = x + Math.cos(t * speed + phase) * orbitR;
        mesh.position.y = y + Math.sin(t * speed * 0.8 + phase) * orbitR;
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.8;
        mesh.scale.setScalar(0.6 + pulse * 0.8);
      });

      renderer.render(scene, camera);
    }

    tick();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: 180, height: 180 }}
      aria-hidden
    />
  );
}
