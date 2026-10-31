import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { lab } from '../content/lab'
import { useSettings } from '../progress/settings'
import { playSound } from '../sound/player'
import { EVENTS, type SoundEvent, type Tier } from '../sound/score'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import '../ui/ui.css'
import './lab.css'

const TIERS: Tier[] = ['touch', 'frequent', 'question', 'lesson', 'reward']
const STEPS = 6

/** A short lesson as sound: event, seconds after the previous one, and the step it belongs to. */
const DEMO: [SoundEvent, number, number][] = [
  ['lessonOpen', 0, 0],
  ['select', 2.2, 0],
  ['select', 0.5, 0],
  ['merge', 0.6, 0],
  ['land', 0.7, 0],
  ['step', 1.2, 2],
  ['select', 0.8, 2],
  ['land', 0.6, 2],
  ['wrong', 1.2, 2],
  ['correct', 2, 2],
  ['step', 2.6, 5],
  ['correct', 1.4, 5],
  ['lessonEnd', 2.6, 5],
]

/**
 * Every sound in the app, to hear them side by side on the phone: grouped by how often they happen,
 * with the place in the lesson that picks their chord.
 */
export function SoundLab() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [step, setStep] = useState(0)
  const events = Object.keys(EVENTS) as SoundEvent[]
  const play = (event: SoundEvent, at = step, index?: number) =>
    playSound(event, { step: at, steps: STEPS, ...(index === undefined ? {} : { index }) })

  const demo = () => {
    play('lessonOpen', 0)
    let at = 0
    for (const [event, gap, demoStep] of DEMO.slice(1)) {
      at += gap
      setTimeout(() => play(event, demoStep), at * 1000)
    }
  }

  return (
    <div className="dz dz-app">
      <div className="dz-stage">
        <Screen title={lab.sounds.title} back={() => void navigate({ to: '/me' })} backLabel={lab.back}>
          <p className="dz-read">{lab.sounds.intro}</p>
          {settings.sound === false ? <p className="dz-read dz-footnote">{lab.sounds.off}</p> : null}

          <div className="dz-section-label" id="sound-step">
            {lab.sounds.chord}
          </div>
          <fieldset className="sh-segments" aria-labelledby="sound-step" data-sound="none">
            {Array.from({ length: STEPS }, (_, i) => (
              <Pressable
                // biome-ignore lint/suspicious/noArrayIndexKey: the six places of a lesson are fixed
                key={i}
                className="sh-segment"
                aria-pressed={step === i}
                aria-label={`${lab.sounds.chord} ${i + 1}`}
                onClick={() => {
                  setStep(i)
                  play('step', i)
                }}
              >
                {lab.sounds.chords[i] || i + 1}
              </Pressable>
            ))}
          </fieldset>

          <div className="dz-list" style={{ marginTop: 16 }} data-sound="none">
            <Pressable className="dz-row" onClick={demo}>
              <span className="dz-row-main">
                <b>{lab.sounds.demo}</b>
                <small className="dz-footnote sh-row-sub">{lab.sounds.demoHint}</small>
              </span>
            </Pressable>
          </div>

          {TIERS.map((tier) => (
            <section key={tier}>
              <div className="dz-section-label">{lab.sounds.groups[tier]}</div>
              <div className="dz-list" data-sound="none">
                {events
                  .filter((event) => EVENTS[event].tier === tier)
                  .map((event) => {
                    const [name, hint] = lab.sounds.events[event]
                    return (
                      <Pressable
                        key={event}
                        className="dz-row"
                        data-testid={`sound-${event}`}
                        onClick={() => play(event, step, event === 'tab' ? step % 4 : undefined)}
                      >
                        <span className="dz-row-main">
                          <span>{name}</span>
                          <small className="dz-footnote sh-row-sub">{hint}</small>
                        </span>
                      </Pressable>
                    )
                  })}
              </div>
            </section>
          ))}
        </Screen>
      </div>
    </div>
  )
}
