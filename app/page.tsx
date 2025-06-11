"use client"

import { useState, useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, SunIcon, MoonIcon } from "lucide-react"
import * as THREE from "three"

// Planet data with realistic proportions (scaled for visualization)
const PLANET_DATA = [
  { name: "Mercury", color: "#8C7853", size: 0.15, distance: 2, speed: 4.74, info: "Closest to Sun" },
  { name: "Venus", color: "#FFC649", size: 0.18, distance: 2.8, speed: 3.5, info: "Hottest planet" },
  { name: "Earth", color: "#6B93D6", size: 0.2, distance: 3.6, speed: 2.98, info: "Our home planet" },
  { name: "Mars", color: "#CD5C5C", size: 0.16, distance: 4.4, speed: 2.41, info: "The red planet" },
  { name: "Jupiter", color: "#D8CA9D", size: 0.8, distance: 6.5, speed: 1.31, info: "Largest planet" },
  { name: "Saturn", color: "#FAD5A5", size: 0.7, distance: 8.5, speed: 0.97, info: "Has beautiful rings" },
  { name: "Uranus", color: "#4FD0E7", size: 0.4, distance: 10.5, speed: 0.68, info: "Ice giant" },
  { name: "Neptune", color: "#4B70DD", size: 0.38, distance: 12.5, speed: 0.54, info: "Windiest planet" },
]

interface PlanetProps {
  data: (typeof PLANET_DATA)[0]
  speedMultiplier: number
  isPaused: boolean
  onHover: (planet: string | null) => void
  showLabels: boolean
}

function createEllipsePoints(a: number, b: number, segments: number) {
  const points = []
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI
    points.push(new THREE.Vector3(a * Math.cos(theta), 0, b * Math.sin(theta)))
  }
  return points
}

function Planet({
  data,
  speedMultiplier,
  isPaused,
  onHover,
  showLabels,
  showOrbitalTrails,
}: PlanetProps & { showOrbitalTrails: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  const [hovered, setHovered] = useState(false)
  const [trailPositions, setTrailPositions] = useState<Float32Array>(new Float32Array(300)) // 100 points * 3 coordinates

  useFrame((state) => {
    if (!isPaused && groupRef.current) {
      groupRef.current.rotation.y += data.speed * speedMultiplier * 0.01

      // Update trail positions
      if (showOrbitalTrails && trailRef.current) {
        const positions = trailRef.current.geometry.attributes.position.array as Float32Array
        const currentAngle = groupRef.current.rotation.y

        // Shift existing positions
        for (let i = positions.length - 3; i >= 3; i -= 3) {
          positions[i] = positions[i - 3]
          positions[i + 1] = positions[i - 2]
          positions[i + 2] = positions[i - 1]
        }

        // Add new position
        positions[0] = Math.cos(currentAngle) * data.distance
        positions[1] = 0
        positions[2] = Math.sin(currentAngle) * data.distance

        trailRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  // Elliptical orbit parameters (a,b) - semi-major and semi-minor axes
  // For Earth-like elliptical orbits, b is slightly less than a
  const a = data.distance
  const b = data.distance * 0.85 // 15% flattening for ellipse

  // Create elliptical orbit points
  const ellipsePoints = createEllipsePoints(a, b, 128)
  const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints)

  return (
    <group ref={groupRef}>
      {/* Orbital Trail */}
      {showOrbitalTrails && (
        <points ref={trailRef}>
          <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.05} color={data.color} transparent opacity={0.6} sizeAttenuation={true} />
        </points>
      )}

      {/* Planet */}
      <mesh
        ref={meshRef}
        position={[a, 0, 0]}
        onPointerOver={() => {
          setHovered(true)
          onHover(data.name)
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(null)
        }}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[data.size, 32, 32]} />
        <meshStandardMaterial
          color={data.color}
          roughness={0.7}
          metalness={0.1}
          emissive={data.color}
          emissiveIntensity={hovered ? 0.2 : 0.1}
        />
        {showLabels && (
          <Html distanceFactor={10}>
            <div
              style={{
                backgroundColor: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontWeight: "600" }}>{data.name}</div>
              <div style={{ opacity: 0.75, fontSize: "10px" }}>{data.info}</div>
            </div>
          </Html>
        )}
      </mesh>

      {/* Elliptical Orbit Ring */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <lineSegments geometry={ellipseGeometry}>
          <lineBasicMaterial color={data.color} transparent opacity={0.3} />
        </lineSegments>
      </group>
    </group>
  )
}

function SunComponent() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial color="#FDB813" />
      <pointLight intensity={2} distance={50} />
    </mesh>
  )
}

function SolarSystemScene({
  planetSpeeds,
  isPaused,
  hoveredPlanet,
  setHoveredPlanet,
  showLabels,
  showStars,
  showOrbitalTrails,
}: {
  planetSpeeds: number[]
  isPaused: boolean
  hoveredPlanet: string | null
  setHoveredPlanet: (planet: string | null) => void
  showLabels: boolean
  showStars: boolean
  showOrbitalTrails: boolean
}) {
  return (
    <>
      {showStars && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />}
      <ambientLight intensity={0.1} />
      <SunComponent />
      {PLANET_DATA.map((planet, index) => (
        <Planet
          key={planet.name}
          data={planet}
          speedMultiplier={planetSpeeds[index]}
          isPaused={isPaused}
          onHover={setHoveredPlanet}
          showLabels={showLabels}
          showOrbitalTrails={showOrbitalTrails}
        />
      ))}
    </>
  )
}

export default function SolarSystemSimulation() {
  const [planetSpeeds, setPlanetSpeeds] = useState([2.3, 1.0, 1.0, 1.0, 1.0, 1.5, 1.0, 1.0])
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showStars, setShowStars] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showOrbitalTrails, setShowOrbitalTrails] = useState(true)

  const handleSpeedChange = (planetIndex: number, newSpeed: number[]) => {
    const newSpeeds = [...planetSpeeds]
    newSpeeds[planetIndex] = newSpeed[0]
    setPlanetSpeeds(newSpeeds)
  }

  const resetSpeeds = () => {
    setPlanetSpeeds([2.3, 1.0, 1.0, 1.0, 1.0, 1.5, 1.0, 1.0])
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      window.removeEventListener("resize", checkMobile)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  // Inline styles replacing Tailwind CSS classes and animations
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: darkMode ? "#1a202c" : "#f7fafc",
    position: "relative",
    overflow: "hidden",
  }

  const headerStyle: React.CSSProperties = {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  const titleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 24,
    fontWeight: "bold",
    color: darkMode ? "white" : "#1a202c",
  }

  const badgeStyle: React.CSSProperties = {
    backgroundColor: darkMode ? "#4a5568" : "#e2e8f0",
    color: darkMode ? "white" : "#1a202c",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "600",
  }

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  }

  const canvasStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    display: "block",
  }

  const controlPanelStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: isMobile ? 16 : "auto",
    maxHeight: isMobile ? 320 : 384,
    width: isMobile ? "auto" : 320,
    overflowY: "auto",
    backgroundColor: darkMode ? "#2d3748" : "#edf2f7",
    borderRadius: 8,
    padding: 16,
    boxSizing: "border-box",
  }

  const cardHeaderStyle: React.CSSProperties = {
    paddingBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  }

  const toggleButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 4,
    border: "1px solid #ccc",
    backgroundColor: "transparent",
    cursor: "pointer",
  }

  const toggleButtonActiveStyle: React.CSSProperties = {
    ...toggleButtonStyle,
    backgroundColor: darkMode ? "#4a5568" : "#e2e8f0",
  }

  const speedControlContainerStyle: React.CSSProperties = {
    marginTop: 16,
  }

  const speedControlItemStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const speedIndicatorBarStyle = (color: string, widthPercent: number): React.CSSProperties => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: color,
    opacity: 0.7,
    width: `${widthPercent}%`,
    transition: "width 0.3s ease",
  })

  const mobileToggleButtonStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 20,
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 4,
    border: "1px solid #ccc",
    backgroundColor: darkMode ? "#4a5568" : "#e2e8f0",
    cursor: "pointer",
  }

  const instructionsStyle: React.CSSProperties = {
    position: "absolute",
    top: 64,
    left: 16,
    right: 16,
    maxWidth: 256,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 12,
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>
          <h1>Solar System 3D</h1>
          {hoveredPlanet && <div style={badgeStyle}>{hoveredPlanet}</div>}
        </div>

        <div style={buttonGroupStyle}>
          <Button variant="outline" size="sm" onClick={toggleFullscreen} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {isFullscreen ? "Exit" : "Full"} Screen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            style={{ display: isMobile ? "none" : "inline-flex" }}
          >
            {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            style={{ display: isMobile ? "none" : "inline-flex" }}
          >
            Controls
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 10, 15], fov: 60 }} style={canvasStyle}>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={5} maxDistance={50} />
        <SolarSystemScene
          planetSpeeds={planetSpeeds}
          isPaused={isPaused}
          hoveredPlanet={hoveredPlanet}
          setHoveredPlanet={setHoveredPlanet}
          showLabels={showLabels}
          showStars={showStars}
          showOrbitalTrails={showOrbitalTrails}
        />
      </Canvas>

      {/* Control Panel */}
      {showControls && (
        <Card style={controlPanelStyle}>
          <CardHeader style={cardHeaderStyle}>
            <CardTitle style={cardTitleStyle}>
              Control Panel
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="outline" size="sm" onClick={togglePause} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="outline" size="sm" onClick={resetSpeeds} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {/* Toggle Options */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, padding: 16 }}>
              <Button
                variant={showLabels ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                style={showLabels ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                Labels
              </Button>
              <Button
                variant={showStars ? "default" : "outline"}
                size="sm"
                onClick={() => setShowStars(!showStars)}
                style={showStars ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                Stars
              </Button>
              <Button
                variant={showOrbitalTrails ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
                style={showOrbitalTrails ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                Trails
              </Button>
            </div>

            {/* Planet Speed Controls */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontWeight: "600", fontSize: 14 }}>Orbital Speeds</h3>
                <Badge
                  variant="outline"
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    borderColor: "#ccc",
                    color: darkMode ? "white" : "#1a202c",
                  }}
                >
                  {isPaused ? "Paused" : "Active"}
                </Badge>
              </div>

              <div>
                {PLANET_DATA.map((planet, index) => (
                  <div key={planet.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.2)",
                            backgroundColor: planet.color,
                          }}
                        />
                        <span style={{ fontSize: 14, fontWeight: "500" }}>{planet.name}</span>
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          style={{
                            fontSize: 10,
                            fontFamily: "monospace",
                            minWidth: 45,
                            textAlign: "center",
                            backgroundColor: `${planet.color}20`,
                            color: planet.color,
                            border: `1px solid ${planet.color}40`,
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {planetSpeeds[index].toFixed(1)}x
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Slider
                        value={[planetSpeeds[index]]}
                        onValueChange={(value) => handleSpeedChange(index, value)}
                        max={5}
                        min={0}
                        step={0.1}
                        style={{ width: "100%" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 4 }}>
                        <span>0x</span>
                        <span>2.5x</span>
                        <span>5x</span>
                      </div>
                    </div>

                    {/* Speed indicator bar */}
                    <div
                      style={{
                        marginTop: 8,
                        height: 8,
                        backgroundColor: darkMode ? "#4a5568" : "#e2e8f0",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 4,
                          backgroundColor: planet.color,
                          opacity: 0.7,
                          width: `${(planetSpeeds[index] / 5) * 100}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Controls Toggle */}
      <button style={mobileToggleButtonStyle} onClick={() => setShowControls(!showControls)}>
        {showControls ? "Hide" : "Show"} Controls
      </button>

      {/* Instructions */}
      <div style={instructionsStyle}>
        <p>🖱️ Drag to rotate • 🔍 Scroll to zoom • 🎯 Hover planets for info</p>
      </div>
    </div>
  )
}
