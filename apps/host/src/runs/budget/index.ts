import type { RunBudgetLimits, RunBudgetReason, RunBudgetTracker, RunUsage } from '../ports.ts'

function exceededReason(limits: RunBudgetLimits, total: RunUsage): RunBudgetReason | undefined {
  if (limits.modelCalls !== undefined && total.modelCalls > limits.modelCalls) return 'model-calls'
  if (limits.inputTokens !== undefined && (total.inputTokens ?? 0) > limits.inputTokens) return 'input-tokens'
  if (limits.outputTokens !== undefined && (total.outputTokens ?? 0) > limits.outputTokens) return 'output-tokens'
  return undefined
}

export function createRunBudget(
  limits?: RunBudgetLimits,
  onExceeded?: (reason: RunBudgetReason) => void,
): RunBudgetTracker {
  let current: RunUsage = { modelCalls: 0 }
  let exceeded: RunBudgetReason | undefined
  return {
    record(total: RunUsage): void {
      current = total
      if (exceeded) return
      const reason = exceededReason(limits ?? {}, total)
      if (!reason) return
      exceeded = reason
      onExceeded?.(reason)
    },
    latest(): RunUsage {
      return current
    },
    exceeded(): RunBudgetReason | undefined {
      return exceeded
    },
  }
}
