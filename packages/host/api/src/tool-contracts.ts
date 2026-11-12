export interface ApprovalView {
  readonly approvalId: string
  readonly requestId: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
  readonly state: 'pending' | 'allowed' | 'refused' | 'cancelled'
}

export interface ApprovalStep {
  readonly key: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
}

export interface ToolSchema {
  readonly name: string
  readonly description: string
  readonly inputSchema: {
    readonly type: 'object'
    readonly properties: Readonly<Record<string, { readonly type: 'string' }>>
    readonly required: readonly string[]
    readonly additionalProperties: false
  }
}

export interface ToolResult {
  readonly isError: boolean
  readonly content: readonly { readonly type: 'text'; readonly text: string }[]
}

export interface ToolContext {
  readonly requestId: string
  readonly sessionId: string
  readonly signal: AbortSignal
  approve(step: ApprovalStep): Promise<boolean>
}

/** Prepared by Host composition at admission. The runtime receives only the bound capability. */
export interface PreparedTools {
  readonly context: string
  readonly manifest: string
  readonly schemas: readonly ToolSchema[]
  execute(name: string, args: unknown, context: ToolContext): Promise<ToolResult>
}

export interface RequestTools {
  readonly context: string
  readonly manifest: string
  readonly schemas: readonly ToolSchema[]
  call(name: string, args: unknown): Promise<ToolResult>
}
