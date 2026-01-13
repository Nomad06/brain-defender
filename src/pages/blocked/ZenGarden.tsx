/**
 * Zen Garden Interactive Component
 * Allows users to "rake" a zen garden for mindfulness
 */

import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ZenGardenProps {
  width?: number
  height?: number
}

const ZenGarden: React.FC<ZenGardenProps> = ({ width = 600, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRaking, setIsRaking] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  // Draw Functions
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

  // Responsive Effect
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const { clientWidth } = container
      const newWidth = clientWidth || width
      const newHeight = height // Keep fixed height for now

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = newWidth * dpr
      canvas.height = newHeight * dpr
      canvas.style.width = newWidth + 'px'
      canvas.style.height = newHeight + 'px'
      ctx.scale(dpr, dpr)

      drawSandBackground(ctx, newWidth, newHeight)
      placeRocks(ctx, newWidth, newHeight)
    }

    updateSize()

    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [width, height])


  // Event Handlers
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

    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    drawSandBackground(ctx, w, h)
    placeRocks(ctx, w, h)
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ position: 'relative', width: '100%', maxWidth: '100%', height: height + 'px', display: 'block' }}
    >
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
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      <button
        onClick={handleReset}
        className="absolute bottom-3 right-3 text-xs px-3 py-1.5 opacity-80 bg-shiro-white/80 rounded border border-border hover:opacity-100 hover:bg-white transition-all shadow-sm font-mono text-sumi-gray"
      >
        🔄 Reset
      </button>
    </motion.div>
  )
}

export default ZenGarden
