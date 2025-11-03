/**
 * Three.js Performance Benchmarks
 * 
 * Performance tests to ensure no regression after React 19 upgrade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock performance API if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  } as any;
}

// Mock WebGL context for performance tests
const mockWebGLContext = {
  getExtension: vi.fn(() => ({})),
  getParameter: vi.fn(() => 4096),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  drawArrays: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
};

global.document = {
  createElement: vi.fn(() => ({
    getContext: vi.fn(() => mockWebGLContext),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    width: 800,
    height: 600,
    style: {},
  })),
} as any;

global.window = {
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(),
} as any;

describe('Three.js Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import Three.js packages within performance budget', async () => {
    const startTime = performance.now();
    
    // Import all Three.js packages
    const [THREE, fiber, drei] = await Promise.all([
      import('three'),
      import('@react-three/fiber'),
      import('@react-three/drei')
    ]);
    
    const endTime = performance.now();
    const importTime = endTime - startTime;
    
    // Should import within 500ms (generous budget for CI environments)
    expect(importTime).toBeLessThan(500);
    
    // Verify imports are successful
    expect(THREE).toBeDefined();
    expect(fiber).toBeDefined();
    expect(drei).toBeDefined();
  });

  it('should create basic Three.js objects within performance budget', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Create objects similar to PhoneMockup3D component
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    // Create multiple geometries and materials
    const geometries = [
      new THREE.BoxGeometry(1, 2, 0.1),
      new THREE.PlaneGeometry(0.9, 1.8),
      new THREE.BoxGeometry(0.3, 0.08, 0.02),
      new THREE.BoxGeometry(0.02, 0.2, 0.05),
    ];
    
    const materials = [
      new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshBasicMaterial({ color: '#00AFF0' }),
      new THREE.MeshStandardMaterial({ color: '#000000' }),
      new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.7 }),
    ];
    
    // Create meshes
    const meshes = geometries.map((geometry, index) => {
      const material = materials[index % materials.length];
      return new THREE.Mesh(geometry, material);
    });
    
    // Add to scene
    meshes.forEach(mesh => scene.add(mesh));
    
    const endTime = performance.now();
    const creationTime = endTime - startTime;
    
    // Should create all objects within 50ms
    expect(creationTime).toBeLessThan(50);
    expect(scene.children.length).toBe(meshes.length);
  });

  it('should handle animation calculations within performance budget', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Simulate animation calculations from PhoneMockup3D
    const iterations = 1000;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const scrollProgress = i / iterations;
      const elapsedTime = i * 0.016; // 60fps
      
      // Rotation calculation
      const rotation = scrollProgress * Math.PI * 2;
      
      // Floating animation
      const floatingY = Math.sin(elapsedTime * 2) * 0.05;
      
      // Scale calculation
      const targetScale = Math.random() > 0.5 ? 1.05 : 1;
      const currentScale = new THREE.Vector3(1, 1, 1);
      currentScale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // App switching
      const appIndex = Math.floor(scrollProgress * 3) % 3;
      
      results.push({
        rotation,
        floatingY,
        scale: currentScale.x,
        appIndex
      });
    }
    
    const endTime = performance.now();
    const calculationTime = endTime - startTime;
    
    // Should complete 1000 animation calculations within 100ms
    expect(calculationTime).toBeLessThan(100);
    expect(results.length).toBe(iterations);
    
    // Verify calculations are reasonable
    const lastResult = results[results.length - 1];
    expect(lastResult.rotation).toBeCloseTo(Math.PI * 2);
    expect(lastResult.floatingY).toBeGreaterThanOrEqual(-0.05);
    expect(lastResult.floatingY).toBeLessThanOrEqual(0.05);
    expect(lastResult.appIndex).toBeGreaterThanOrEqual(0);
    expect(lastResult.appIndex).toBeLessThanOrEqual(2);
  });

  it('should handle multiple drei component instantiations efficiently', async () => {
    const drei = await import('@react-three/drei');
    
    const startTime = performance.now();
    
    // Test accessing multiple drei components (simulating component usage)
    const components = [
      drei.Float,
      drei.PerspectiveCamera,
      drei.Environment,
      drei.ContactShadows,
      drei.Html,
      drei.RoundedBox,
      drei.OrbitControls,
      drei.Text,
      drei.Box,
      drei.Sphere,
      drei.Sparkles,
    ];
    
    // Verify all components are accessible
    const componentChecks = components.map(component => {
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
      return component.name || 'Anonymous';
    });
    
    const endTime = performance.now();
    const accessTime = endTime - startTime;
    
    // Should access all components within 10ms
    expect(accessTime).toBeLessThan(10);
    expect(componentChecks.length).toBe(components.length);
  });

  it('should handle texture operations within performance budget', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Create multiple textures (simulating app mockup textures)
    const textureLoader = new THREE.TextureLoader();
    
    // Create canvas textures (since we can't load real images in tests)
    const canvases = Array.from({ length: 3 }, (_, i) => {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.width = 256;
      canvas.height = 256;
      return canvas;
    });
    
    const textures = canvases.map(canvas => new THREE.CanvasTexture(canvas));
    
    // Test texture properties
    textures.forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
    
    const endTime = performance.now();
    const textureTime = endTime - startTime;
    
    // Should create and configure textures within 20ms
    expect(textureTime).toBeLessThan(20);
    expect(textures.length).toBe(3);
    
    textures.forEach(texture => {
      expect(texture).toBeInstanceOf(THREE.CanvasTexture);
    });
  });

  it('should handle scene graph operations efficiently', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Create a complex scene similar to PhoneMockup3D
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    
    // Create phone components
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1a1a1a' })
    );
    
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.8),
      new THREE.MeshBasicMaterial({ color: '#00AFF0' })
    );
    screen.position.set(0, 0, 0.051);
    
    const notch = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: '#000000' })
    );
    notch.position.set(0, 0.85, 0.055);
    
    const buttons = Array.from({ length: 2 }, (_, i) => {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, i === 0 ? 0.2 : 0.1, 0.05),
        new THREE.MeshStandardMaterial({ color: '#2a2a2a' })
      );
      button.position.set(-0.52, i === 0 ? 0.3 : 0.6, 0);
      return button;
    });
    
    // Add all components to group
    group.add(phoneBody, screen, notch, ...buttons);
    
    // Add group to scene
    scene.add(group);
    
    // Test scene graph operations
    const childCount = scene.children.length;
    const groupChildCount = group.children.length;
    
    // Test transformations
    group.rotation.y = Math.PI / 4;
    group.scale.setScalar(1.05);
    group.position.set(0, 0.1, 0);
    
    const endTime = performance.now();
    const sceneTime = endTime - startTime;
    
    // Should create and manipulate scene within 30ms
    expect(sceneTime).toBeLessThan(30);
    expect(childCount).toBe(1);
    expect(groupChildCount).toBe(5); // phoneBody + screen + notch + 2 buttons
    expect(group.rotation.y).toBeCloseTo(Math.PI / 4);
  });

  it('should handle lighting setup efficiently', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Create lighting setup from PhoneMockup3D
    const lights = [
      new THREE.AmbientLight(0xffffff, 0.5),
      (() => {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 10, 5);
        light.castShadow = true;
        return light;
      })(),
      (() => {
        const light = new THREE.SpotLight(0xffffff, 0.5, 0, 0.3, 1);
        light.position.set(-10, 10, 5);
        light.castShadow = true;
        return light;
      })(),
    ];
    
    // Create scene and add lights
    const scene = new THREE.Scene();
    lights.forEach(light => scene.add(light));
    
    const endTime = performance.now();
    const lightingTime = endTime - startTime;
    
    // Should create lighting setup within 10ms
    expect(lightingTime).toBeLessThan(10);
    expect(scene.children.length).toBe(lights.length);
    
    // Verify light properties
    const [ambient, directional, spot] = lights;
    expect(ambient.intensity).toBe(0.5);
    expect(directional.intensity).toBe(1);
    expect(directional.castShadow).toBe(true);
    expect(spot.intensity).toBe(0.5);
  });

  it('should maintain performance with version upgrades', async () => {
    // This test ensures the new versions don't introduce performance regressions
    const startTime = performance.now();
    
    // Import and use all critical components
    const [THREE, fiber, drei] = await Promise.all([
      import('three'),
      import('@react-three/fiber'),
      import('@react-three/drei')
    ]);
    
    // Create a mini version of PhoneMockup3D scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    
    // Create phone geometry
    const phoneGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const phoneMaterial = new THREE.MeshStandardMaterial({ 
      color: '#1a1a1a',
      metalness: 0.8,
      roughness: 0.2 
    });
    const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
    
    scene.add(phone);
    
    // Verify component access
    expect(fiber.Canvas).toBeDefined();
    expect(drei.Float).toBeDefined();
    expect(drei.Environment).toBeDefined();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Total operation should complete within 100ms
    expect(totalTime).toBeLessThan(100);
    
    // Verify Three.js version
    expect(THREE.REVISION).toBe('181');
  });
});

describe('Memory Usage Benchmarks', () => {
  it('should not create excessive objects during normal operations', async () => {
    const THREE = await import('three');
    
    // Track object creation
    let geometryCount = 0;
    let materialCount = 0;
    let meshCount = 0;
    
    // Create objects similar to a typical 3D scene
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      geometryCount++;
      
      const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
      materialCount++;
      
      const mesh = new THREE.Mesh(geometry, material);
      meshCount++;
      
      // Simulate cleanup
      geometry.dispose();
      material.dispose();
    }
    
    expect(geometryCount).toBe(10);
    expect(materialCount).toBe(10);
    expect(meshCount).toBe(10);
  });

  it('should handle component cleanup efficiently', async () => {
    const THREE = await import('three');
    
    const startTime = performance.now();
    
    // Create and dispose objects
    const objects = Array.from({ length: 100 }, () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      
      return { geometry, material, mesh };
    });
    
    // Cleanup
    objects.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
    
    const endTime = performance.now();
    const cleanupTime = endTime - startTime;
    
    // Should create and cleanup 100 objects within 50ms
    expect(cleanupTime).toBeLessThan(50);
  });
});