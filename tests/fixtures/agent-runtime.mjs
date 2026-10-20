/** Test boundary only: deterministic model events, never an Agent Loop substitute. */
export class ScriptedModel {
  requests = [];
  constructor(script) { this.script = [...script]; }
  async *stream(request) {
    this.requests.push(request);
    const response = this.script.shift();
    if (!response) throw new Error('Fake model script exhausted');
    if (response instanceof Error) throw response;
    for (const event of response) {
      request.signal.throwIfAborted();
      yield event;
    }
  }
}

export const textReply = text => [{ type: 'text-delta', text }, { type: 'finish', reason: 'stop' }];
export const callReply = (...calls) => [
  ...calls.map(call => ({ type: 'tool-call', call })),
  { type: 'finish', reason: 'tool-calls' },
];

export function noopTool() {
  return {
    name: 'noop', description: 'Return the supplied string without side effects.',
    parameters: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'], additionalProperties: false },
    async execute(args) { return args.value; },
  };
}
