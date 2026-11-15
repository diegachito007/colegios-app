import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { easing } from 'maath';

// --- 1. EL EDIFICIO DEL COLEGIO (Con colores de la marca) ---
function Edificio() {
  return (
    <group position={[0, 0, 0]}>
      {/* Estructura principal (Blanco hueso) */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 4, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      
      {/* Techo (Azul de la marca) */}
      <mesh position={[0, 4.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[4.5, 4.5, 4.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Ventanas (Naranja cálido / Iluminadas) */}
      {[-1.5, 0, 1.5].map((x) => (
        <mesh key={`v1-${x}`} position={[x, 3, 2.01]} castShadow>
          <boxGeometry args={[0.8, 1, 0.1]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {[-1.5, 0, 1.5].map((x) => (
        <mesh key={`v2-${x}`} position={[x, 1, 2.01]} castShadow>
          <boxGeometry args={[0.8, 1, 0.1]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Marco de la puerta (Azul oscuro) */}
      <mesh position={[0, 1, 2.02]} castShadow>
        <boxGeometry args={[1.8, 2.2, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// --- 2. LA PUERTA ANIMADA (Blanca con detalles) ---
function Puerta() {
  const doorRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (doorRef.current) {
      const time = state.clock.getElapsedTime();
      const targetRotation = time > 0.5 ? -Math.PI / 2 : 0;
      easing.damp(doorRef.current.rotation, 'y', targetRotation, 0.8, delta);
    }
  });

  return (
    <mesh 
      ref={doorRef} 
      position={[0.8, 1, 2.02]} 
      castShadow
    >
      <boxGeometry args={[1.6, 2, 0.05]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
    </mesh>
  );
}

// --- 3. EL ÁRBOL (Verde vibrante, estilo low-poly) ---
function Arbol({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 2, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color="#10b981" roughness={0.5} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#059669" roughness={0.5} />
      </mesh>
    </group>
  );
}

// --- 4. EL ALUMNO ---
function Alumno() {
  const studentRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (studentRef.current) {
      const time = state.clock.getElapsedTime();
      if (time > 1.5) {
        easing.damp(studentRef.current.position, 'z', 1.5, 0.4, delta);
      }
      // Animación de "caminar" suave
      studentRef.current.position.y = Math.abs(Math.sin(time * 5)) * 0.05;
    }
  });

  return (
    <group ref={studentRef} position={[0, 0, -2]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      {/* Mochila */}
      <mesh position={[0, 0.9, -0.25]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.2]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  );
}

// --- 5. CÁMARA CINEMATOGRÁFICA ---
function CámaraCinematográfica() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame((state, delta) => {
    if (cameraRef.current) {
      const time = state.clock.getElapsedTime();
      // La cámara empieza lejos y se acerca (efecto zoom)
      const targetZ = Math.max(6, 14 - time * 2);
      
      easing.damp(cameraRef.current.position, 'z', targetZ, 0.5, delta);
      cameraRef.current.lookAt(0, 1.5, 0);
    }
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 3, 14]} fov={45} />;
}

// --- 6. ESCENA COMPLETA ---
export default function ColegioScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        {/* Fondo transparente para que se vea el bg-brand-light de la sección */}
        <color attach="background" args={['transparent']} />
        
        {/* Iluminación Cálida */}
        <ambientLight intensity={0.6} color="#fed7aa" /> {/* Tono melocotón */}
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          color="#fef08a" // Luz solar amarilla
        />
        <Environment preset="sunset" />

        <CámaraCinematográfica />

        {/* Objetos */}
        <Edificio />
        <Puerta />
        <Alumno />
        
        <Arbol position={[-4, 0, 1]} />
        <Arbol position={[4.5, 0, 0]} />
        <Arbol position={[-3.5, 0, -3]} />

        {/* Suelo con degradado o color suave */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>

        <ContactShadows 
          position={[0, 0.01, 0]} 
          opacity={0.4} 
          scale={15} 
          blur={2} 
          far={5} 
          color="#0f172a" 
        />
      </Canvas>
    </div>
  );
}