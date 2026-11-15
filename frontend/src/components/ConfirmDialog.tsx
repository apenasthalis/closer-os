import Modal from './Modal'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, busy = false, onClose, onConfirm }: {
  title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean; onClose: () => void; onConfirm: () => void
}) {
  return (
    <Modal title={title} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className={`btn ${danger ? 'danger' : 'primary'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Processando...' : confirmLabel}</button></>}>
      <p className="sub">{message}</p>
    </Modal>
  )
}
