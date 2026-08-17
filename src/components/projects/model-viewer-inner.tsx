'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCw, Maximize2, Minimize2, Eye, Box, RefreshCcw } from 'lucide-react';

interface ModelProps {
  url: string;
  format?: 'glb' | 'gltf' | 'stl' | null;
  wireframe: boolean;
}

function GLTFModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => {
            if (m && 'wireframe' in m) m.wireframe = wireframe;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  return <primitive object={scene} />;
}

function STLModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const geometry = useLoader(STLLoader, url);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#3b82f6"
        roughness={0.4}
        metalness={0.2}
        wireframe={wireframe}
      />
    </mesh>
  );
}

function ModelLoader({ url, format, wireframe }: ModelProps) {
  const isSTL =
    format === 'stl' || url.toLowerCase().endsWith('.stl');

  if (isSTL) {
    return <STLModel url={url} wireframe={wireframe} />;
  }

  return <GLTFModel url={url} wireframe={wireframe} />;
}

interface InnerViewerProps {
  modelUrl: string;
  format?: 'glb' | 'gltf' | 'stl' | null;
}

export function ModelViewerInner({ modelUrl, format }: InnerViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const detectedFormat =
    format || (modelUrl.toLowerCase().endsWith('.stl') ? 'stl' : 'glb');

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border bg-gradient-to-b from-muted/30 to-muted/80 ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[480px]'
      }`}
    >
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Badge variant="secondary" className="backdrop-blur-md bg-background/80 font-mono text-xs gap-1 border">
          <Box className="h-3.5 w-3.5 text-primary" />
          <span className="uppercase">{detectedFormat}</span>
        </Badge>
      </div>

      {/* Floating Controls Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md bg-background/85 border shadow-lg">
        <Button
          variant={autoRotate ? 'default' : 'ghost'}
          size="xs"
          onClick={() => setAutoRotate(!autoRotate)}
          className="text-xs gap-1 h-7"
          title="Auto-rotar"
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>Rotación</span>
        </Button>

        <Button
          variant={wireframe ? 'default' : 'ghost'}
          size="xs"
          onClick={() => setWireframe(!wireframe)}
          className="text-xs gap-1 h-7"
          title="Modo Malla"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Malla</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={handleResetCamera}
          className="text-xs gap-1 h-7"
          title="Resetear vista"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Centrar</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleFullscreen}
          className="h-7 w-7"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background/90 backdrop-blur-md border shadow-md">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs font-semibold text-foreground">Cargando modelo 3D...</span>
              </div>
            </Html>
          }
        >
          <Stage
            environment="city"
            intensity={0.6}
            adjustCamera={1.2}
          >
            <Center>
              <ModelLoader
                url={modelUrl}
                format={detectedFormat}
                wireframe={wireframe}
              />
            </Center>
          </Stage>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
