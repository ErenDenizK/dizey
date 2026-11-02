/**
 * Mırtis, the orange tabby: rig, geometry and motion. A faithful port of the approved design rig (decision 0017).
 *
 *  - one declarative node tree per (lod, head); `createCat` builds the DOM once and `update` only sets attributes
 *    whose value changed
 *  - every node exists in every frame; appearing parts (open mouth, tongue, heart, highlights, brows, toes) fade by
 *    opacity, so nothing appears or disappears in one frame (PR-16)
 *  - colours are classes (`mt-f-*` fill, `mt-s-*` stroke) resolved by mirtis.css from `--mirtis-*` tokens
 *  - `CatMotion` runs on a virtual clock (`step`), a cue queue and a seeded blink, and asks for frames only while
 *    something moves
 *
 * Everything here is pure except `createCat` (needs a DOM) and the default frame scheduler of `CatMotion`.
 * src/character/Mirtis.tsx mounts it in React.
 */

export const REST = {
  bob: 0,
  sx: 1,
  sy: 1,
  tilt: 0,
  earL: 0,
  earR: 0,
  open: 1,
  happy: 0,
  eyeS: 1,
  lookX: 0,
  lookY: 0,
  worry: 0,
  browUp: 0,
  smile: 0.35,
  mouthO: 0,
  blush: 0.45,
  tailUp: 0.55,
  tailCurl: 0.3,
  pawL: 0,
  pawR: 0,
  poof: 0,
  droop: 0,
  heart: 0,
  sweat: 0,
}

export type PoseKey = keyof typeof REST
export type Pose = Record<PoseKey, number>
export const KEYS = Object.keys(REST) as PoseKey[]

export type MoodName = 'rest' | 'happy' | 'think' | 'oops' | 'wow' | 'proud' | 'sleepy' | 'purr'

export const MOODS: Record<MoodName, Partial<Pose>> = {
  rest: {},
  happy: {
    happy: 1,
    smile: 0.9,
    mouthO: 0.6,
    tailUp: 0.9,
    tailCurl: 0.7,
    blush: 0.75,
    earL: -4,
    earR: -4,
    tilt: 5,
    bob: -2,
  },
  think: {
    lookX: 0.7,
    lookY: -0.7,
    browUp: 0.2,
    worry: 0.15,
    smile: 0.05,
    tilt: 6,
    pawL: 1,
    tailUp: 0.4,
    tailCurl: -0.4,
    earR: 10,
  },
  oops: {
    earL: 20,
    earR: 20,
    worry: 1,
    smile: 0.1,
    sweat: 1,
    lookX: -0.4,
    lookY: 0.7,
    tailUp: 0.2,
    tailCurl: 0.8,
    tilt: -5,
    blush: 0.6,
    sy: 0.97,
    sx: 1.02,
  },
  wow: {
    eyeS: 1.36,
    browUp: 1,
    mouthO: 0.85,
    smile: 0.2,
    earL: -12,
    earR: -12,
    tailUp: 1,
    tailCurl: -1,
    poof: 1,
    bob: -5,
    pawL: 0.45,
    pawR: 0.22,
  },
  proud: {
    happy: 1,
    smile: 0.8,
    tilt: -10,
    sy: 1.06,
    sx: 1.04,
    tailUp: 1,
    tailCurl: 1,
    pawL: 0.62,
    blush: 0.8,
    bob: -3,
    earL: -6,
    earR: -6,
  },
  sleepy: {
    open: 0.32,
    droop: 1,
    smile: 0.1,
    tilt: 11,
    earL: 20,
    earR: 12,
    tailUp: 0,
    tailCurl: 1,
    blush: 0.25,
    sy: 0.9,
    sx: 1.08,
    bob: 3,
  },
  purr: {
    happy: 0.35,
    open: 0.08,
    smile: 0.7,
    blush: 1,
    tilt: 10,
    heart: 1,
    tailUp: 0.75,
    tailCurl: 1,
    earL: -2,
    earR: 8,
  },
}
export const MOOD_NAMES = Object.keys(MOODS) as MoodName[]
export const pose = (name: MoodName, extra: Partial<Pose> = {}): Pose => ({
  ...REST,
  ...MOODS[name],
  ...extra,
})

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const f = (n: number) => n.toFixed(2)

/* ------------------------------------------------------------------ node tree */

export type Lod = 'full' | 'mid' | 'small'
export type RigOptions = { lod?: Lod; head?: boolean }

export type TreeNode = {
  tag: 'g' | 'path' | 'circle' | 'ellipse'
  id: string
  attrs: Record<string, string | number>
  kids: TreeNode[]
}

const N = (
  tag: TreeNode['tag'],
  id: string,
  attrs: TreeNode['attrs'] = {},
  kids: TreeNode[] = [],
): TreeNode => ({ tag, id, attrs, kids })

/** Colour roles; each one is a `--mirtis-<role>` token (src/styles/tokens.css) painted by mirtis.css. */
export type Paint =
  | 'fur'
  | 'fur-shade'
  | 'stripe'
  | 'cream'
  | 'cream-shade'
  | 'ear-in'
  | 'nose'
  | 'ink'
  | 'blush'
  | 'tongue'
  | 'shadow'
  | 'collar'
  | 'tag'
  | 'glint'
  | 'whisker'
  | 'sweat'
  | 'sweat-edge'

const fill = (role: Paint) => `mt-f-${role}`
const stroke = (role: Paint) => `mt-s-${role}`
const both = (role: Paint) => `${fill(role)} ${stroke(role)}`

const SIDES = [
  [-1, 'L'],
  [1, 'R'],
] as const

function buildTree(lod: Lod, head: boolean): TreeNode[] {
  const small = lod === 'small'
  const mid = lod === 'mid'
  const line = small ? 1.5 : mid ? 1.2 : 1
  const ears = SIDES.map(([, s]) =>
    N('g', `ear${s}`, {}, [
      N('path', `earO${s}`, { class: both('fur'), 'stroke-width': 6, 'stroke-linejoin': 'round' }),
      N('path', `earI${s}`, { class: both('ear-in'), 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    ]),
  )
  const eyes = SIDES.flatMap(([, s]) => [
    N('path', `eye${s}`, {
      class: both('ink'),
      'stroke-width': f(1.6 * line),
      'stroke-linejoin': 'round',
    }),
    N('circle', `hiA${s}`, { class: fill('glint') }),
    N('circle', `hiB${s}`, { class: fill('glint') }),
  ])
  const brows = SIDES.map(([, s]) =>
    N('path', `brow${s}`, {
      class: stroke('stripe'),
      fill: 'none',
      'stroke-width': f(2.2 * line),
      'stroke-linecap': 'round',
    }),
  )
  const headKids: TreeNode[] = [
    ...ears,
    N('path', 'curl', { class: stroke('fur'), fill: 'none', 'stroke-width': 3.6, 'stroke-linecap': 'round' }),
    N('path', 'headP', { class: both('fur'), 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    small
      ? N('path', 'stripes', {
          class: stroke('stripe'),
          'stroke-width': 3,
          'stroke-linecap': 'round',
          opacity: 0,
        })
      : N('path', 'stripes', { class: stroke('stripe'), 'stroke-width': 2.8, 'stroke-linecap': 'round' }),
    N('ellipse', 'muzzle', { class: fill('cream'), cx: 60, rx: 9.5, ry: 6.4 }),
    N('ellipse', 'cheekL', { class: fill('blush'), rx: 4.6, ry: 2.8, cx: 42 }),
    N('ellipse', 'cheekR', { class: fill('blush'), rx: 4.6, ry: 2.8, cx: 78 }),
    ...eyes,
    ...brows,
    N('path', 'sweat', { class: `${fill('sweat')} ${stroke('sweat-edge')}`, 'stroke-width': 0.8 }),
    N('path', 'nose', { class: both('nose'), 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    N('path', 'mouthO', { class: fill('ink') }),
    N('path', 'tongue', { class: fill('tongue') }),
    N('path', 'mouth', {
      class: stroke('ink'),
      fill: 'none',
      'stroke-width': f(1.7 * line),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  ]
  if (!(small || head)) {
    headKids.push(
      N(
        'g',
        'whiskG',
        { class: stroke('whisker'), 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.8 },
        [N('path', 'whisk', { fill: 'none' })],
      ),
    )
  }
  const headG = N('g', 'head', {}, headKids)
  if (head) return [headG]
  const legs = SIDES.flatMap(([, s]) => [
    N('path', `legS${s}`, {
      class: stroke('fur-shade'),
      fill: 'none',
      'stroke-width': 11.4,
      'stroke-linecap': 'round',
    }),
    N('path', `legF${s}`, {
      class: stroke('fur'),
      fill: 'none',
      'stroke-width': 9,
      'stroke-linecap': 'round',
    }),
    N('path', `legC${s}`, {
      class: stroke('fur-shade'),
      fill: 'none',
      'stroke-width': 1.3,
      'stroke-linecap': 'round',
      pathLength: 100,
      'stroke-dasharray': '55 100',
      'stroke-dashoffset': -30,
    }),
    N('ellipse', `paw${s}`, { class: `${fill('cream')} ${stroke('fur-shade')}` }),
    N('path', `toes${s}`, {
      class: stroke('cream-shade'),
      fill: 'none',
      'stroke-width': 1.1,
      'stroke-linecap': 'round',
    }),
  ])
  return [
    N('ellipse', 'shadow', { class: fill('shadow'), cx: 62, cy: 106 }),
    N('path', 'tailA', { class: stroke('fur'), fill: 'none', 'stroke-linecap': 'round' }),
    N('path', 'tailB', {
      class: stroke('stripe'),
      pathLength: 100,
      'stroke-dasharray': '0 47 7 7 7 7 7 8 10',
      fill: 'none',
      'stroke-linecap': 'butt',
    }),
    N('g', 'body', {}, [
      N('path', 'bodyP', { class: fill('fur') }),
      N('path', 'haunch', { class: fill('fur') }),
      N('path', 'thigh', {
        class: stroke('fur-shade'),
        fill: 'none',
        'stroke-width': 1.4,
        'stroke-linecap': 'round',
      }),
      N('ellipse', 'belly', { class: fill('cream'), cx: 60, rx: 11, ry: 10 }),
    ]),
    N('path', 'collar', {
      class: stroke('collar'),
      fill: 'none',
      'stroke-width': 3.6,
      'stroke-linecap': 'round',
    }),
    N('circle', 'tag', { class: fill('tag'), cx: 60, r: 3.4 }),
    N('circle', 'tagDot', { class: fill('stripe'), cx: 60, r: 1.2, opacity: 0.6 }),
    headG,
    ...legs,
    N('path', 'heart', { class: fill('blush'), d: 'M0 3 C-6 -2 -3 -7 0 -3.4 C3 -7 6 -2 0 3Z' }),
  ]
}

/* ------------------------------------------------------------------ per-frame geometry */

/** Writes one attribute of one node. */
export type Writer = (id: string, attr: string, value: string) => void

/**
 * Writes every animated attribute through `w(id, attr, value)`. Pure: the same params give the same writes in the
 * same order, and the set of (id, attr) pairs never depends on the params.
 */
export function compute(p: Pose, lod: Lod, head: boolean, w: Writer): void {
  const small = lod === 'small'
  const mid = lod === 'mid'
  const eyeBoost = small ? 1.42 : mid ? 1.1 : 1
  const hx = 60
  const hy = 46 + p.bob * 0.9 + (1 - p.sy) * 20
  const bodyTop = 70 + p.bob
  const poof = clamp(p.poof, 0, 1)
  const hw = 29.5 + poof * 2.5
  const hh = 26 + poof * 1.5
  const ht = 25 + poof * 1.5 // dome height above the eye line
  const tuft = 3.6 + poof * 3.5

  // ears
  for (const [side, s] of SIDES) {
    const rot = s === 'L' ? p.earL : p.earR
    const bx = hx + side * 15
    const by = hy - 18
    const ty = hy - 30 - poof * 3
    const tx = hx + side * 19.5
    w(`ear${s}`, 'transform', `rotate(${f(side * rot)} ${f(bx)} ${f(by + 4)})`)
    // soft triangle: the outer edge continues the head outline, the tip is rounded by one quadratic
    w(
      `earO${s}`,
      'd',
      `M${f(hx + side * 4)} ${f(hy - 17)} L${f(tx - side * 3.4)} ${f(ty + 2.8)} Q${f(tx)} ${f(ty - 0.8)} ${f(tx + side * 1.6)} ${f(ty + 3.6)} L${f(hx + side * 23)} ${f(hy + 1)}Z`,
    )
    w(
      `earI${s}`,
      'd',
      `M${f(hx + side * 10)} ${f(hy - 16)} L${f(tx - side * 1.6)} ${f(ty + 8)} Q${f(tx)} ${f(ty + 6)} ${f(tx + side * 0.9)} ${f(ty + 9)} L${f(hx + side * 21)} ${f(hy - 11)}Z`,
    )
  }
  w('curl', 'd', `M${hx - 1} ${f(hy - hh * 0.72)} q-1 -6 4 -7.5 q4 -1 3.6 2.6`)
  w(
    'headP',
    'd',
    `M${f(hx - hw)} ${f(hy + 4)} C${f(hx - hw + 0.5)} ${f(hy - ht * 0.55)} ${f(hx - hw * 0.62)} ${f(hy - ht)} ${hx} ${f(hy - ht)} C${f(hx + hw * 0.62)} ${f(hy - ht)} ${f(hx + hw - 0.5)} ${f(hy - ht * 0.55)} ${f(hx + hw)} ${f(hy + 4)} Q${f(hx + hw + tuft)} ${f(hy + 9)} ${f(hx + hw - 3)} ${f(hy + 14)} C${f(hx + hw - 10)} ${f(hy + hh)} ${f(hx - hw + 10)} ${f(hy + hh)} ${f(hx - hw + 3)} ${f(hy + 14)} Q${f(hx - hw - tuft)} ${f(hy + 9)} ${f(hx - hw)} ${f(hy + 3)}Z`,
  )
  w(
    'stripes',
    'd',
    small
      ? `M${hx} ${f(hy - 20)} v6`
      : `M${hx - 6} ${f(hy - 19)} l1.4 5.4 M${hx} ${f(hy - 20.5)} v6.4 M${hx + 6} ${f(hy - 19)} l-1.4 5.4`,
  )
  w('muzzle', 'cy', f(hy + 13.5))
  const bl = f(clamp(p.blush, 0, 1) * 0.75)
  w('cheekL', 'cy', f(hy + 11))
  w('cheekL', 'opacity', bl)
  w('cheekR', 'cy', f(hy + 11))
  w('cheekR', 'opacity', bl)

  // eyes: one closed path that morphs round -> crescent -> line; highlights fade with the lid
  const open = clamp(p.open, 0, 1)
  const happy = clamp(p.happy, 0, 1)
  const droop = clamp(p.droop, 0, 1)
  for (const [side, s] of SIDES) {
    const ex = hx + side * 11 + p.lookX * 1.8
    const ey = hy + 2.5 + p.lookY * 1.4
    const sc = p.eyeS * eyeBoost
    const ew = 5.8 * sc
    const T = 6.9 * sc * Math.max(open, happy * 0.95) * (1 - droop * 0.97)
    const B = 6.9 * sc * open * (1 - 1.7 * happy) - happy * 0.6
    const hl = clamp(open * (1 - happy * 1.25) * (1 - droop), 0, 1)
    const k = 0.56
    w(
      `eye${s}`,
      'd',
      `M${f(ex - ew)} ${f(ey)} C${f(ex - ew)} ${f(ey - k * T)} ${f(ex - k * ew)} ${f(ey - T)} ${f(ex)} ${f(ey - T)} C${f(ex + k * ew)} ${f(ey - T)} ${f(ex + ew)} ${f(ey - k * T)} ${f(ex + ew)} ${f(ey)} C${f(ex + ew)} ${f(ey + k * B)} ${f(ex + k * ew)} ${f(ey + B)} ${f(ex)} ${f(ey + B)} C${f(ex - k * ew)} ${f(ey + B)} ${f(ex - ew)} ${f(ey + k * B)} ${f(ex - ew)} ${f(ey)}Z`,
    )
    w(`hiA${s}`, 'cx', f(ex - 1.6 * sc + p.lookX * 0.6))
    w(`hiA${s}`, 'cy', f(ey - 2.4 * sc))
    w(`hiA${s}`, 'r', f(1.9 * sc))
    w(`hiA${s}`, 'opacity', f(hl))
    w(`hiB${s}`, 'cx', f(ex + 1.5 * sc))
    w(`hiB${s}`, 'cy', f(ey + 1.6 * sc))
    w(`hiB${s}`, 'r', f(0.7 * sc))
    w(`hiB${s}`, 'opacity', f(hl * 0.8))
  }

  // brows
  const bo = f(clamp(Math.max(p.worry, p.browUp) * 1.25, 0, 1))
  for (const [side, s] of SIDES) {
    const bx = hx + side * 11
    const by = hy - 9 - p.browUp * 3.5 - p.worry
    w(`brow${s}`, 'd', `M${f(bx - 3.4)} ${f(by)} Q${f(bx)} ${f(by - 1.8)} ${f(bx + 3.4)} ${f(by)}`)
    w(`brow${s}`, 'transform', `rotate(${f(side * (p.worry * 16))} ${f(bx)} ${f(by)})`)
    w(`brow${s}`, 'opacity', bo)
  }

  // nose, mouth, open mouth + tongue
  const my = hy + 12.5
  const sm = clamp(p.smile, -1, 1)
  const mo = clamp(p.mouthO, 0, 1)
  const sw = clamp(p.sweat, 0, 1)
  w('sweat', 'd', `M${f(hx + 25)} ${f(hy - 14 + sw * 2)} q-3.4 5.2 0 7 q3.4 -1.8 0 -7Z`)
  w('sweat', 'opacity', f(sw))
  w('nose', 'd', `M${hx - 2.3} ${f(my - 2.4)} h4.6 l-2.3 2.6Z`)
  const cornerY = my + 1.6 - sm * 1.8
  w(
    'mouth',
    'd',
    `M${hx - 5.4} ${f(cornerY)} Q${hx - 2.7} ${f(my + 3.6 + sm * 0.8)} ${hx} ${f(my + 1)} Q${hx + 2.7} ${f(my + 3.6 + sm * 0.8)} ${hx + 5.4} ${f(cornerY)}`,
  )
  const openH = mo * 6.5
  const mw = 3.6 * (0.6 + mo * 0.4)
  w(
    'mouthO',
    'd',
    `M${f(hx - mw)} ${f(my + 1.6)} Q${hx} ${f(my + 1.6 + openH * 1.6)} ${f(hx + mw)} ${f(my + 1.6)}Z`,
  )
  w(
    'tongue',
    'd',
    `M${f(hx - 2.2 * mo)} ${f(my + 1.6 + openH * 0.75)} Q${hx} ${f(my + 1.6 + openH * 1.25)} ${f(hx + 2.2 * mo)} ${f(my + 1.6 + openH * 0.75)}Z`,
  )
  w('tongue', 'opacity', f(mo))
  if (!(small || head)) {
    w(
      'whisk',
      'd',
      `M${hx - 10} ${f(hy + 12)} L${hx - 24} ${f(hy + 9 - sm)} M${hx - 10} ${f(hy + 15)} L${hx - 23} ${f(hy + 16)} M${hx + 10} ${f(hy + 12)} L${hx + 24} ${f(hy + 9 - sm)} M${hx + 10} ${f(hy + 15)} L${hx + 23} ${f(hy + 16)}`,
    )
  }
  w('head', 'transform', `rotate(${f(p.tilt)} ${hx} ${f(hy + 18)})`)
  if (head) return

  // tail: cubic blending lying -> up, hook at the tip, cream tip is the same curve dashed on top
  const up = clamp(p.tailUp, 0, 1)
  const curl = clamp(p.tailCurl, -1, 1)
  const P1 = [lerp(97, 98, up), lerp(105, 97, up)] as const
  const P2 = [lerp(108, 101, up), lerp(103, 66, up)] as const
  const P3 = [lerp(107, 102, up) + curl * 5, lerp(90, 50, up) + Math.abs(curl) * 3] as const
  const tailD = `M78 99 C${f(P1[0])} ${f(P1[1])} ${f(P2[0])} ${f(P2[1])} ${f(P3[0])} ${f(P3[1])}`
  const tw = f(11 + poof * 4)
  w('tailA', 'd', tailD)
  w('tailA', 'stroke-width', tw)
  w('tailB', 'd', tailD)
  w('tailB', 'stroke-width', tw)

  const shW = 30 * p.sx * (1 - Math.max(0, -p.bob) / 40)
  w('shadow', 'rx', f(shW))
  w('shadow', 'ry', f(shW * 0.15))

  // body
  const bw = 20 * p.sx + poof * 3
  w('body', 'transform', `translate(60 104) scale(${f(p.sx)} ${f(p.sy)}) translate(-60 -104)`)
  w(
    'bodyP',
    'd',
    `M${f(60 - bw - 3)} 104 C${f(60 - bw - 6)} ${f(bodyTop + 20)} ${f(60 - bw + 5)} ${f(bodyTop)} 60 ${f(bodyTop)} C${f(60 + bw - 5)} ${f(bodyTop)} ${f(60 + bw + 6)} ${f(bodyTop + 20)} ${f(60 + bw + 3)} 104Z`,
  )
  w('belly', 'cy', f(bodyTop + 13))
  w(
    'haunch',
    'd',
    `M${f(60 - bw - 7)} 104 C${f(60 - bw - 9)} ${f(bodyTop + 22)} ${f(60 - bw + 9)} ${f(bodyTop + 14)} ${f(60 - bw + 13)} 104Z M${f(60 + bw + 7)} 104 C${f(60 + bw + 9)} ${f(bodyTop + 22)} ${f(60 + bw - 9)} ${f(bodyTop + 14)} ${f(60 + bw - 13)} 104Z`,
  )
  w(
    'thigh',
    'd',
    `M${f(60 - bw + 12)} 102.5 C${f(60 - bw + 8.5)} ${f(bodyTop + 15.5)} ${f(60 - bw - 7.6)} ${f(bodyTop + 21)} ${f(60 - bw - 6.4)} 102.5 M${f(60 + bw - 12)} 102.5 C${f(60 + bw - 8.5)} ${f(bodyTop + 15.5)} ${f(60 + bw + 7.6)} ${f(bodyTop + 21)} ${f(60 + bw + 6.4)} 102.5`,
  )
  const cy0 = hy + hh - 3
  w('collar', 'd', `M${f(hx - 15)} ${f(cy0)} Q${hx} ${f(cy0 + 7)} ${f(hx + 15)} ${f(cy0)}`)
  w('tag', 'cy', f(cy0 + 7.5))
  w('tagDot', 'cy', f(cy0 + 7.5))

  // legs: one path each, resting straight down to the toes -> raised (left to the chin, right up beside the head)
  for (const [side, s] of SIDES) {
    const t = clamp(s === 'L' ? p.pawL : p.pawR, 0, 1)
    const raise = s === 'R'
    const shx = 60 + side * 8
    const shy = bodyTop + lerp(18, 16, t)
    const tx = raise ? 60 + side * 32 : 60 + side * 6
    const ty = raise ? hy - 4 : hy + 21
    const px = lerp(60 + side * 9, tx, t)
    const py = lerp(102.5, ty, t)
    const mx = (shx + px) / 2 + side * (raise ? 6 * t : -2 * t)
    const my2 = (shy + py) / 2
    const d = `M${f(shx)} ${f(shy)} Q${f(mx)} ${f(my2)} ${f(px)} ${f(py)}`
    w(`legS${s}`, 'd', d)
    w(`legS${s}`, 'opacity', f(t)) // the outline fades in with the raise, so the resting leg matches the old drawing and nothing pops
    w(`legF${s}`, 'd', d)
    w(
      `legC${s}`,
      'd',
      `M${f(shx - side * 4.8)} ${f(shy)} Q${f(mx - side * 4.8)} ${f(my2)} ${f(px - side * 4.8)} ${f(py)}`,
    )
    w(`legC${s}`, 'opacity', f(1 - t))
    w(`paw${s}`, 'cx', f(px))
    w(`paw${s}`, 'cy', f(py))
    w(`paw${s}`, 'rx', f(lerp(6, 5.6, t)))
    w(`paw${s}`, 'ry', f(lerp(4.2, 4.4, t)))
    w(`paw${s}`, 'stroke-width', f(lerp(1.2, 1.3, t)))
    w(`toes${s}`, 'd', `M${f(px - 1.8)} ${f(py - 1.7)} v2.4 M${f(px + 1.8)} ${f(py - 1.7)} v2.4`)
    w(`toes${s}`, 'opacity', f(1 - t))
  }

  // the purr heart: always there, fades and floats
  const h = clamp(p.heart, 0, 1)
  w('heart', 'transform', `translate(86 ${f(30 - h * 8)}) scale(${f(0.7 + h * 0.6)})`)
  w('heart', 'opacity', f(h))
}

/* ------------------------------------------------------------------ DOM + string renderers */

const SVGNS = 'http://www.w3.org/2000/svg'
const treeCache = new Map<string, TreeNode[]>()

/** The node tree of a (lod, head) rig, built once. */
export function treeOf({ lod = 'full', head = false }: RigOptions = {}): TreeNode[] {
  const key = `${lod}:${head}`
  let tree = treeCache.get(key)
  if (!tree) {
    tree = buildTree(lod, head)
    treeCache.set(key, tree)
  }
  return tree
}

export const viewBoxOf = (head: boolean) => (head ? '17 -1 86 84' : '0 0 120 120')

/** Every id of a tree, in document order. */
export function nodeIds(tree: TreeNode[]): string[] {
  return tree.flatMap((n) => [n.id, ...nodeIds(n.kids)])
}

export type Cat = {
  svg: SVGSVGElement
  update: (p: Pose) => void
  nodes: Record<string, Element>
  /** Removes what createCat built. */
  dispose: () => void
}

/**
 * Builds the cat once inside `svg`. `update(pose)` only touches attributes whose value changed; nothing is ever
 * created or removed after this call. `nodes` maps a stable id to its element.
 */
export function createCat(svg: SVGSVGElement, { lod = 'full', head = false }: RigOptions = {}): Cat {
  const doc = svg.ownerDocument
  svg.setAttribute('viewBox', viewBoxOf(head))
  const nodes: Record<string, Element> = {}
  const cache: Record<string, Record<string, string>> = {}
  const make = (n: TreeNode, parent: Element) => {
    const el = doc.createElementNS(SVGNS, n.tag)
    for (const k in n.attrs) el.setAttribute(k, String(n.attrs[k]))
    nodes[n.id] = el
    cache[n.id] = {}
    parent.appendChild(el)
    for (const c of n.kids) make(c, el)
  }
  for (const n of treeOf({ lod, head })) make(n, svg)
  const w: Writer = (id, a, v) => {
    const c = cache[id]
    const el = nodes[id]
    if (c && el && c[a] !== v) {
      c[a] = v
      el.setAttribute(a, v)
    }
  }
  const update = (p: Pose) => compute(p, lod, head, w)
  update(pose('rest'))
  return { svg, update, nodes, dispose: () => svg.replaceChildren() }
}

const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/** Pure: a static SVG string with the same node list createCat builds (classes need mirtis.css or a <style>). */
export function drawCat(p: Pose, { lod = 'full', head = false }: RigOptions = {}, extra = ''): string {
  const dyn: Record<string, Record<string, string>> = {}
  compute(p, lod, head, (id, a, v) => {
    const d = dyn[id] ?? {}
    d[a] = v
    dyn[id] = d
  })
  const ser = (n: TreeNode): string => {
    let s = `<${n.tag}`
    for (const k in n.attrs) s += ` ${k}="${esc(n.attrs[k] as string | number)}"`
    const d = dyn[n.id]
    if (d) for (const k in d) s += ` ${k}="${esc(d[k] as string)}"`
    return n.kids.length ? `${s}>${n.kids.map(ser).join('')}</${n.tag}>` : `${s}/>`
  }
  return `<svg viewBox="${viewBoxOf(head)}" xmlns="${SVGNS}">${extra}${treeOf({ lod, head }).map(ser).join('')}</svg>`
}

/* ------------------------------------------------------------------ motion */

export type SpringSpec = { k: number; z: number }

export const SPRING = {
  ui: { k: 260, z: 0.8 },
  pop: { k: 420, z: 0.55 },
  soft: { k: 140, z: 1 },
  blink: { k: 900, z: 1 },
} as const satisfies Record<string, SpringSpec>

/** Limbs move a beat slower than the body, the tail trails it, ears overshoot a little (secondary motion). */
const PART: Partial<Record<PoseKey, SpringSpec>> = {
  pawL: { k: 170, z: 0.82 },
  pawR: { k: 170, z: 0.82 },
  tailUp: { k: 150, z: 0.7 },
  tailCurl: { k: 130, z: 0.7 },
  earL: { k: 230, z: 0.55 },
  earR: { k: 210, z: 0.55 },
}

/** Semi-implicit Euler stays stable up to w*h < 2; the stiffest spring (4400) has w*h = 0.55. */
export const SUBSTEP = 1 / 120
const EPS_POS = 1e-3
const EPS_VEL = 1e-2

export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type PlayName = 'rest' | 'correct' | 'wrong' | 'wow' | 'proud' | 'wake' | 'purr' | 'think' | 'sleep'

/**
 * What drives the motion in real time. The app hands it the spring engine's clock (src/character/Mirtis.tsx), so the
 * cat runs on the same virtual time as everything else and a review script can step it frame by frame.
 */
export type MotionHost = {
  /** Calls `tick(ms)` on every frame until it returns false (the cat has settled). */
  frames: (tick: (ms: number) => boolean) => void
  /** Runs `fn` once, `ms` from now. A plain timer: it must not keep the engine busy while the cat is idle. */
  later: (ms: number, fn: () => void) => void
  /** Drops every pending timer. */
  stop: () => void
}

export type MotionOptions = {
  /** Mood the cat starts in. */
  start?: MoodName
  /** Seed of the blink PRNG. */
  seed?: number
  reduced?: boolean
  /** Blink now and then (default true). */
  blink?: boolean
  /** Real-time driver; without one the caller steps (`manual`), as tests do. */
  host?: MotionHost
}

type Cue = { t: number; seq: number; fn: () => void; kind: 'user' | 'ambient' | 'blink' }

export class CatMotion {
  /** The live pose. */
  readonly v: Pose
  mood: MoodName
  reduced: boolean
  /** Virtual seconds. */
  now = 0
  /** Virtual time of the last public set()/play(); settle time is measured from here. */
  lastEventAt = 0
  readonly stats = { blinks: 0, frames: 0 }
  private readonly vel: Pose
  private readonly target: Pose
  private readonly spring: Record<PoseKey, SpringSpec>
  private cues: Cue[] = []
  private seq = 0
  private readonly rand: () => number
  private active = false
  private gen = 0
  private destroyed = false
  private readonly host: MotionHost | null
  private readonly onFrame: (v: Pose) => void

  constructor(onFrame: (v: Pose) => void, opts: MotionOptions = {}) {
    const { start = 'rest', seed = 1, reduced = false, blink = true } = opts
    this.onFrame = onFrame
    this.host = opts.host ?? null
    this.v = pose(start)
    this.vel = { ...REST }
    for (const k of KEYS) this.vel[k] = 0
    if (reduced) this.v.bob = 0
    this.target = { ...this.v }
    this.spring = {} as Record<PoseKey, SpringSpec>
    for (const k of KEYS) this.spring[k] = SPRING.ui
    this.mood = start
    this.reduced = reduced
    this.rand = mulberry32(seed)
    if (blink) {
      this.scheduleBlink()
      this.sleep() // idle from the start: the first blink is a timer, not a frame
    }
  }

  /* ---- targets ---- */
  set(values: Partial<Pose>, spring: SpringSpec = SPRING.ui): void {
    this.apply(values, spring)
    this.lastEventAt = this.now
    this.kick()
  }

  private apply(values: Partial<Pose>, spring: SpringSpec): void {
    // Reduced motion shortens motion and never cuts it: stiffer, critically damped, no bob.
    const sp = this.reduced ? { k: spring.k * 2.2, z: 1 } : spring
    for (const k of Object.keys(values) as PoseKey[]) {
      this.target[k] = this.reduced && k === 'bob' ? 0 : (values[k] as number)
      const part = PART[k]
      this.spring[k] =
        part && spring !== SPRING.blink ? { k: Math.min(sp.k, part.k), z: this.reduced ? 1 : part.z } : sp
    }
  }

  to(mood: MoodName, spring?: SpringSpec): void {
    this.mood = mood
    this.set(pose(mood), spring)
  }

  setReduced(on: boolean): void {
    this.reduced = on
    if (on && this.target.bob !== 0) this.set({ bob: 0 }, SPRING.ui)
  }

  /* ---- cue queue on virtual time ---- */
  private cue(sec: number, fn: () => void, kind: Cue['kind']): void {
    const c: Cue = { t: this.now + sec, seq: this.seq++, fn, kind }
    let i = this.cues.length
    while (i > 0) {
      const prev = this.cues[i - 1] as Cue
      if (prev.t > c.t || (prev.t === c.t && prev.seq > c.seq)) i--
      else break
    }
    this.cues.splice(i, 0, c)
  }

  after(ms: number, fn: () => void): void {
    this.cue((ms / 1000) * (this.reduced ? 0.5 : 1), fn, 'user')
    this.kick()
  }

  clear(): void {
    this.cues = this.cues.filter((c) => c.kind !== 'user')
  }

  private fire(): void {
    while (this.cues.length && (this.cues[0] as Cue).t <= this.now + 1e-9) {
      ;(this.cues.shift() as Cue).fn()
    }
  }

  /* ---- blink: seeded, scheduled as cues, never a loop ---- */
  private scheduleBlink(): void {
    this.cue(
      2.6 + this.rand() * 3.6,
      () => {
        if (this.target.open > 0.5 && this.target.happy < 0.5) {
          const back = this.target.open
          this.stats.blinks++
          this.apply({ open: 0.02 }, SPRING.blink)
          this.cue(
            0.09,
            () => {
              if (this.target.open < 0.1) this.apply({ open: back }, { k: 380, z: 1 })
            },
            'blink',
          )
        }
        this.scheduleBlink()
      },
      'ambient',
    )
  }

  /* ---- integration ---- */
  isSettled(): boolean {
    for (const c of this.cues) if (c.kind !== 'ambient') return false
    for (const k of KEYS) {
      if (Math.abs(this.target[k] - this.v[k]) > EPS_POS || Math.abs(this.vel[k]) > EPS_VEL) return false
    }
    return true
  }

  /** Advances the virtual clock by dt seconds (substepped), then emits one frame. */
  step(dt: number): void {
    const n = Math.max(1, Math.ceil(dt / SUBSTEP - 1e-9))
    const h = dt / n
    for (let i = 0; i < n; i++) {
      this.now += h
      this.fire()
      for (const key of KEYS) {
        const sp = this.spring[key]
        const a = sp.k * (this.target[key] - this.v[key]) - 2 * Math.sqrt(sp.k) * sp.z * this.vel[key]
        this.vel[key] += a * h
        this.v[key] += this.vel[key] * h
      }
    }
    if (this.isSettled()) {
      for (const k of KEYS) {
        this.v[k] = this.target[k]
        this.vel[k] = 0
      }
    }
    this.stats.frames++
    this.onFrame(this.v)
  }

  /* ---- real-time driver: frames only while something moves ---- */
  private kick(): void {
    if (!this.host || this.active || this.destroyed) return
    this.gen++ // a pending blink timer is stale now: the frames will reach it
    this.active = true
    this.host.frames((ms) => this.tick(ms))
  }

  private tick(ms: number): boolean {
    if (this.destroyed) return false
    this.step(Math.min(0.05, Math.max(0, ms) / 1000))
    if (!this.isSettled()) return true
    this.active = false
    this.sleep()
    return false
  }

  /** Settled: no frames. The next blink is a plain timer; virtual time moves forward to it when it fires. */
  private sleep(): void {
    const next = this.cues.find((c) => c.kind === 'ambient')
    if (!next || !this.host || this.destroyed) return
    const mine = ++this.gen
    this.host.later(Math.max(0, next.t - this.now) * 1000, () => {
      if (mine !== this.gen || this.destroyed) return
      this.now = Math.max(this.now, next.t)
      this.fire()
      if (this.isSettled()) this.sleep()
      else this.kick()
    })
  }

  /** The host ended the frames early (the engine landed everything): jump to where the cat was going. */
  land(): void {
    this.active = false
    for (let guard = 0; guard < 200; guard++) {
      const next = this.cues.find((c) => c.kind !== 'ambient')
      if (!next) break
      this.cues.splice(this.cues.indexOf(next), 1)
      this.now = Math.max(this.now, next.t)
      next.fn()
    }
    for (const k of KEYS) {
      this.v[k] = this.target[k]
      this.vel[k] = 0
    }
    this.onFrame(this.v)
    this.sleep()
  }

  destroy(): void {
    this.destroyed = true
    this.gen++
    this.cues = []
    this.host?.stop()
  }

  /* ---- the reactions ---- */
  play(name: PlayName): void {
    this.clear()
    this.lastEventAt = this.now
    switch (name) {
      case 'correct':
        this.set({ sy: 0.9, sx: 1.06, open: 0.8 }, SPRING.ui)
        this.after(120, () => this.set(pose('happy', { bob: -5.5, sy: 1.06, sx: 0.96 }), SPRING.pop))
        this.after(330, () => this.set({ bob: 0, sy: 0.93, sx: 1.05 }, SPRING.pop))
        this.after(470, () => this.to('happy', SPRING.ui))
        break
      case 'wrong':
        this.set(pose('oops'), SPRING.ui)
        this.after(1100, () =>
          this.set(pose('rest', { smile: 0.45, worry: 0.25, earL: 6, earR: 6 }), SPRING.soft),
        )
        break
      case 'wow':
        this.set({ sy: 0.94, open: 1, happy: 0 }, SPRING.ui)
        this.after(90, () => this.set(pose('wow'), SPRING.pop))
        this.after(1200, () => this.set(pose('happy', { poof: 0.2 }), SPRING.soft))
        this.after(1700, () => this.set({ poof: 0 }, SPRING.soft))
        break
      case 'proud':
        this.set({ sy: 0.92 }, SPRING.ui)
        this.after(120, () => this.set(pose('proud'), SPRING.pop))
        break
      case 'wake':
        this.set(pose('sleepy'), { k: 2000, z: 1 })
        this.after(500, () =>
          this.set(
            { sy: 1.08, sx: 0.95, bob: -2, mouthO: 1, open: 0.15, smile: 0.1, earL: -8, earR: -8, tilt: 0 },
            SPRING.soft,
          ),
        )
        this.after(1300, () => this.set({ mouthO: 0, sy: 1, sx: 1, open: 1, bob: 0 }, SPRING.ui))
        this.after(1650, () => this.to('rest', SPRING.ui))
        break
      case 'purr':
        this.set(pose('purr'), SPRING.soft)
        this.after(1600, () => this.to('rest', SPRING.soft))
        break
      case 'think':
        this.to('think', SPRING.ui)
        break
      case 'sleep':
        this.to('sleepy', SPRING.soft)
        break
      default:
        this.to('rest', SPRING.ui)
    }
  }
}

/* ------------------------------------------------------------------ app moods */

/** The moods the app speaks in (Birim's vocabulary plus the cat's own). */
export type MirtisMood = 'rest' | 'happy' | 'think' | 'oops' | 'wow' | 'sleep' | 'proud' | 'purr'

/** Which storyboard an app mood plays. */
export const PLAY_OF: Record<MirtisMood, PlayName> = {
  rest: 'rest',
  happy: 'correct',
  oops: 'wrong',
  wow: 'wow',
  think: 'think',
  sleep: 'sleep',
  proud: 'proud',
  purr: 'purr',
}

export type MirtisSize = 'answer' | 'path' | 'profile' | 'hero'

/** Rig per size: under 48 px the small head bust, the profile a full-detail bust, the hero the full body. */
export const RIG_OF: Record<MirtisSize, Required<RigOptions>> = {
  answer: { lod: 'small', head: true },
  path: { lod: 'small', head: true },
  profile: { lod: 'full', head: true },
  hero: { lod: 'full', head: false },
}
