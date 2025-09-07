'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface GradientMeshProps {
  className?: string;
  interactive?: boolean;
  intensity?: number;
}

const GradientMesh: React.FC<GradientMeshProps> = ({ 
  className = '', 
  interactive = true,
  intensity = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [isLowPerf, setIsLowPerf] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS');
      setIsLowPerf(true);
      return;
    }

    // Vertex shader with wave distortion
    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      uniform float u_time;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        vec2 pos = a_position;
        
        // Add subtle wave effect
        pos.x += sin(a_position.y * 2.0 + u_time * 0.5) * 0.02;
        pos.y += cos(a_position.x * 2.0 + u_time * 0.3) * 0.02;
        
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    // Fragment shader with animated gradient
    const fragmentSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_intensity;
      varying vec2 v_uv;
      
      // Modern color palette
      vec3 colorA = vec3(0.525, 0.306, 0.969); // Purple
      vec3 colorB = vec3(0.969, 0.306, 0.525); // Pink
      vec3 colorC = vec3(0.306, 0.525, 0.969); // Blue
      vec3 colorD = vec3(0.969, 0.525, 0.306); // Orange accent
      
      float noise(vec2 p) {
        return sin(p.x * 10.0) * sin(p.y * 10.0);
      }
      
      void main() {
        vec2 uv = v_uv;
        
        // Create flowing gradient
        float t = u_time * 0.2;
        
        // Interactive mouse influence
        vec2 mouseInfluence = (u_mouse - 0.5) * 0.3 * u_intensity;
        uv += mouseInfluence * (1.0 - length(uv - u_mouse));
        
        // Multi-layer noise for organic movement
        float n1 = noise(uv * 3.0 + vec2(t * 0.5, t * 0.3));
        float n2 = noise(uv * 5.0 - vec2(t * 0.3, t * 0.5));
        float n3 = noise(uv * 7.0 + vec2(t * 0.2, -t * 0.4));
        
        // Blend noise layers
        float n = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);
        
        // Create gradient stops
        float gradientAngle = atan(uv.y - 0.5, uv.x - 0.5) + t * 0.1;
        float gradientRadius = length(uv - vec2(0.5)) * 2.0;
        
        // Mix colors based on position and noise
        vec3 color1 = mix(colorA, colorB, sin(gradientAngle * 2.0 + n) * 0.5 + 0.5);
        vec3 color2 = mix(colorC, colorD, cos(gradientAngle * 3.0 - n) * 0.5 + 0.5);
        vec3 finalColor = mix(color1, color2, gradientRadius + n * 0.2);
        
        // Add subtle glow effect
        float glow = 1.0 - gradientRadius * 0.5;
        finalColor += vec3(0.1, 0.05, 0.15) * glow * u_intensity;
        
        // Apply smooth brightness variation
        finalColor *= 0.7 + 0.3 * sin(t + gradientRadius * 3.0);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create and compile shaders
    const createShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    };

    const vertexShader = createShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(fragmentSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      setIsLowPerf(true);
      return;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      setIsLowPerf(true);
      return;
    }
    
    gl.useProgram(program);

    // Set up geometry (full screen quad)
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');

    // Handle resize
    const handleResize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height
      };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Animation loop with performance monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;
    
    const render = (time: number) => {
      // Calculate FPS
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Reduce quality if performance is poor
        if (fps < 30 && !isLowPerf) {
          setIsLowPerf(true);
          return;
        }
      }
      
      const width = canvas.width;
      const height = canvas.height;
      
      gl.uniform1f(timeLocation, time * 0.001);
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(intensityLocation, intensity);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationIdRef.current = requestAnimationFrame(render);
    };

    render(0);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, [interactive, intensity, isLowPerf]);

  // CSS fallback for low performance devices
  if (isLowPerf) {
    return (
      <div className={`${className} gradient-mesh-fallback`}>
        <style jsx>{`
          .gradient-mesh-fallback {
            background: 
              radial-gradient(at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
              radial-gradient(at 40% 40%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(at 60% 60%, rgba(251, 113, 133, 0.3) 0%, transparent 50%);
            animation: gradientShift 20s ease infinite;
          }
          
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
              background-size: 200% 200%;
            }
            50% {
              background-position: 100% 50%;
              background-size: 200% 200%;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
};

export default GradientMesh;