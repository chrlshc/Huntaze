#!/usr/bin/env node

/**
 * Drei Components Usage Analysis
 * 
 * This script analyzes which @react-three/drei components are used
 * in the codebase to assess upgrade compatibility.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing @react-three/drei Component Usage\n');

// Common drei components to look for
const dreiComponents = [
  'Float', 'PerspectiveCamera', 'Environment', 'ContactShadows', 
  'Html', 'RoundedBox', 'OrbitControls', 'Text', 'Box', 'Sphere',
  'Plane', 'useGLTF', 'useTexture', 'Center', 'Bounds', 'BakeShadows',
  'softShadows', 'Stars', 'Sky', 'Cloud', 'Effects', 'EffectComposer',
  'Bloom', 'DepthOfField', 'Noise', 'Vignette', 'SSAO', 'Outline',
  'Selection', 'Select', 'Highlight', 'useHelper', 'useAnimations',
  'useFBX', 'useProgress', 'Loader', 'Preload', 'Backdrop', 'Stage',
  'Lightformer', 'AccumulativeShadows', 'RandomizedLight', 'SpotLight',
  'PointLight', 'DirectionalLight', 'RectAreaLight', 'useMatcapTexture',
  'useNormalTexture', 'MeshReflectorMaterial', 'MeshWobbleMaterial',
  'MeshDistortMaterial', 'shaderMaterial', 'Trail', 'Line', 'QuadraticBezierLine',
  'CubicBezierLine', 'CatmullRomLine', 'Decal', 'Svg', 'AsciiRenderer',
  'Wireframe', 'Edges', 'FaceControls', 'CameraControls', 'MapControls',
  'TrackballControls', 'ArcballControls', 'FlyControls', 'DeviceOrientationControls',
  'PointerLockControls', 'FirstPersonControls', 'TransformControls', 'PivotControls',
  'DragControls', 'useCursor', 'useIntersect', 'useBounds', 'useScroll',
  'useKeyboardControls', 'KeyboardControls', 'Gizmo', 'GizmoHelper',
  'GizmoViewport', 'GizmoViewcube', 'Grid', 'PolarGrid', 'Facemesh',
  'Detailed', 'Instances', 'Merged', 'Points', 'PointMaterial',
  'Segments', 'SegmentObject', 'Billboard', 'Text3D', 'Outlines',
  'Mask', 'useMask', 'MeshPortalMaterial', 'CameraShake', 'Fisheye',
  'RenderTexture', 'RenderCubeTexture', 'Caustics', 'ScreenSpace',
  'Sampler', 'ComputedAttribute', 'Clone', 'useVideoTexture', 'VideoTexture',
  'Reflector', 'useReflector', 'Mirror', 'Chrome', 'Fresnel', 'MeshTransmissionMaterial',
  'DiscardMaterial', 'ShadowMaterial', 'SpriteMaterial', 'PointsMaterial',
  'MeshBasicMaterial', 'MeshStandardMaterial', 'MeshPhysicalMaterial',
  'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshToonMaterial',
  'MeshNormalMaterial', 'MeshMatcapMaterial', 'MeshDepthMaterial',
  'MeshDistanceMaterial', 'LineBasicMaterial', 'LineDashedMaterial',
  'Sparkles', 'Stars', 'Cloud', 'Clouds', 'Sky', 'Rainbow', 'Lightbeam'
];

function findDreiUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const usedComponents = [];
    
    // Check for drei imports
    const importMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]@react-three\/drei['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const components = match.match(/{([^}]+)}/)[1]
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0);
        usedComponents.push(...components);
      });
    }
    
    // Also check for direct usage in JSX
    dreiComponents.forEach(component => {
      const regex = new RegExp(`<${component}[\\s>]`, 'g');
      if (regex.test(content)) {
        if (!usedComponents.includes(component)) {
          usedComponents.push(component);
        }
      }
    });
    
    return usedComponents;
  } catch (error) {
    return [];
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        results.push(...scanDirectory(filePath, extensions));
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        const usedComponents = findDreiUsage(filePath);
        if (usedComponents.length > 0) {
          results.push({
            file: path.relative(process.cwd(), filePath),
            components: usedComponents
          });
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

// Scan the project
const usage = scanDirectory(process.cwd());

console.log('📋 @react-three/drei Components Usage Report:');
console.log('='.repeat(50));

if (usage.length === 0) {
  console.log('✅ No @react-three/drei components found in use');
} else {
  const allComponents = new Set();
  
  usage.forEach(({ file, components }) => {
    console.log(`\n📄 ${file}:`);
    components.forEach(component => {
      console.log(`  • ${component}`);
      allComponents.add(component);
    });
  });
  
  console.log('\n📊 Summary:');
  console.log(`Files using drei: ${usage.length}`);
  console.log(`Unique components: ${allComponents.size}`);
  
  console.log('\n🔧 Components in use:');
  Array.from(allComponents).sort().forEach(component => {
    console.log(`  • ${component}`);
  });
  
  console.log('\n⚠️  Upgrade Considerations:');
  console.log('• Test all listed components after upgrading to drei v10.x');
  console.log('• Check for API changes in the drei changelog');
  console.log('• Verify component props and behavior remain consistent');
  console.log('• Pay special attention to major version breaking changes');
}

console.log('\n🎯 Next Steps:');
console.log('• Review drei v10.x changelog for breaking changes');
console.log('• Create test cases for each component in use');
console.log('• Plan incremental testing during upgrade');
console.log('• Document any required code changes');