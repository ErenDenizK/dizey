import {
  type ButtonHTMLAttributes,
  forwardRef,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { attachPress } from '../engine/press'

/** Press physics on any element ref (see src/engine/press.ts). */
export function usePress(ref: RefObject<HTMLElement | null>, disabled = false): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    return attachPress(element, { disabled: () => disabled })
  }, [ref, disabled])
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { pressClass?: string }

/** A button with Dizey's press physics. All pressable things in the app are built from this. */
export const Pressable = forwardRef<HTMLButtonElement, ButtonProps>(function Pressable(
  { className = '', pressClass = 'dz-pressable', type = 'button', ...rest },
  forwarded,
) {
  const ref = useRef<HTMLButtonElement>(null)
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement)
  usePress(ref, rest.disabled === true)
  return <button ref={ref} type={type} className={`${pressClass} ${className}`} {...rest} />
})
