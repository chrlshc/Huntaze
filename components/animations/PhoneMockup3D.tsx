'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, ContactShadows, Html, RoundedBox } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { TextureLoader } from 'three';

interface PhoneScreenProps {
  currentApp: number;
  texture?: THREE.Texture;
}

function PhoneScreen({ currentApp, texture }: PhoneScreenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // App screen colors as fallback
  const appColors = [
    '#00AFF0', // OnlyFans blue
    '#E4405F', // Instagram gradient start
    '#000000', // TikTok black
  ];

  return (
    <mesh ref={meshRef} position={[0, 0, 0.051]}>
      <planeGeometry args={[0.9, 1.8]} />
      <meshBasicMaterial color={appColors[currentApp]}>
        {texture && <primitive attach="map" object={texture} />}
      </meshBasicMaterial>
    </mesh>
  );
}

interface IPhoneModelProps {
  scrollProgress: number;
}

function IPhoneModel({ scrollProgress }: IPhoneModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [currentApp, setCurrentApp] = useState(0);
  
  // Load placeholder textures (we'll create actual mockup images later)
  const textures = [
    '/images/onlyfans-mockup.jpg',
    '/images/instagram-mockup.jpg', 
    '/images/tiktok-mockup.jpg'
  ];
  
  // Rotation based on scroll
  useFrame((state) => {
    if (groupRef.current) {
      // Base rotation
      groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
      
      // Hover effect
      const targetScale = hovered ? 1.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Change app based on scroll position
  useEffect(() => {
    const appIndex = Math.floor(scrollProgress * 3) % 3;
    setCurrentApp(appIndex);
  }, [scrollProgress]);

  return (
    <Float
      speed={4}
      rotationIntensity={0.2}
      floatIntensity={0.3}
    >
      <group 
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Phone body */}
        <RoundedBox args={[1, 2, 0.1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial 
            color="#1a1a1a"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={0.5}
          />
        </RoundedBox>
        
        {/* Screen bezel */}
        <RoundedBox args={[0.95, 1.85, 0.01]} radius={0.08} position={[0, 0, 0.051]}>
          <meshStandardMaterial color="#000000" />
        </RoundedBox>
        
        {/* Screen */}
        <PhoneScreen currentApp={currentApp} />
        
        {/* Camera notch */}
        <mesh position={[0, 0.85, 0.055]}>
          <boxGeometry args={[0.3, 0.08, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Side buttons */}
        <mesh position={[-0.52, 0.3, 0]}>
          <boxGeometry args={[0.02, 0.2, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} />
        </mesh>
        <mesh position={[-0.52, 0.6, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} />
        </mesh>
        
        {/* Floating UI annotations */}
        <Html
          position={[1.5, 0.5, 0]}
          distanceFactor={1}
          style={{ userSelect: 'none' }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="phone-annotation"
          >
            <div className="glass-card p-3 min-w-[200px]">
              <div className="text-white font-bold text-sm">
                {currentApp === 0 && 'OnlyFans Analytics'}
                {currentApp === 1 && 'Instagram DM AI'}
                {currentApp === 2 && 'TikTok Creator Hub'}
              </div>
              <div className="text-gray-300 text-xs mt-1">
                {currentApp === 0 && '+312% revenus'}
                {currentApp === 1 && '500+ messages/heure'}
                {currentApp === 2 && 'Engagement temps réel'}
              </div>
            </div>
          </motion.div>
        </Html>
      </group>
    </Float>
  );
}

interface PhoneMockup3DProps {
  className?: string;
}

const PhoneMockup3D: React.FC<PhoneMockup3DProps> = ({ className = '' }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;
      
      // Calculate progress when element is in view
      const viewportHeight = window.innerHeight;
      const startScroll = elementTop - viewportHeight;
      const endScroll = elementTop + elementHeight;
      
      const progress = (scrolled - startScroll) / (endScroll - startScroll);
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const platforms = [
    { name: 'OnlyFans', color: '#00AFF0', icon: '💎', metric: '312% ↑' },
    { name: 'Instagram', color: '#E4405F', icon: '📸', metric: '500 msg/h' },
    { name: 'TikTok', color: '#000000', icon: '🎵', metric: '95% rétention' }
  ];
  
  const currentPlatform = Math.floor(scrollProgress * 3) % 3;

  return (
    <section ref={containerRef} className={`relative min-h-[150vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Une interface,
                <br />
                tous vos réseaux
              </span>
            </h2>
            
            <p className="text-xl text-gray-300">
              Gérez OnlyFans, Instagram et TikTok en un seul endroit. 
              L'IA s'adapte automatiquement à chaque plateforme.
            </p>

            {/* Platform selector */}
            <div className="flex flex-wrap gap-3">
              {platforms.map((platform, index) => (
                <motion.button
                  key={platform.name}
                  className={`
                    px-4 py-3 rounded-xl border transition-all flex items-center gap-3
                    ${currentPlatform === index
                      ? 'bg-white/10 border-white/30 shadow-lg'
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{platform.name}</div>
                    <div className="text-xs text-gray-400">{platform.metric}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Features */}
            <motion.div 
              className="space-y-3 mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, staggerChildren: 0.1 }}
            >
              <AnimatePresence mode="wait">
                {currentPlatform === 0 && (
                  <motion.div
                    key="onlyfans-features"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {['PPV automatisé', 'Tips tracking', 'Mass messages', 'Analytics avancés'].map((feature) => (
                      <FeatureItem key={feature} text={feature} />
                    ))}
                  </motion.div>
                )}
                {currentPlatform === 1 && (
                  <motion.div
                    key="instagram-features"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {['DM automation', 'Story replies', 'Hashtag AI', 'Growth tracking'].map((feature) => (
                      <FeatureItem key={feature} text={feature} />
                    ))}
                  </motion.div>
                )}
                {currentPlatform === 2 && (
                  <motion.div
                    key="tiktok-features"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {['Trend detection', 'Comment AI', 'Live moderation', 'Viral analytics'].map((feature) => (
                      <FeatureItem key={feature} text={feature} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* 3D Phone */}
          <div className="relative h-[600px] lg:h-[700px]">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 45 }}
              gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: 'high-performance'
              }}
            >
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              
              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <spotLight 
                position={[-10, 10, 5]} 
                angle={0.3}
                penumbra={1}
                intensity={0.5}
                castShadow
              />
              
              <Suspense fallback={null}>
                <IPhoneModel scrollProgress={scrollProgress} />
              </Suspense>
              
              <ContactShadows
                position={[0, -2, 0]}
                opacity={0.5}
                scale={10}
                blur={2.5}
                far={4}
              />
              
              <Environment preset="city" />
            </Canvas>
            
            {/* Gradient glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
                  'radial-gradient(circle at 60% 40%, rgba(236,72,153,0.15) 0%, transparent 70%)',
                  'radial-gradient(circle at 40% 60%, rgba(59,130,246,0.15) 0%, transparent 70%)',
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-400">Scrollez pour découvrir</p>
          <motion.div
            className="w-6 h-10 border-2 border-white/20 rounded-full p-1"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1 h-2 bg-white/50 rounded-full mx-auto" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// Feature item component
const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <motion.div
    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm"
    whileHover={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
  >
    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
    <span className="text-white">{text}</span>
  </motion.div>
);

export default PhoneMockup3D;