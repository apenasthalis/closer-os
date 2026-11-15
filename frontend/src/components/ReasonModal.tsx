import { useState } from 'react'
import { LOSS_REASONS } from '../lib/format'
import Modal from './Modal'

export default function ReasonModal({ stage, leadName, onClose, onConfirm }: {
  stage: 'loss' | 'desqualificado'
  leadName: string
  onClose: () => void
  onConfirm: (reason: string, note: string) => void
}) {
  const [reason, setReason] = useState(LOSS_REASONS[0])
  const [note, setNote] = useState('')
  return (
    <Modal
      title={stage === 'loss' ? 'Mover para Loss' : 'Desqualificar lead'}
      sub={leadName}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={() => onConfirm(reason, note)}>Confirmar</button></>}
    >
      <div className="field"><label>Motivo</label><select className="in" value={reason} onChange={e => setReason(e.target.value)}>{LOSS_REASONS.map(r => <option key={r}>{r}</option>)}</select></div>
      <div className="field"><label>Nota explicativa (opcional)</label><textarea className="in" rows={3} value={note} onChange={e => setNote(e.target.value)} /></div>
    </Modal>
  )
}
