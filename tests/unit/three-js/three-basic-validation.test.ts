/**
 * Basic Three.js Validation Tests
 * 
 * Simple tests to ensure Three.js packages work after React 19 upgrade
 */

import { describe, it, expect } from 'vitest';

describe('Three.js Basic Validation', () => {
  it('should import Three.js core with correct version', async () => {
    const THREE = await import('three');
    
    expect(THREE).toBeDefined();
    expect(THREE.REVISION).toBe('181');
    expect(THREE.Scene).toBeDefined();
    expect(THREE.WebGLRenderer).toBeDefined();
    expect(THREE.PerspectiveCamera).toBeDefined();
  });

  it('should import @react-three/fiber successfully', async () => {
    const fiber = await import('@react-three/fiber');
    
    expect(fiber).toBeDefined();
    expect(fiber.Canvas).toBeDefined();
    expect(fiber.useFrame).toBeDefined();
    expect(fiber.useThree).toBeDefined();
    expect(fiber.useLoader).toBeDefined();
  });

  it('should import @react-three/drei successfully', async () => {
    const drei = await import('@react-three/drei');
    
    expect(drei).toBeDefined();
    
    // Check critical components exist
    const criticalComponents = [
      'Float', 'PerspectiveCamera', 'Environment', 
      'ContactShadows', 'Html', 'RoundedBox', 'Sparkles'
    ];
    
    criticalComponents.forEach(component => {
      expect(drei[component]).toBeDefined();
    });
  });

  it('should have correct package versions', async () => {
    const packageJson = await import('../../../package.json');
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Verify Three.js packages are installed
    expect(allDeps.three).toBeDefined();
    expect(allDeps['@react-three/fiber']).toBeDefined();
    expect(allDeps['@react-three/drei']).toBeDefined();
    
    // React is provided by Next.js
    expect(allDeps.next).toBeDefined();
  });

  it('should create basic Three.js objects', async () => {
    const THREE = await import('three');
    
    // Test basic object creation
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    
    scene.add(cube);
    
    expect(scene.children).toContain(cube);
    expect(cube.geometry).toBe(geometry);
    expect(cube.material).toBe(material);
  });

  it('should support materials used in PhoneMockup3D', async () => {
    const THREE = await import('three');
    
    // Test MeshStandardMaterial with properties from PhoneMockup3D
    const material = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 0.5
    });
    
    expect(material.metalness).toBe(0.8);
    expect(material.roughness).toBe(0.2);
    expect(material.color.getHexString()).toBe('1a1a1a');
  });

  it('should support geometries used in PhoneMockup3D', async () => {
    const THREE = await import('three');
    
    // Test geometries from PhoneMockup3D
    const planeGeometry = new THREE.PlaneGeometry(0.9, 1.8);
    const boxGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    
    expect(planeGeometry.parameters.width).toBe(0.9);
    expect(planeGeometry.parameters.height).toBe(1.8);
    expect(boxGeometry.parameters.width).toBe(1);
    expect(boxGeometry.parameters.height).toBe(2);
    expect(boxGeometry.parameters.depth).toBe(0.1);
  });

  it('should support lighting used in PhoneMockup3D', async () => {
    const THREE = await import('three');
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const spotLight = new THREE.SpotLight(0xffffff, 0.5, 0, 0.3, 1);
    
    expect(ambientLight.intensity).toBe(0.5);
    expect(directionalLight.intensity).toBe(1);
    expect(spotLight.intensity).toBe(0.5);
    expect(spotLight.angle).toBe(0.3);
  });

  it('should support Vector3 operations used in animations', async () => {
    const THREE = await import('three');
    
    const vector1 = new THREE.Vector3(1, 1, 1);
    const vector2 = new THREE.Vector3(1.05, 1.05, 1.05);
    
    // Test lerp operation used in PhoneMockup3D
    vector1.lerp(vector2, 0.1);
    
    expect(vector1.x).toBeCloseTo(1.005);
    expect(vector1.y).toBeCloseTo(1.005);
    expect(vector1.z).toBeCloseTo(1.005);
  });

  it('should support math operations used in scroll animations', async () => {
    // Test calculations from PhoneMockup3D
    const scrollProgress = 0.5;
    const rotation = scrollProgress * Math.PI * 2;
    const appIndex = Math.floor(scrollProgress * 3) % 3;
    const floatingY = Math.sin(1.0 * 2) * 0.05;
    
    expect(rotation).toBeCloseTo(Math.PI);
    expect(appIndex).toBe(1);
    expect(floatingY).toBeCloseTo(Math.sin(2) * 0.05);
  });
});