import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useAuthStore, type PlanTier } from '@/lib/store'
import { canDo, meetsplan, PLAN_LABELS } from '@/lib/permissions'

interface PermissionGateProps {
  module: string
  action: string
  minPlan?: PlanTier
  /** When blocked, render a lock badge instead of hiding entirely */
  showLock?: boolean
  /** Custom fallback node */
  fallback?: ReactNode
  children: ReactNode
}

export default function PermissionGate({
  module,
  action,
  minPlan,
  showLock = false,
  fallback,
  children,
}: PermissionGateProps) {
  const { role, plan, isGodAdmin } = useAuthStore()

  if (isGodAdmin) return <>{children}</>

  const planBlocked = minPlan ? !meetsplan(plan, minPlan) : false
  const roleBlocked = !canDo(role, plan, module, action)

  if (!planBlocked && !roleBlocked) return <>{children}</>

  if (fallback) return <>{fallback}</>

  if (showLock) {
    const requiredPlan = minPlan ? PLAN_LABELS[minPlan] : null
    return (
      <div className="relative inline-flex items-center gap-1 opacity-50 cursor-not-allowed select-none" title={requiredPlan ? `Requires ${requiredPlan} plan` : 'Permission denied'}>
        {children}
        <Lock className="w-3 h-3 text-dark-400 absolute -top-1 -right-1" />
      </div>
    )
  }

  return null
}
