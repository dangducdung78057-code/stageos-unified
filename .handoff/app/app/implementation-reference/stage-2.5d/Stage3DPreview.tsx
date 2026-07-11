import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useStageStore } from "@/store/useStageStore";

function Figure({
  x,
  z,
  riserLevel,
  color,
}: {
  x: number;
  z: number;
  riserLevel: number;
  color: string;
}) {
  const y = riserLevel * 0.22;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.17, 18, 18]} />
        <meshStandardMaterial color="#efc5a5" />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.62, 8, 14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.11, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.42, 6, 10]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0.11, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.42, 6, 10]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

export function Stage3DPreview() {
  const performers = useStageStore((s) => s.performers);

  return (
    <div className="stage-host">
      <Canvas shadows camera={{ position: [0, 8, 13], fov: 44 }}>
        <color attach="background" args={["#07111f"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 10, 6]} intensity={2.1} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#29313b" />
        </mesh>
        <Grid args={[16, 10]} cellColor="#4a5568" sectionColor="#718096" />
        {performers.map((p) => (
          <Figure
            key={p.id}
            x={p.position.x}
            z={p.position.z - 4}
            riserLevel={p.position.riserLevel ?? 0}
            color={p.appearance.upperColor}
          />
        ))}
        <OrbitControls makeDefault target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
