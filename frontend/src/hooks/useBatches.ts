import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Batches visible to the current user (faculty: assigned only) + a selected-tab state. */
export function useBatchSelection() {
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const [selected, setSelected] = useState<string>('')
  useEffect(() => {
    if (!batches.data?.length) return
    if (!batches.data.some((b) => b.id === selected)) setSelected(batches.data[0]!.id)
  }, [batches.data, selected])
  return { batches, selected, setSelected }
}
