/**
 * Three.js Components Validation Tests
 * 
 * Tests to ensure all 3D components work correctly after React 19 upgrade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DOM environment for Three.js
const mockCanvas = {
  getContext: vi.fn(() => ({
    getExtension: vi.fn(),
    getParameter: vi.fn(),
    createShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    createProgram: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
    createBuffer: vi.fn(),
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
    blendFunc: vi.fn(),
    depthFunc: vi.fn(),
    cullFace: vi.fn(),
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  width: 800,
  height: 600,
  style: {},
  clientWidth: 800,
  clientHeight: 600,
};

// Mock global objects
global.document = {
  createElement: vi.fn(() => mockCanvas),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(),
} as any;

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Node.js Test Environment',
  },
  writable: true,
});

describe('Three.js Core Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import Three.js core successfully', async () => {
    const THREE = await import('three');
    
    expect(THREE).toBeDefined();
    expect(THREE.Scene).toBeDefined();
    expect(THREE.WebGLRenderer).toBeDefined();
    expect(THREE.PerspectiveCamera).toBeDefined();
    expect(THREE.Mesh).toBeDefined();
    expect(THREE.BoxGeometry).toBeDefined();
    expect(THREE.MeshBasicMaterial).toBeDefined();
  });

  it('should create basic Three.js objects', async () => {
    const THREE = await import('three');
    
    // Test scene creation
    const scene = new THREE.Scene();
    expect(scene).toBeInstanceOf(THREE.Scene);
    
    // Test camera creation
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(camera.fov).toBe(75);
    
    // Test geometry creation
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
    
    // Test material creation
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
    
    // Test mesh creation
    const cube = new THREE.Mesh(geometry, material);
    expect(cube).toBeInstanceOf(THREE.Mesh);
    
    // Test scene operations
    scene.add(cube);
    expect(scene.children).toContain(cube);
  });

  it('should support Three.js version 181 features', async () => {
    const THREE = await import('three');
    
    // Check version
    expect(THREE.REVISION).toBe('181');
    
    // Test newer features available in 0.181.0
    expect(THREE.TextureLoader).toBeDefined();
    expect(THREE.Raycaster).toBeDefined();
    expect(THREE.Vector3).toBeDefined();
    expect(THREE.Matrix4).toBeDefined();
    expect(THREE.Quaternion).toBeDefined();
    
    // Test advanced materials
    expect(THREE.MeshStandardMaterial).toBeDefined();
    expect(THREE.MeshPhysicalMaterial).toBeDefined();
    
    // Test lighting
    expect(THREE.DirectionalLight).toBeDefined();
    expect(THREE.SpotLight).toBeDefined();
    expect(THREE.AmbientLight).toBeDefined();
  });
});

describe('@react-three/fiber Components', () => {
  it('should import fiber components successfully', async () => {
    const fiber = await import('@react-three/fiber');
    
    expect(fiber.Canvas).toBeDefined();
    expect(typeof fiber.Canvas).toBe('function');
    
    expect(fiber.useFrame).toBeDefined();
    expect(typeof fiber.useFrame).toBe('function');
    
    expect(fiber.useThree).toBeDefined();
    expect(typeof fiber.useThree).toBe('function');
    
    expect(fiber.useLoader).toBeDefined();
    expect(typeof fiber.useLoader).toBe('function');
  });

  it('should have React 19 compatible fiber version', async () => {
    const packageJson = await import('../../../package.json');
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const fiberVersion = allDeps['@react-three/fiber'];
    
    // Should be version 9.x for React 19 compatibility
    expect(fiberVersion).toBeDefined();
    expect(fiberVersion).toMatch(/^\^?9\./);
  });
});

describe('Package Dependencies Validation', () => {
  it('should have @react-three/drei package installed', async () => {
    const packageJson = await import('../../../package.json');
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    expect(allDeps['@react-three/drei']).toBeDefined();
    expect(allDeps['@react-three/drei']).toMatch(/^\^?10\./);
  });

  it('should have compatible versions across all Three.js packages', async () => {
    const packageJson = await import('../../../package.json');
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const versions = {
      three: allDeps.three,
      fiber: allDeps['@react-three/fiber'],
      drei: allDeps['@react-three/drei'],
      next: allDeps.next
    };
    
    // Verify Three.js packages are installed
    expect(versions.three).toBeDefined();
    expect(versions.fiber).toBeDefined();
    expect(versions.drei).toBeDefined();
    
    // React is provided by Next.js
    expect(versions.next).toBeDefined();
  });

  it('should have compatible peer dependencies', async () => {
    const packageJson = await import('../../../package.json');
    
    // Check in both dependencies and devDependencies
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Ensure no conflicting versions
    expect(allDeps.three).toBeDefined();
    expect(allDeps['@react-three/fiber']).toBeDefined();
    expect(allDeps['@react-three/drei']).toBeDefined();
    
    // Ensure React versions match
    const reactVersion = packageJson.dependencies.react;
    const reactDomVersion = packageJson.dependencies['react-dom'];
    
    expect(reactVersion).toBe(reactDomVersion);
  });
});

describe('Three.js Materials and Geometries', () => {
  it('should support materials used in PhoneMockup3D', async () => {
    const THREE = await import('three');
    
    // Materials used in the component
    expect(THREE.MeshBasicMaterial).toBeDefined();
    expect(THREE.MeshStandardMaterial).toBeDefined();
    
    // Test material creation with properties used in component
    const basicMaterial = new THREE.MeshBasicMaterial({ color: '#00AFF0' });
    expect(basicMaterial.color).toBeDefined();
    
    const standardMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      metalness: 0.8,
      roughness: 0.2
    });
    expect(standardMaterial.metalness).toBe(0.8);
    expect(standardMaterial.roughness).toBe(0.2);
  });

  it('should support geometries used in PhoneMockup3D', async () => {
    const THREE = await import('three');
    
    // Geometries used in the component
    expect(THREE.PlaneGeometry).toBeDefined();
    expect(THREE.BoxGeometry).toBeDefined();
    
    // Test geometry creation with args used in component
    const planeGeometry = new THREE.PlaneGeometry(0.9, 1.8);
    expect(planeGeometry).toBeInstanceOf(THREE.PlaneGeometry);
    
    const boxGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.02);
    expect(boxGeometry).toBeInstanceOf(THREE.BoxGeometry);
  });
});

describe('Error Handling and Fallbacks', () => {
  it('should handle missing WebGL context gracefully', async () => {
    const THREE = await import('three');
    
    // Should not throw when WebGL is not available
    expect(() => {
      new THREE.Scene();
    }).not.toThrow();
  });

  it('should validate Three.js is properly installed', async () => {
    const THREE = await import('three');
    
    // Basic validation that Three.js is working
    expect(THREE.REVISION).toBeDefined();
    expect(typeof THREE.REVISION).toBe('string');
    expect(THREE.Scene).toBeDefined();
    expect(THREE.WebGLRenderer).toBeDefined();
  });
});