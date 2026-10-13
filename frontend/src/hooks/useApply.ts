import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Drive } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'

export function useApply() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (drive: Drive) => api.apply(drive.id),
    onSuccess: (_app, drive) => {
      toast(`Applied to ${drive.company_name}`)
      qc.invalidateQueries({ queryKey: ['drives'] })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
