'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, Grid, OrbitControls, useGLTF } from '@react-three/drei'

function Student({ position, gender = 'girl' }: { position: [number,number,number], gender?: 'boy'|'girl' }) {
  const { scene } = useGLTF(`/models/${gender}.glb`)
  return <primitive object={scene.clone()} position={position} scale={.85} />
}

export function StageScene() {
  const positions: [number,number,number][] = [[-3,0,-1],[-1.5,0,-1],[0,0,-1],[1.5,0,-1],[3,0,-1],[-2.3,0,1],[-.8,0,1],[.8,0,1],[2.3,0,1]]
  return <Canvas camera={{ position: [8,7,10], fov: 38 }} shadows><color attach="background" args={['#0b0c0d']} /><ambientLight intensity={1.2} /><directionalLight position={[5,8,5]} intensity={2.5} castShadow /><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[14,10]} /><meshStandardMaterial color="#181b1d" roughness={.8} /></mesh>{positions.map((p,i)=><Student key={i} position={p} gender={i%3===0?'boy':'girl'} />)}<Grid args={[14,10]} position={[0,.01,0]} cellColor="#303438" sectionColor="#e85d2a" fadeDistance={24} /><OrbitControls makeDefault minDistance={6} maxDistance={22} /><Environment preset="warehouse" /></Canvas>
}

useGLTF.preload('/models/boy.glb')
useGLTF.preload('/models/girl.glb')
