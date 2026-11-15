import { create } from 'zustand'

type ToastState = {
  message: string | null
  kind: 'ok' | 'err'
  show: (message: string, kind?: 'ok' | 'err') => void
  clear: () => void
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastState>((set) => ({
  message: null,
  kind: 'ok',
  show: (message, kind = 'ok') => {
    if (timer) clearTimeout(timer)
    set({ message, kind })
    timer = setTimeout(() => set({ message: null }), 3200)
  },
  clear: () => set({ message: null }),
}))

export const showToast = (message: string, kind: 'ok' | 'err' = 'ok') => useToast.getState().show(message, kind)
