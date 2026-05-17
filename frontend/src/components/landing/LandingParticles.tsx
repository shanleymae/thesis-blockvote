import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

const LandingParticles = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      if (mounted) setReady(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: false,
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: {
          value: 76,
          density: {
            enable: true,
          },
        },
        color: {
          value: ['#ffffff', '#9ca3af'],
        },
        opacity: {
          value: { min: 0.12, max: 0.42 },
        },
        size: {
          value: { min: 0.8, max: 2.2 },
        },
        links: {
          enable: true,
          color: '#ffffff',
          opacity: 0.09,
          distance: 145,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.38,
          direction: 'none',
          random: false,
          straight: false,
          outModes: {
            default: 'out',
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 165,
            links: {
              opacity: 0.16,
            },
          },
        },
      },
    }),
    []
  )

  if (!ready) return null

  return (
    <Particles
      id="landing-particles"
      className="landing-particles"
      options={options}
    />
  )
}

export default LandingParticles
