import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

function StudioEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const texture = pmrem.fromScene(room, 0.04).texture
    scene.environment = texture
    scene.environmentIntensity = 0.55
    if (typeof room.dispose === 'function') room.dispose()

    return () => {
      scene.environment = null
      texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return null
}

function ResponsiveCamera() {
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)

  useEffect(() => {
    camera.position.z = width < 640 ? 10.8 : width < 900 ? 9.6 : 8.4
    camera.updateProjectionMatrix()
  }, [camera, width])

  return null
}

function KnotCore() {
  const core = useRef(null)
  const cage = useRef(null)

  useFrame((state, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * 0.1
      core.current.rotation.z += delta * 0.055
    }
    if (cage.current) {
      cage.current.rotation.x -= delta * 0.06
      cage.current.rotation.y += delta * 0.12
    }
  })

  return (
    <group>
      <mesh ref={core}>
        <torusKnotGeometry args={[1.68, 0.36, 240, 40, 2, 3]} />
        <meshStandardMaterial
          color="#8257ff"
          emissive="#4c1d95"
          emissiveIntensity={0.85}
          metalness={0.82}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={cage} scale={1.18}>
        <torusKnotGeometry args={[1.68, 0.014, 180, 6, 3, 4]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.32} wireframe />
      </mesh>
    </group>
  )
}

function OrbitRing({ radius, tiltX, tiltY, color, speed, opacity = 0.45 }) {
  const ref = useRef(null)

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })

  return (
    <mesh ref={ref} rotation={[tiltX, tiltY, 0]}>
      <torusGeometry args={[radius, 0.01, 6, 200]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function Satellite({ radius, speed, phase, height, color, kind = 'ico' }) {
  const ref = useRef(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + phase
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2.1) * 0.3, Math.sin(t) * radius)
    ref.current.rotation.x = t
    ref.current.rotation.y = t * 0.7
  })

  return (
    <mesh ref={ref}>
      {kind === 'ico' ? (
        <icosahedronGeometry args={[0.14, 0]} />
      ) : (
        <octahedronGeometry args={[0.13, 0]} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  )
}

function Stars({ count = 650 }) {
  const ref = useRef(null)

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const radius = 4.6 + Math.random() * 4.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      array[i * 3 + 1] = radius * Math.cos(phi)
      array[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    return array
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ddd6fe"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function SceneContent() {
  const tilt = useRef(null)
  const spin = useRef(null)

  useFrame((state, delta) => {
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.lerp(tilt.current.rotation.x, state.pointer.y * 0.2, 0.05)
      tilt.current.rotation.y = THREE.MathUtils.lerp(tilt.current.rotation.y, state.pointer.x * 0.32, 0.05)
    }
    if (spin.current) spin.current.rotation.y += delta * 0.07
  })

  return (
    <>
      <ResponsiveCamera />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 6]} intensity={2.6} color="#ede9fe" />
      <pointLight position={[-5, -3, -3]} distance={22} intensity={70} color="#22d3ee" />
      <pointLight position={[5, -2, 4]} distance={22} intensity={60} color="#f472b6" />
      <pointLight position={[0, 5, -5]} distance={25} intensity={40} color="#8b5cf6" />

      <Stars />

      <group ref={tilt}>
        <group ref={spin}>
          <mesh scale={3.1}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
              color="#7c3aed"
              transparent
              opacity={0.07}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>

          <KnotCore />

          <OrbitRing radius={2.95} tiltX={Math.PI / 2.6} tiltY={0.2} color="#a78bfa" speed={0.12} />
          <OrbitRing radius={3.45} tiltX={-Math.PI / 3.1} tiltY={0.6} color="#22d3ee" speed={-0.09} opacity={0.38} />
          <OrbitRing radius={3.9} tiltX={Math.PI / 2.1} tiltY={-0.45} color="#f472b6" speed={0.06} opacity={0.3} />

          <Satellite radius={3.05} speed={0.32} phase={0} height={1.1} color="#22d3ee" />
          <Satellite radius={3.5} speed={0.26} phase={2.1} height={-0.8} color="#f472b6" kind="octa" />
          <Satellite radius={2.75} speed={0.4} phase={4.2} height={0.45} color="#fbbf24" />
        </group>
      </group>
    </>
  )
}

export default function Hero3D() {
  return (
    <div className="hero-canvas" aria-hidden="true">
      <div className="hero-fallback" />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <StudioEnvironment />
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
