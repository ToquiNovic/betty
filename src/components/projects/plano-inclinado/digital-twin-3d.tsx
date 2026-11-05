'use client';

import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RotateCw,
  RefreshCcw,
  Maximize2,
  Minimize2,
  Box,
  Eye,
  Activity,
  Wifi,
  Usb,
} from 'lucide-react';

export interface DigitalTwin3DProps {
  plankAngle?: number;
  currentAngle?: number;
  servoAngle?: number;
  targetAngle?: number;
  sensorCubePresent?: boolean;
  slipAngle?: number;
  isConnected?: boolean;
  connectionSource?: 'usb' | 'cloud' | 'none';
  onToggle2D?: () => void;
}

function InclinadoModel3D({
  plankAngle = 0,
  slipAngle = 0,
  sensorCubePresent = true,
  wireframe = false,
}: {
  plankAngle: number;
  slipAngle: number;
  sensorCubePresent: boolean;
  wireframe: boolean;
}) {
  const { scene } = useGLTF('/model3d/plano_inclinado.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const rampRef = useRef<THREE.Object3D | null>(null);
  const cubeRef = useRef<THREE.Object3D | null>(null);

  // Store initial transforms of parts
  const initialTransforms = useRef<{
    rampRot: THREE.Euler;
    cubePos: THREE.Vector3;
    cubeRot: THREE.Euler;
  } | null>(null);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => {
            if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = wireframe;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).wireframe = wireframe;
        }
      }

      // Identify ramp and cube by node names from glb
      if (child.name === 'Cube.014') {
        rampRef.current = child;
      }
      if (child.name === 'Cube.016') {
        cubeRef.current = child;
      }
    });

    if (rampRef.current && cubeRef.current && !initialTransforms.current) {
      initialTransforms.current = {
        rampRot: rampRef.current.rotation.clone(),
        cubePos: cubeRef.current.position.clone(),
        cubeRot: cubeRef.current.rotation.clone(),
      };
    }
  }, [clonedScene, wireframe]);

  // Animate dynamic tilt and sliding cube per frame
  useFrame(() => {
    const angleRad = (plankAngle * Math.PI) / 180;

    if (rampRef.current && initialTransforms.current) {
      // Rotate ramp around hinge axis (Z-axis in blender model)
      rampRef.current.rotation.z = initialTransforms.current.rampRot.z + angleRad;
    }

    if (cubeRef.current && initialTransforms.current) {
      cubeRef.current.visible = sensorCubePresent;
      if (sensorCubePresent) {
        // Follow ramp tilt rotation
        cubeRef.current.rotation.z = initialTransforms.current.cubeRot.z + angleRad;

        // If sliding occurs, translate along the ramp
        if (slipAngle > 0) {
          const slideOffset = Math.min(6, (plankAngle - slipAngle) * 0.4);
          cubeRef.current.position.x = initialTransforms.current.cubePos.x - slideOffset;
        } else {
          cubeRef.current.position.copy(initialTransforms.current.cubePos);
        }
      }
    }
  });

  return <primitive object={clonedScene} />;
}

export function DigitalTwin3D({
  plankAngle = 0,
  currentAngle,
  servoAngle = 0,
  targetAngle = 0,
  sensorCubePresent = true,
  slipAngle = 0,
  isConnected = false,
  connectionSource = 'none',
  onToggle2D,
}: DigitalTwin3DProps) {
  const [autoRotate, setAutoRotate] = React.useState(false);
  const [wireframe, setWireframe] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);

  const actualPlankAngle = plankAngle ?? currentAngle ?? 0;

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border bg-gradient-to-b from-card/80 to-muted/40 shadow-sm ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-110 sm:h-125'
      }`}
    >
      {/* Top Left Live Status HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="backdrop-blur-md bg-background/85 font-mono text-xs gap-1.5 border shadow-xs"
        >
          <Activity className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
          <span>θ: {actualPlankAngle.toFixed(1)}°</span>
        </Badge>

        {connectionSource === 'usb' && (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-mono">
            <Usb className="h-3 w-3" />
            <span>USB 115200</span>
          </Badge>
        )}

        {connectionSource === 'cloud' && (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 text-[11px] font-mono">
            <Wifi className="h-3 w-3" />
            <span>Betty Cloud</span>
          </Badge>
        )}

        {connectionSource === 'none' && (
          <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground bg-background/70 backdrop-blur-xs">
            Simulación Local
          </Badge>
        )}

        {slipAngle > 0 && (
          <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 font-mono text-[11px] animate-pulse">
            Resbalamiento detectado
          </Badge>
        )}
      </div>

      {/* Top Right View Switcher */}
      {onToggle2D && (
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="outline"
            size="xs"
            onClick={onToggle2D}
            className="text-xs h-7 gap-1 bg-background/80 backdrop-blur-md shadow-xs border"
          >
            <span>Ver Diagrama 2D</span>
          </Button>
        </div>
      )}

      {/* Floating 3D Controls Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md bg-background/85 border shadow-lg">
        <Button
          variant={autoRotate ? 'default' : 'ghost'}
          size="xs"
          onClick={() => setAutoRotate(!autoRotate)}
          className="text-xs gap-1 h-7"
          title="Auto-rotar cámara"
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>Girar</span>
        </Button>

        <Button
          variant={wireframe ? 'default' : 'ghost'}
          size="xs"
          onClick={() => setWireframe(!wireframe)}
          className="text-xs gap-1 h-7"
          title="Modo Malla de Alambre"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Malla</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={handleResetCamera}
          className="text-xs gap-1 h-7"
          title="Restablecer posición inicial"
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

      {/* Three.js Canvas */}
      <Canvas camera={{ position: [0, 2.5, 6], fov: 45 }} className="h-full w-full cursor-grab active:cursor-grabbing">
        <ambientLight intensity={0.75} />
        <directionalLight position={[10, 15, 8]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />

        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background/90 backdrop-blur-md border shadow-md">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs font-semibold text-foreground">Cargando Gemelo Digital 3D...</span>
              </div>
            </Html>
          }
        >
          <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
            <Center>
              <InclinadoModel3D
                plankAngle={actualPlankAngle}
                slipAngle={slipAngle}
                sensorCubePresent={sensorCubePresent}
                wireframe={wireframe}
              />
            </Center>
          </Stage>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          enableDamping
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={25}
        />
      </Canvas>
    </div>
  );
}
