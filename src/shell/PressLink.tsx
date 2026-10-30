import { createLink, type LinkComponent } from '@tanstack/react-router'
import { type AnchorHTMLAttributes, forwardRef, useImperativeHandle, useRef } from 'react'
import { usePress } from '../ui/Pressable'

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { pressClass?: string }

/** A router link with Dizey's press physics (the link version of src/ui Pressable). */
const PressAnchor = forwardRef<HTMLAnchorElement, AnchorProps>(function PressAnchor(
  { className = '', pressClass = 'dz-pressable', ...rest },
  forwarded,
) {
  const ref = useRef<HTMLAnchorElement>(null)
  useImperativeHandle(forwarded, () => ref.current as HTMLAnchorElement)
  usePress(ref)
  return <a ref={ref} className={`${pressClass} ${className}`} {...rest} />
})

const Created = createLink(PressAnchor)

export const PressLink: LinkComponent<typeof PressAnchor> = (props) => <Created {...props} />
