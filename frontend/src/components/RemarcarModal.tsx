import { useState } from 'react'
import Modal from './Modal'

function defaultCallAt() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function RemarcarModal({ leadName, onClose, onConfirm }: {
  leadName: string
  onClose: () => void
  onConfirm: (callAt: string) => void
}) {
  const [callAt, setCallAt] = useState(defaultCallAt())
  return (
    <Modal
      title="Remarcar call"
      sub={leadName}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!callAt} onClick={() => onConfirm(callAt)}>Remarcar</button></>}
    >
      <div className="field">
        <label>Nova data e hora da call</label>
        <input className="in" type="datetime-local" value={callAt} onChange={e => setCallAt(e.target.value)} />
      </div>
    </Modal>
  )
}
