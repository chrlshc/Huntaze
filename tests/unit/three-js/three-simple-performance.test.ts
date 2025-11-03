/**
 * Simple Three.js Performance Tests
 * 
 * Basic performance validation for Three.js after React 19 upgrade
 */

import { describe, it, expect } from 'vitest';

describe('Three.js Simple Performance', () => {
  it('should import packages quickly', async () => {
    const startTime = Date.now();
    
    const [THREE, fiber, drei] = await Promise.all([
      import('three'),
      import('@react-three/fiber'),
      import('@react-three/drei')
    ]);
    
    const endTime = Date.now();
    const importTime = endTime - startTime;
    
    // Should import within 2 seconds (very generous for CI environments)
    expect(importTime).toBeLessThan(2000);
    
    // Verify imports
    expect(THREE.REVISION).toBe('181');
    expect(fiber.Canvas).toBeDefined();
    expect(drei.Sparkles).toBeDefined();
  });

  it('should create objects efficiently', async () => {
    const THREE = await import('three');
    
    const startTime = Date.now();
    
    // Create 100 objects
    const objects = Array.from({ length: 100 }, () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
      const mesh = new THREE.Mesh(geometry, material);
      return { geometry, material, mesh };
    });
    
    const endTime = Date.now();
    const creationTime = endTime - startTime;
    
    // Should create 100 objects within 200ms
    expect(creationTime).toBeLessThan(200);
    expect(objects.length).toBe(100);
    
    // Cleanup
    objects.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
  });

  it('should handle math operations efficiently', async () => {
    const THREE = await import('three');
    
    const startTime = Date.now();
    
    // Perform 1000 calculations similar to PhoneMockup3D
    for (let i = 0; i < 1000; i++) {
      const progress = i / 1000;
      const rotation = progress * Math.PI * 2;
      const floating = Math.sin(i * 0.016 * 2) * 0.05;
      const vector = new THREE.Vector3(1, 1, 1);
      vector.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1);
      const appIndex = Math.floor(progress * 3) % 3;
    }
    
    const endTime = Date.now();
    const mathTime = endTime - startTime;
    
    // Should complete 1000 calculations within 100ms
    expect(mathTime).toBeLessThan(100);
  });

  it('should access drei components efficiently', async () => {
    const drei = await import('@react-three/drei');
    
    const startTime = Date.now();
    
    // Access all critical components
    const components = [
      drei.Float,
      drei.PerspectiveCamera,
      drei.Environment,
      drei.ContactShadows,
      drei.Html,
      drei.RoundedBox,
      drei.Sparkles,
      drei.OrbitControls,
      drei.Text,
      drei.Box,
      drei.Sphere,
    ];
    
    // Verify they exist
    components.forEach(component => {
      expect(component).toBeDefined();
    });
    
    const endTime = Date.now();
    const accessTime = endTime - startTime;
    
    // Should access all components within 50ms
    expect(accessTime).toBeLessThan(50);
  });

  it('should validate no performance regression', async () => {
    // This test ensures the upgrade doesn't introduce major performance issues
    const startTime = Date.now();
    
    const THREE = await import('three');
    
    // Create a scene similar to PhoneMockup3D
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    
    // Create phone components
    const phoneGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const phoneMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      metalness: 0.8,
      roughness: 0.2
    });
    const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
    
    const screenGeometry = new THREE.PlaneGeometry(0.9, 1.8);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: '#00AFF0' });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    
    scene.add(phone, screen);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(ambientLight, directionalLight);
    
    const endTime = Date.now();
    const sceneTime = endTime - startTime;
    
    // Should create complete scene within 100ms
    expect(sceneTime).toBeLessThan(100);
    expect(scene.children.length).toBe(4); // phone + screen + 2 lights
    
    // Cleanup
    phoneGeometry.dispose();
    phoneMaterial.dispose();
    screenGeometry.dispose();
    screenMaterial.dispose();
  });
});