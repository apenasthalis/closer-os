import { useEffect } from 'react'

export default function Modal({ title, sub, children, footer, onClose, wide = false }: {
  title?: React.ReactNode
  sub?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="mback" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mdlg" style={{ maxWidth: wide ? 860 : 640 }}>
        {title && <div className="mh"><div><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div><button className="btn sm" onClick={onClose}>Fechar</button></div>}
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  )
}
