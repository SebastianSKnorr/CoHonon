'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ── Colours ──────────────────────────────────────────────────────────────────

const GRASS_TOP    = 0x5a9e3e
const GRASS_SIDE   = 0x4a8a32
const DIRT          = 0x8b6b4a
const TRUNK         = 0x6b4226
const LEAVES        = 0x2d7a2d
const SKY           = 0x87ceeb
const SKIN          = 0xd4a574
const SHIRT         = 0x4a90d9
const PANTS         = 0x2a3a5c
const SHOE          = 0x333333

// ── Helper: create a grass block ─────────────────────────────────────────────

function createGrassBlock(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  const materials = [
    new THREE.MeshLambertMaterial({ color: GRASS_SIDE }), // +x
    new THREE.MeshLambertMaterial({ color: GRASS_SIDE }), // -x
    new THREE.MeshLambertMaterial({ color: GRASS_TOP }),   // +y (top)
    new THREE.MeshLambertMaterial({ color: DIRT }),         // -y (bottom)
    new THREE.MeshLambertMaterial({ color: GRASS_SIDE }), // +z
    new THREE.MeshLambertMaterial({ color: GRASS_SIDE }), // -z
  ]
  return new THREE.Mesh(geo, materials)
}

// ── Helper: create a box part for the character ──────────────────────────────

function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshLambertMaterial({ color })
  return new THREE.Mesh(geo, mat)
}

// ── Build the blocky player character ────────────────────────────────────────

function createPlayer(): THREE.Group {
  const player = new THREE.Group()

  // Head
  const head = box(0.5, 0.5, 0.5, SKIN)
  head.position.y = 1.85
  player.add(head)

  // Eyes
  const eyeL = box(0.08, 0.06, 0.05, 0x222222)
  eyeL.position.set(-0.12, 1.88, 0.26)
  player.add(eyeL)
  const eyeR = box(0.08, 0.06, 0.05, 0x222222)
  eyeR.position.set(0.12, 1.88, 0.26)
  player.add(eyeR)

  // Body
  const body = box(0.5, 0.7, 0.3, SHIRT)
  body.position.y = 1.25
  player.add(body)

  // Left arm
  const armL = box(0.2, 0.65, 0.25, SHIRT)
  armL.position.set(-0.35, 1.25, 0)
  armL.name = 'armL'
  player.add(armL)

  // Right arm
  const armR = box(0.2, 0.65, 0.25, SHIRT)
  armR.position.set(0.35, 1.25, 0)
  armR.name = 'armR'
  player.add(armR)

  // Left leg
  const legL = box(0.22, 0.6, 0.25, PANTS)
  legL.position.set(-0.13, 0.6, 0)
  legL.name = 'legL'
  player.add(legL)

  // Right leg
  const legR = box(0.22, 0.6, 0.25, PANTS)
  legR.position.set(0.13, 0.6, 0)
  legR.name = 'legR'
  player.add(legR)

  // Shoes
  const shoeL = box(0.24, 0.12, 0.3, SHOE)
  shoeL.position.set(-0.13, 0.3, 0.02)
  player.add(shoeL)
  const shoeR = box(0.24, 0.12, 0.3, SHOE)
  shoeR.position.set(0.13, 0.3, 0.02)
  player.add(shoeR)

  return player
}

// ── Build a simple tree ──────────────────────────────────────────────────────

function createTree(x: number, z: number): THREE.Group {
  const tree = new THREE.Group()
  const trunk = box(0.3, 2, 0.3, TRUNK)
  trunk.position.set(x, 1.5, z)
  tree.add(trunk)
  const crown = box(1.8, 1.8, 1.8, LEAVES)
  crown.position.set(x, 3.2, z)
  tree.add(crown)
  return tree
}

// ── Main game setup ──────────────────────────────────────────────────────────

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SKY)
    scene.fog = new THREE.Fog(SKY, 30, 60)

    // Camera (third-person)
    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.1, 200)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8)
    sun.position.set(10, 20, 10)
    sun.castShadow = true
    scene.add(sun)

    // ── Ground: a grid of grass blocks ───────────────────────────────────

    const GROUND_SIZE = 24
    const groundGroup = new THREE.Group()
    for (let x = -GROUND_SIZE; x <= GROUND_SIZE; x++) {
      for (let z = -GROUND_SIZE; z <= GROUND_SIZE; z++) {
        const block = createGrassBlock()
        block.position.set(x, 0, z)
        block.receiveShadow = true
        groundGroup.add(block)
      }
    }
    scene.add(groundGroup)

    // ── Trees ────────────────────────────────────────────────────────────

    const treePositions = [
      [5, 5], [-8, 3], [3, -7], [-5, -10], [12, -4],
      [-12, 8], [8, 14], [-3, 12], [15, 10], [-14, -6],
      [10, -12], [-10, -14], [18, 2], [-18, -2], [0, 18],
    ]
    treePositions.forEach(([x, z]) => scene.add(createTree(x, z)))

    // ── Player ───────────────────────────────────────────────────────────

    const player = createPlayer()
    player.position.set(0, 0.5, 0)
    scene.add(player)

    // ── Controls state ───────────────────────────────────────────────────

    const keys: Record<string, boolean> = {}
    let yaw = 0          // horizontal camera angle (radians)
    let pitch = 0.3       // vertical camera angle
    const SPEED = 5       // units per second
    const CAM_DIST = 5    // distance behind player
    let isLocked = false
    let walkTime = 0      // for walk animation

    // Keyboard
    function onKeyDown(e: KeyboardEvent) { keys[e.code] = true }
    function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Mouse look (pointer lock)
    function onClick() {
      renderer.domElement.requestPointerLock()
    }
    renderer.domElement.addEventListener('click', onClick)

    function onLockChange() {
      isLocked = document.pointerLockElement === renderer.domElement
    }
    document.addEventListener('pointerlockchange', onLockChange)

    function onMouseMove(e: MouseEvent) {
      if (!isLocked) return
      yaw -= e.movementX * 0.002
      pitch -= e.movementY * 0.002
      pitch = Math.max(-0.5, Math.min(1.2, pitch))
    }
    document.addEventListener('mousemove', onMouseMove)

    // Resize
    function onResize() {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Game loop ────────────────────────────────────────────────────────

    const clock = new THREE.Clock()
    let frameId = 0

    function animate() {
      frameId = requestAnimationFrame(animate)
      const dt = clock.getDelta()

      // Movement direction relative to camera yaw
      let dx = 0, dz = 0
      if (keys['KeyW'] || keys['ArrowUp'])    { dz -= 1 }
      if (keys['KeyS'] || keys['ArrowDown'])   { dz += 1 }
      if (keys['KeyA'] || keys['ArrowLeft'])   { dx -= 1 }
      if (keys['KeyD'] || keys['ArrowRight'])  { dx += 1 }

      const moving = dx !== 0 || dz !== 0

      if (moving) {
        // Normalise so diagonal isn't faster
        const len = Math.sqrt(dx * dx + dz * dz)
        dx /= len
        dz /= len

        // Rotate movement by camera yaw
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)
        const mx = dx * cos - dz * sin
        const mz = dx * sin + dz * cos

        player.position.x += mx * SPEED * dt
        player.position.z += mz * SPEED * dt

        // Rotate character to face movement direction
        player.rotation.y = Math.atan2(mx, mz)

        // Walk animation
        walkTime += dt * 8
        const swing = Math.sin(walkTime) * 0.4
        const armL = player.getObjectByName('armL')
        const armR = player.getObjectByName('armR')
        const legL = player.getObjectByName('legL')
        const legR = player.getObjectByName('legR')
        if (armL) armL.rotation.x = swing
        if (armR) armR.rotation.x = -swing
        if (legL) legL.rotation.x = -swing
        if (legR) legR.rotation.x = swing
      } else {
        // Reset limbs to idle
        walkTime = 0
        ;['armL', 'armR', 'legL', 'legR'].forEach(name => {
          const part = player.getObjectByName(name)
          if (part) part.rotation.x = 0
        })
      }

      // Keep player within world bounds
      const BOUND = GROUND_SIZE - 1
      player.position.x = Math.max(-BOUND, Math.min(BOUND, player.position.x))
      player.position.z = Math.max(-BOUND, Math.min(BOUND, player.position.z))

      // Camera: orbit behind player
      const camX = player.position.x + Math.sin(yaw) * CAM_DIST * Math.cos(pitch)
      const camY = player.position.y + 2 + Math.sin(pitch) * CAM_DIST
      const camZ = player.position.z + Math.cos(yaw) * CAM_DIST * Math.cos(pitch)
      camera.position.set(camX, camY, camZ)
      camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z)

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    cleanupRef.current = () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }

    return () => { cleanupRef.current?.() }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            CoHonon World
          </div>
          <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600, marginTop: '0.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Explorer Mode
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        borderRadius: '8px', padding: '0.6rem 1.2rem',
        fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>WASD</span> move
        &nbsp;&middot;&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Mouse</span> look
        &nbsp;&middot;&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Click</span> to capture mouse
        &nbsp;&middot;&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>ESC</span> release
      </div>
    </div>
  )
}
