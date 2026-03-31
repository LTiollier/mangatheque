'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

export interface ScanParticlesRef {
  play: () => void;
}

export const ScanSuccessParticles = forwardRef<ScanParticlesRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);
    const canvas = renderer.domElement;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const frustumSize = 10;
    const camera = new THREE.OrthographicCamera(
      -frustumSize / 2, frustumSize / 2,
      frustumSize / 2, -frustumSize / 2,
      0.1, 20
    );
    camera.position.z = 10;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      const aspect = w / h;
      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // Helper : crée une géométrie étoile
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

    const starColors = [0xffb7c5, 0xb5d8ff, 0xffd6f5, 0xc3f0ca, 0xffe4a0, 0xe8d5ff];
    const particleColors = [0xffb7c5, 0xb5d8ff, 0xffd6f5, 0xc3f0ca, 0xffe4a0];

    interface Particle {
      mesh: THREE.Mesh;
      type: 'star' | 'circle';
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      rotSpeed: number;
      baseScale: number;
    }
    const particles: Particle[] = [];

    function spawnBurst() {
      // Create geometries once and reuse, but for simplicity here we can just create per burst
      for (let i = 0; i < 15; i++) {
        const pts = Math.floor(Math.random() * 3) + 4; // 4 to 6
        const mat = new THREE.MeshBasicMaterial({
          color: starColors[Math.floor(Math.random() * starColors.length)],
          transparent: true,
          opacity: 1
        });
        const mesh = new THREE.Mesh(makeStarGeometry(0.2, 0.08, pts), mat);
        scene.add(mesh);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.15;
        particles.push({
          mesh,
          type: 'star',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 0.05,
          life: 1.0,
          maxLife: 1.0 + Math.random() * 0.8,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          baseScale: 0.8 + Math.random() * 0.5
        });
      }

      for (let i = 0; i < 20; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          transparent: true,
          opacity: 1
        });
        const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.06 + Math.random() * 0.06, 8), mat);
        scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.15;
        particles.push({
          mesh,
          type: 'circle',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 0.05,
          life: 1.0,
          maxLife: 0.8 + Math.random() * 0.6,
          rotSpeed: 0,
          baseScale: 0.6 + Math.random() * 0.4
        });
      }
    }

    const clock = new THREE.Clock();
    let animId: number;

    function tick() {
      animId = requestAnimationFrame(tick);
      const dt = clock.getDelta();

      if (playRef.current) {
        spawnBurst();
        playRef.current = false;
      }

      // We use 60fps base multiplier for physics
      const timeScale = dt * 60;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        
        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          particles.splice(i, 1);
          continue;
        }

        const normalizedLife = p.life / p.maxLife;

        // Apply velocities and gravity
        p.mesh.position.x += p.vx * timeScale;
        p.mesh.position.y += p.vy * timeScale;
        p.vy -= 0.005 * timeScale; // gravity
        p.vx *= Math.pow(0.96, timeScale); // friction
        p.vy *= Math.pow(0.96, timeScale);

        p.mesh.rotation.z += p.rotSpeed * timeScale;
        
        // Scale and opacity
        const scaleProgress = p.type === 'star' ? Math.sin(normalizedLife * Math.PI) : normalizedLife;
        p.mesh.scale.setScalar(Math.max(0.001, scaleProgress * p.baseScale));
        
        (p.mesh.material as THREE.Material).opacity = normalizedLife;
      }

      renderer.render(scene, camera);
    }
    
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      particles.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      });
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => {
      playRef.current = true;
    }
  }));

  return <div ref={containerRef} aria-hidden />;
});

ScanSuccessParticles.displayName = 'ScanSuccessParticles';
