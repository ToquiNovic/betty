---
title: Integración 3D en Tiempo Real con Three.js
description: Cómo conectar un modelo 3D GLTF/GLB a la telemetría en vivo de Betty PaaS.
---

Esta guía muestra cómo vincular un visor 3D interactivo en la web para que responda dinámicamente a las lecturas de los sensores.

---

## 💻 Ejemplo con React Three Fiber + Socket.IO

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { io } from 'socket.io-client';
import * as THREE from 'three';

function DigitalTwinModel({ sensorId }: { sensorId: string }) {
  const { scene } = useGLTF('/modelos/motor_industrial.glb');
  const [temperature, setTemperature] = useState<number>(20);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // 1. Conectar a Betty Realtime Gateway
    const socket = io('http://localhost:3000/realtime', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Conectado al gemelo digital');
      socket.emit('subscribe:sensor', { sensorId });
    });

    // 2. Escuchar telemetría en tiempo real
    socket.on('sensor:data', (data) => {
      if (data.payload?.temperature !== undefined) {
        setTemperature(data.payload.temperature);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sensorId]);

  // Modificar color del material según la temperatura recibida
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && 'color' in mesh.material) {
          // Cambiar a rojo si supera 50°C
          const color = temperature > 50 ? '#ef4444' : '#3b82f6';
          (mesh.material as THREE.MeshStandardMaterial).color.set(color);
        }
      }
    });
  }, [temperature, scene]);

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

export function DigitalTwinViewer() {
  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <DigitalTwinModel sensorId="4c40ea57-43e0-4ee2-a8d5-77aae4fc387b" />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
```
