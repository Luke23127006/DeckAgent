import { readFile } from 'node:fs/promises'
import { resolveDesign } from '../../packages/presentation/design/lib/index.js'

const image = (id, assetId, caption) => ({ id, kind: 'image', assetId, caption })
const bullets = items => ({ id: 'points', kind: 'bullets', items })

export async function layoutFixtures({ imagePaths = [] } = {}) {
  const bytes = await Promise.all(
    [0, 1].map(i =>
      readFile(
        imagePaths[i] ?? new URL(`../../tests/fixtures/attachments/sample.${i ? 'jpg' : 'png'}`, import.meta.url),
      ),
    ),
  )
  const assets = bytes.map((data, i) => ({ assetId: `asset-${i}`, byteSize: data.length, bytes: data }))
  const cases = [
    [
      'cover',
      'Môi trường và cuộc sống',
      [{ id: 'subtitle', kind: 'subtitle', text: 'Hiểu những điều gần gũi và bắt đầu từ hành động mỗi ngày' }],
    ],
    [
      'section',
      'Vì sao cần bảo vệ môi trường?',
      [
        { id: 'lead', kind: 'lead', text: 'Bảo vệ môi trường là bảo vệ cuộc sống.' },
        {
          id: 'body',
          kind: 'text',
          text: 'Không khí, nước, đất và các hệ sinh thái gắn với sinh hoạt mỗi ngày. Mỗi người có thể góp phần giữ gìn môi trường bằng những việc làm cụ thể.',
        },
      ],
    ],
    [
      'title-body',
      'Môi trường là gì?',
      [
        bullets([
          'Các yếu tố tự nhiên và nhân tạo bao quanh con người.',
          'Không gian sống của con người và các loài sinh vật.',
          'Những điều kiện gắn với sinh hoạt, học tập và phát triển.',
        ]),
      ],
    ],
    [
      'two-column',
      'Hai góc nhìn về môi trường',
      [
        {
          id: 'columns',
          kind: 'columns',
          columns: [
            {
              bullets: [
                'Môi trường tự nhiên có đất, nước, không khí và sinh vật.',
                'Các thành phần có mối quan hệ với nhau.',
              ],
            },
            {
              bullets: [
                'Môi trường sống còn có nhà ở, trường học và đường sá.',
                'Con người có thể gìn giữ hoặc làm thay đổi môi trường.',
              ],
            },
          ],
        },
      ],
    ],
    [
      'key-figures',
      'Ba nhóm hành động — ví dụ trình bày',
      [
        {
          id: 'metrics',
          kind: 'metrics',
          items: [
            { value: '01', label: 'Giảm rác thải' },
            { value: '02', label: 'Tiết kiệm tài nguyên' },
            { value: '03', label: 'Chăm sóc cây xanh' },
          ],
        },
        {
          id: 'note',
          kind: 'source-note',
          text: 'Các số chỉ đánh thứ tự nhóm hành động, không phải số liệu thống kê.',
        },
      ],
    ],
    [
      'image-text',
      'Rừng',
      [
        bullets(['Rừng giữ đất, giữ nước và điều hòa khí hậu.', 'Rừng là nơi sinh sống của nhiều loài sinh vật.']),
        image('forest', 'asset-0', 'Rừng xanh và sự sống'),
      ],
    ],
    [
      'image-pair',
      'Rừng và đại dương',
      [
        image('forest', 'asset-0', 'Rừng — hệ sinh thái trên cạn'),
        image('ocean', 'asset-1', 'Đại dương — hệ sinh thái biển'),
        bullets(['Mỗi hệ sinh thái có vai trò riêng trong môi trường sống.']),
      ],
    ],
  ]
  return cases.map(([layoutId, title, nodes]) => ({
    name: layoutId,
    design: resolveDesign({ template: { id: 'html-basic', version: 3 } }),
    layoutId,
    document: { schemaVersion: 1, slideId: layoutId, title, layoutIntent: layoutId, nodes, provenance: [] },
    assets: assets.filter(a => nodes.some(n => n.kind === 'image' && n.assetId === a.assetId)),
  }))
}
