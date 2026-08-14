"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x08090e, 0.015)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 25

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Particle Swarm Generation
    const particleCount = 1400
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const colorChoices = [
      new THREE.Color(0x6366f1), // Indigo
      new THREE.Color(0xec4899), // Pink
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0x8b5cf6), // Purple
    ]

    for (let i = 0; i < particleCount; i++) {
      const radius = 12 + Math.random() * 18
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // Particle Texture creation dynamically
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, "rgba(255,255,255,1)")
      grad.addColorStop(0.4, "rgba(255,255,255,0.6)")
      grad.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
    }

    const particleTexture = new THREE.CanvasTexture(canvas)
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Inner Glowing Geometric Torus Ring
    const ringGeo = new THREE.TorusGeometry(8, 0.4, 16, 100)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
    const torusRing = new THREE.Mesh(ringGeo, ringMat)
    scene.add(torusRing)

    // Outer Cyber Ring
    const outerRingGeo = new THREE.TorusGeometry(14, 0.15, 12, 80)
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    })
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
    outerRing.rotation.x = Math.PI / 3
    scene.add(outerRing)

    // Mouse Interaction
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Window Resize
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    // Animation Loop
    let clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      particles.rotation.y = elapsedTime * 0.05
      particles.rotation.x = elapsedTime * 0.025

      torusRing.rotation.x = elapsedTime * 0.2
      torusRing.rotation.y = elapsedTime * 0.3

      outerRing.rotation.y = -elapsedTime * 0.15
      outerRing.rotation.z = elapsedTime * 0.1

      // Mouse Parallax smooth lerp
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.05
      camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    />
  )
}
