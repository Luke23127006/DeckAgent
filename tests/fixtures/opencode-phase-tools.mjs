// Host-authored expectations, independent of the adapter's permission builder.
export const phaseTools = [
  {
    name: 'Vietnamese explicit slide-two edit',
    deck: true,
    request: { input: 'Chỉ sửa slide 2: hiển thị dòng chữ TEST_SLIDE_2.' },
    tools: ['read_file', 'write_file', 'read_slide', 'publish_slide'],
  },
  {
    name: 'existing scope guard blocks addition and negation wording',
    deck: true,
    request: {
      input:
        'Chỉ sửa slide 2: thêm dòng chữ TEST_SLIDE_2 vào nội dung hiển thị. Giữ nguyên toàn bộ slide 1. Không tạo thêm slide.',
    },
    tools: ['read_file', 'read_slide', 'ask_clarification'],
  },
  {
    name: 'ordinary conversation',
    request: { input: 'Explain recycling' },
    tools: ['read_file', 'write_file', 'propose_outline', 'ask_clarification'],
  },
  {
    name: 'outline proposal',
    request: { input: 'Propose two slides', presentation: true },
    tools: ['read_file', 'propose_outline', 'ask_clarification'],
  },
  {
    name: 'scoped publication',
    deck: true,
    request: { input: 'Continue unfinished slides' },
    tools: ['read_file', 'write_file', 'read_slide', 'publish_slide'],
  },
  {
    name: 'unresolved edit scope',
    deck: true,
    request: { input: 'Make it better' },
    tools: ['read_file', 'read_slide', 'ask_clarification', 'resolve_slide_scope'],
  },
]
