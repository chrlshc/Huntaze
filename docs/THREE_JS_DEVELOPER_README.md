# Three.js Development Guide

## Quick Start

### Available Commands

```bash
# Test Three.js functionality
npm run test:three              # Run all Three.js tests
npm run test:three:unit         # Unit tests only
npm run test:three:performance  # Performance benchmarks

# Validation and Health Checks
npm run three:health            # Complete health check
npm run three:validate          # Validate peer dependencies
npm run three:docs              # Show documentation links

# Development Tools
npm run three:upgrade           # Upgrade dependencies (use with caution)
npm run three:test              # Test component compatibility
```

### Current Versions (React 19 Compatible)

- **three**: ^0.181.0
- **@react-three/fiber**: ^9.4.0  
- **@react-three/drei**: ^10.7.6

## Development Workflow

### 1. Creating New 3D Components

```jsx
import { Canvas } from '@react-three/fiber'
import { Float, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'

function My3DComponent() {
  return (
    <div className="h-screen">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="hotpink" />
            </mesh>
          </Float>
          <ContactShadows 
            position={[0, -1.4, 0]} 
            opacity={0.75} 
            scale={10} 
            blur={2.5} 
            far={4} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### 2. Testing 3D Components

```jsx
// tests/unit/three-js/my-component.test.tsx
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import My3DComponent from '../components/My3DComponent'

// Mock WebGL context for testing
const mockCanvas = {
  getContext: vi.fn(() => ({
    // Mock WebGL methods
  }))
};

global.document.createElement = vi.fn(() => mockCanvas);

describe('My3DComponent', () => {
  it('should render without errors', () => {
    render(
      <Canvas>
        <My3DComponent />
      </Canvas>
    );
  });
});
```

### 3. Performance Optimization

```jsx
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function OptimizedScene() {
  const meshRef = useRef();
  
  // Memoize expensive calculations
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: 'hotpink' 
  }), []);

  // Optimize animation loop
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
```

## Best Practices

### 1. Component Structure

```jsx
// ✅ Good: Separate concerns
function Scene() {
  return (
    <Canvas>
      <Lighting />
      <Models />
      <Effects />
      <Controls />
    </Canvas>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  );
}
```

### 2. Memory Management

```jsx
import { useEffect } from 'react'

function CleanupExample() {
  useEffect(() => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    
    return () => {
      // Always cleanup Three.js objects
      geometry.dispose();
      material.dispose();
    };
  }, []);
}
```

### 3. Error Handling

```jsx
import { ErrorBoundary } from 'react-error-boundary'

function ThreeErrorFallback({ error }) {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-100">
      <div className="text-center">
        <h3>3D Scene Error</h3>
        <p className="text-sm text-gray-600">
          {error.message || 'Failed to load 3D content'}
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ThreeErrorFallback}>
      <Canvas>
        <Scene />
      </Canvas>
    </ErrorBoundary>
  );
}
```

### 4. SSR Considerations

```jsx
import dynamic from 'next/dynamic'

// Disable SSR for 3D components
const ThreeScene = dynamic(() => import('./ThreeScene'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 animate-pulse flex items-center justify-center">
      <span>Loading 3D scene...</span>
    </div>
  )
});

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <ThreeScene />
    </div>
  );
}
```

## Common Patterns

### 1. Responsive 3D Scenes

```jsx
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

function ResponsiveScene() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl]);

  return null;
}
```

### 2. Loading States

```jsx
import { Suspense } from 'react'
import { Html, useProgress } from '@react-three/drei'

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white">
        Loading: {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function Scene() {
  return (
    <Canvas>
      <Suspense fallback={<Loader />}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
```

### 3. Animation Patterns

```jsx
import { useSpring, animated } from '@react-spring/three'
import { useFrame } from '@react-three/fiber'

function AnimatedMesh() {
  const meshRef = useRef();
  
  // Spring animation
  const { scale } = useSpring({
    scale: hovered ? 1.2 : 1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Frame-based animation
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta;
  });

  return (
    <animated.mesh ref={meshRef} scale={scale}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </animated.mesh>
  );
}
```

## Debugging

### Development Tools

```jsx
// Add performance monitoring in development
import { Perf } from 'r3f-perf'

function Scene() {
  return (
    <Canvas>
      {process.env.NODE_ENV === 'development' && <Perf />}
      <YourScene />
    </Canvas>
  );
}
```

### Common Debug Commands

```bash
# Check Three.js installation
node -e "console.log(require('three').REVISION)"

# Validate React compatibility
npm run test:three:unit

# Performance check
npm run test:three:performance

# Full health check
npm run three:health
```

## Resources

### Documentation
- 📖 [Upgrade Guide](./REACT_THREE_DEPS_UPGRADE_GUIDE.md)
- 🔧 [Troubleshooting Guide](./THREE_JS_TROUBLESHOOTING_GUIDE.md)
- 📋 [API Changes](./THREE_JS_API_CHANGES.md)

### External Links
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei Examples](https://github.com/pmndrs/drei)

### Community
- [Three.js Discord](https://discord.gg/56GBJwAnUS)
- [React Three Fiber Discord](https://discord.gg/ZZjjNvJ)
- [Three.js Forum](https://discourse.threejs.org/)

---

**Status**: Production Ready ✅  
**Last Updated**: November 3, 2025  
**React Version**: 19.2.0  
**Next.js Version**: 15.5.6