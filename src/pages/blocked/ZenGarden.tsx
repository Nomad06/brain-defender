/**
 * Zen Garden Interactive Component
 * Allows users to "rake" a zen garden for mindfulness
 */

import React, { useRef, useState, useEffect } from 'react'

interface ZenGardenProps {
  width?: number
  height?: number
}

const ZenGarden: React.FC<ZenGardenProps> = ({ width = 600, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRaking, setIsRaking] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize canvas with sand texture
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)

    // Draw initial sand background
    drawSandBackground(ctx, width, height)

    // Place rocks
    placeRocks(ctx, width, height)
  }, [width, height])

  const drawSandBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Sand gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#f5f1e8')
    gradient.addColorStop(1, '#e8e4db')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Add subtle noise texture for sand
    for (let i = 0; i < w * h / 50; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.03})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const placeRocks = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const rocks = [
      { x: w * 0.25, y: h * 0.35, r: 30 },
      { x: w * 0.7, y: h * 0.6, r: 25 },
      { x: w * 0.5, y: h * 0.7, r: 18 },
    ]

    rocks.forEach(rock => {
      // Rock shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.beginPath()
      ctx.ellipse(rock.x + 3, rock.y + 3, rock.r, rock.r * 0.9, 0, 0, Math.PI * 2)
      ctx.fill()

      // Rock gradient (gray stone)
      const gradient = ctx.createRadialGradient(
        rock.x - rock.r * 0.3,
        rock.y - rock.r * 0.3,
        rock.r * 0.1,
        rock.x,
        rock.y,
        rock.r
      )
      gradient.addColorStop(0, '#9a9a9a')
      gradient.addColorStop(0.5, '#707070')
      gradient.addColorStop(1, '#4a4a4a')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(rock.x, rock.y, rock.r, rock.r * 0.9, 0, 0, Math.PI * 2)
      ctx.fill()

      // Rock highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.ellipse(rock.x - rock.r * 0.3, rock.y - rock.r * 0.3, rock.r * 0.4, rock.r * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const drawRakeLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    // Draw rake marks (parallel lines)
    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx)
    const perpAngle = angle + Math.PI / 2

    const rakeWidth = 20
    const tineCount = 5

    for (let i = 0; i < tineCount; i++) {
      const offset = ((i - (tineCount - 1) / 2) / (tineCount - 1)) * rakeWidth
      const offsetX = Math.cos(perpAngle) * offset
      const offsetY = Math.sin(perpAngle) * offset

      ctx.strokeStyle = 'rgba(46, 95, 111, 0.15)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1 + offsetX, y1 + offsetY)
      ctx.lineTo(x2 + offsetX, y2 + offsetY)
      ctx.stroke()
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsRaking(true)
    setLastPos({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRaking || !lastPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    drawRakeLine(ctx, lastPos.x, lastPos.y, x, y)
    setLastPos({ x, y })
  }

  const handleMouseUp = () => {
    setIsRaking(false)
    setLastPos(null)
  }

  const handleMouseLeave = () => {
    setIsRaking(false)
    setLastPos(null)
  }

  const handleReset = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawSandBackground(ctx, width, height)
    placeRocks(ctx, width, height)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isRaking ? 'grabbing' : 'grab',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--kinari-cream)',
        }}
      />
      <button
        onClick={handleReset}
        className="btn"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          fontSize: '11px',
          padding: '6px 12px',
          opacity: 0.8,
        }}
      >
        🔄 Reset Garden
      </button>
    </div>
  )
}

export default ZenGarden
