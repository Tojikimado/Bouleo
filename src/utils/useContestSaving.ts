import { useLayoutEffect, useState } from 'react'
import type { Contest } from '../types/contest'
import { SaveCoordinator, type SaveStatus } from './saveCoordinator'

const MESSAGES = {
  idle: '',
  saving: 'Enregistrement…',
  saved: 'Modifications enregistrées.',
  error: 'Erreur : des modifications ne sont pas enregistrées.',
}

export function useContestSaving(contest: Contest | null) {
  const [saver] = useState(
    () => new SaveCoordinator((value) => window.bouleo.saveContest(value)),
  )
  const [status, setStatus] = useState<SaveStatus | 'idle'>('idle')

  useLayoutEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    saver.onChange = () => {
      clearTimeout(hideTimer)
      setStatus(saver.status)
      if (saver.status === 'saved') {
        hideTimer = setTimeout(() => setStatus('idle'), 2000)
      }
    }
    const unsubscribe = window.bouleo.onPrepareClose(async (token) => {
      try {
        await saver.flush()
        window.bouleo.finishClose(token, true)
      } catch {
        window.bouleo.finishClose(token, false)
      }
    })
    return () => {
      clearTimeout(hideTimer)
      saver.onChange = () => {}
      unsubscribe()
    }
  }, [saver])

  useLayoutEffect(() => {
    // Enregistrer la modification avant que la fenêtre puisse demander à se fermer.
    if (contest) {
      saver.save(contest)
    }
  }, [contest, saver])

  return {
    status: MESSAGES[status],
    failed: status === 'error',
    flush: () => saver.flush(),
    retry: () => {
      // Le coordinateur conserve l'erreur et le message affiché ; pas de rejet non géré.
      void saver.flush().catch(() => {})
    },
  }
}
