// 会员 3D 渲染器:React Three Fiber。仅在切到 3D 时被动态加载(免费用户不拉取 Three)。
// 读取统一 store 的 {x,z},与 2.5D/草图共用同一份状态,拖拽回写一致。
"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { StageLighting } from "@/components/StageLighting";
import { OutdoorFieldScene } from "@/components/OutdoorFieldScene";
import { StudentGlbModel } from "@/components/StudentGlbModel";
import {
  useEditorStore,
  samplePos,
  shadeHex,
  MALE_COLOR,
  FEMALE_COLOR,
  ACCENT,
  STAGE_W,
  STAGE_D,
  DURATION,
  JUDGE,
  type Performer,
  type LightMode,
} from "./editor-core";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function PerformerFigure({ p, occludedBy }: { p: Performer; occludedBy?: string }) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const setDragging = useEditorStore((s) => s.setDragging);
  const move = useEditorStore((s) => s.move);
  const playing = useEditorStore((s) => s.playing);
  const dragging = useRef(false);
  const hitPoint = useRef(new THREE.Vector3());

  const isSelected = selectedId === p.id;
  const isOccluded = Boolean(occludedBy);
  const costume = useEditorStore((s) => s.costume);
  const color = costume
    ? p.gender === "male"
      ? costume.secondaryHex
      : costume.primaryHex
    : p.gender === "male"
      ? MALE_COLOR
      : FEMALE_COLOR;
  const malePants = costume ? shadeHex(costume.primaryHex, -0.45) : "#4a5568";
  const skirtColor = costume ? costume.accentHex : color;
  const h = (p.heightCm / 150) * 1.7;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    select(p.id);
    if (playing) return;
    dragging.current = true;
    setDragging(p.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(DRAG_PLANE, hitPoint.current)) {
      move(p.id, hitPoint.current.x, hitPoint.current.z);
    }
  };
  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    dragging.current = false;
    setDragging(null);
  };

  return (
    <group position={[p.x, 0, p.z]}>
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.42, 0.56, 48]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.9} />
        </mesh>
      ) : null}
      {isOccluded ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.3, 0.4, 48]} />
          <meshBasicMaterial color="#e5484d" transparent opacity={0.95} />
        </mesh>
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.28} />
      </mesh>
      <mesh
        position={[0, h / 2, 0]}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        visible={false}
      >
        <cylinderGeometry args={[0.5, 0.5, h + 0.4, 8]} />
      </mesh>
      <Suspense fallback={null}>
        <StudentGlbModel
          gender={p.gender}
          heightM={h}
          colors={{ top: color, bottom: malePants, accent: skirtColor }}
          selected={isSelected}
        />
      </Suspense>
      <Html distanceFactor={11} position={[0, h + 0.42, 0]} center zIndexRange={[40, 0]}>
        <div
          className={cn(
            "pointer-events-none rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap",
            isOccluded
              ? "bg-[#e5484d] text-white"
              : isSelected
                ? "bg-[#3aa89e] text-[#06211f]"
                : "bg-[#11141a]/85 text-[#9fb3c8]",
          )}
        >
          {p.id}
        </div>
      </Html>
    </group>
  );
}

function TimelineDriver() {
  const playing = useEditorStore((s) => s.playing);
  const tick = useEditorStore((s) => s.tick);
  useFrame((_, dt) => {
    if (playing) tick(Math.min(dt, 0.1));
  });
  return null;
}

function GhostTrail() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const keyframes = useEditorStore((s) => s.keyframes);

  const points = useMemo(() => {
    if (!selectedId) return null;
    const pts: THREE.Vector3[] = [];
    for (let t = 0; t <= DURATION + 0.001; t += 0.25) {
      const [x, z] = samplePos(keyframes, selectedId, Math.min(t, DURATION));
      pts.push(new THREE.Vector3(x, 0.05, z));
    }
    return pts;
  }, [selectedId, keyframes]);

  const markers = useMemo(() => {
    if (!selectedId) return [];
    return keyframes.map((kf) => ({ time: kf.time, pos: kf.positions[selectedId] ?? ([0, 0] as [number, number]) }));
  }, [selectedId, keyframes]);

  if (!points) return null;
  return (
    <group>
      <Line points={points} color={ACCENT} lineWidth={2} dashed dashSize={0.35} gapSize={0.18} transparent opacity={0.85} />
      {markers.map((m) => (
        <mesh key={m.time} position={[m.pos[0], 0.06, m.pos[1]]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function JudgeMarker({ occlusions }: { occlusions: Map<string, string> }) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const performers = useEditorStore((s) => s.performers);
  const selected = performers.find((p) => p.id === selectedId);
  const blocked = selected ? occlusions.has(selected.id) : false;

  return (
    <group>
      <mesh position={[JUDGE.x, 0.35, JUDGE.z]} castShadow>
        <boxGeometry args={[2.4, 0.7, 1]} />
        <meshStandardMaterial color="#2b303b" roughness={0.7} />
      </mesh>
      <mesh position={[JUDGE.x, JUDGE.y, JUDGE.z]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#f5c542" emissive="#f5c542" emissiveIntensity={0.6} />
      </mesh>
      <Html position={[JUDGE.x, JUDGE.y + 0.55, JUDGE.z]} center zIndexRange={[10, 0]}>
        <div className="pointer-events-none flex items-center gap-1.5 rounded-md bg-[#11141a]/85 px-2.5 py-1 text-[11px] whitespace-nowrap text-[#f5c542]">
          <Eye size={12} />
          评委视点
        </div>
      </Html>
      {selected ? (
        <Line
          points={[
            new THREE.Vector3(JUDGE.x, JUDGE.y, JUDGE.z),
            new THREE.Vector3(selected.x, (selected.heightCm / 150) * 1.7, selected.z),
          ]}
          color={blocked ? "#e5484d" : "#f5c542"}
          lineWidth={1.5}
          dashed
          dashSize={0.3}
          gapSize={0.15}
          transparent
          opacity={0.75}
        />
      ) : null}
    </group>
  );
}

const MODE_BG: Record<LightMode, string> = {
  indoor: "#1f1c18",
  led: "#101318",
  outdoor: "#2a3240",
};

function StageScene() {
  const performers = useEditorStore((s) => s.performers);
  const draggingId = useEditorStore((s) => s.draggingId);
  const select = useEditorStore((s) => s.select);
  const lightMode = useEditorStore((s) => s.lightMode);
  const themeColor = useEditorStore((s) => s.themeColor);
  const fieldType = useEditorStore((s) => s.fieldType);
  const timeOfDay = useEditorStore((s) => s.timeOfDay);
  const occlusions = useEditorStore((s) => s.occlusions);
  const isOutdoor = lightMode === "outdoor";
  const bg = MODE_BG[lightMode];

  return (
    <>
      {!isOutdoor ? (
        <>
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, 26, 46]} />
        </>
      ) : null}
      <OrbitControls
        makeDefault
        enabled={!draggingId}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={34}
        enablePan={false}
        target={[0, 0, 0]}
      />
      {isOutdoor ? (
        <OutdoorFieldScene fieldType={fieldType} timeOfDay={timeOfDay} />
      ) : (
        <StageLighting mode={lightMode} themeColor={themeColor} />
      )}

      {!isOutdoor ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow onPointerDown={() => select(null)}>
          <planeGeometry args={[STAGE_W + 6, STAGE_D + 6]} />
          <meshStandardMaterial color="#242830" roughness={0.92} />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onPointerDown={() => select(null)}>
          <planeGeometry args={[STAGE_W + 6, STAGE_D + 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      <lineSegments position={[0, 0.015, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(STAGE_W, 0.001, STAGE_D)]} />
        <lineBasicMaterial color={ACCENT} transparent opacity={isOutdoor ? 0.85 : 0.5} />
      </lineSegments>
      {!isOutdoor ? (
        <Grid
          position={[0, 0, 0]}
          args={[STAGE_W, STAGE_D]}
          cellSize={1}
          cellThickness={0.7}
          cellColor="#3a4150"
          sectionSize={5}
          sectionThickness={1.2}
          sectionColor="#4c5568"
          fadeDistance={38}
          fadeStrength={1}
          infiniteGrid
        />
      ) : null}
      <Html position={[0, 0.02, STAGE_D / 2 + 1.6]} center zIndexRange={[10, 0]}>
        <div className="pointer-events-none rounded-md bg-[#11141a]/80 px-3 py-1 text-xs tracking-widest whitespace-nowrap text-[#9fb3c8]">
          观众席 ↓
        </div>
      </Html>

      {performers.map((p) => (
        <PerformerFigure key={p.id} p={p} occludedBy={occlusions.get(p.id)} />
      ))}

      <TimelineDriver />
      <GhostTrail />
      <JudgeMarker occlusions={occlusions} />
    </>
  );
}

export function Stage3DView() {
  const dpr = useMemo<[number, number]>(() => [1, 1.8], []);
  return (
    <Canvas shadows dpr={dpr} camera={{ position: [0, 11, 15], fov: 45 }}>
      <StageScene />
    </Canvas>
  );
}
