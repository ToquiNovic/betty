'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Center, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ModelThumbnailProps {
  modelUrl: string;
  interactive?: boolean;
  className?: string;
  cameraPosition?: [number, number, number];
}

function ThumbnailModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { invalidate } = useThree();

  useEffect(() => {
    // Traverse materials to ensure clean standard rendering
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    // Request a render when scene is mounted and ready
    invalidate();
  }, [scene, invalidate]);

  return <primitive object={scene} />;
}

export function ProjectModelThumbnailInner({
  modelUrl,
  interactive = false,
  cameraPosition = [3, 2.5, 4.5],
}: ModelThumbnailProps) {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-muted/30 via-background/40 to-muted/60 select-none">
      <Canvas
        frameloop={interactive ? 'always' : 'demand'}
        camera={{ position: cameraPosition, fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        className={`h-full w-full ${interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[8, 12, 6]} intensity={1.4} />
        <directionalLight position={[-8, -6, -4]} intensity={0.4} />

        <Suspense fallback={null}>
          <Center top={false}>
            <ThumbnailModel url={modelUrl} />
          </Center>
        </Suspense>

        {interactive && (
          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={1.0}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
          />
        )}
      </Canvas>
    </div>
  );
}
