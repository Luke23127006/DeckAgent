import type { OutlineProposal } from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'

type OutlineSlide = OutlineProposal['slides'][number]
type ImageReview = NonNullable<OutlineProposal['imageReview']>[number]
type ImageAttempt = NonNullable<ImageReview['attempts']>[number]
type WebImageBlock = Extract<NonNullable<OutlineSlide['blocks']>[number], { readonly kind: 'web-image' }>

export type ImagePreview = (sessionId: string, outlineId: string, needId: string) => Promise<Blob>

export interface ImageReviewContext {
  readonly outlineId: string
  readonly sessionId: string | undefined
  readonly preview: ImagePreview | undefined
  readonly currentEpoch: () => number
  readonly imageUrls: Set<string>
  readonly revise: (text?: string) => void
}

const imageFailure = (code?: string): string =>
  ({
    RESEARCH_IMAGE_LICENSE_REQUIRED: 'Chưa xác minh được giấy phép cho phép sử dụng ảnh.',
    RESEARCH_IMAGE_LICENSE_UNSUPPORTED: 'Giấy phép của ảnh chưa được hỗ trợ cho deck này.',
    RESEARCH_IMAGE_AUTHOR_REQUIRED: 'Ảnh yêu cầu ghi công nhưng chưa xác định được tác giả.',
    IMAGE_PREPARED: 'Đã chuẩn bị ảnh.',
    RESEARCH_IMAGE_SOURCE_UNRESOLVED: 'Chưa tìm được trang nguồn của ảnh.',
    RESEARCH_IMAGE_SOURCE_BLOCKED: 'Website chặn truy cập để kiểm tra nguồn ảnh.',
    RESEARCH_IMAGE_SOURCE_HTTP: 'Trang nguồn ảnh trả về lỗi HTTP.',
    RESEARCH_IMAGE_NETWORK: 'Không kết nối được tới nguồn ảnh.',
    RESEARCH_IMAGE_RESPONSE_TOO_LARGE: 'Dữ liệu nguồn ảnh vượt giới hạn tải.',
    RESEARCH_IMAGE_CONTENT_TYPE: 'Nguồn trả về định dạng không được hỗ trợ.',
    RESEARCH_IMAGE_TIMEOUT: 'Hết thời gian kiểm tra hoặc tải ảnh.',
    RESEARCH_IMAGE_NORMALIZATION_LIMIT: 'Ảnh vượt giới hạn xử lý. Chọn phiên bản nhỏ hơn hoặc ảnh khác.',
    RESEARCH_IMAGE_DECODE_FAILED: 'Không đọc được dữ liệu ảnh đã tải. Cần chọn ảnh khác.',
    RESEARCH_IMAGE_SELECTION_BUSY: 'Vị trí này đang được chọn ảnh. Chờ lượt đang chạy kết thúc.',
    RESEARCH_IMAGE_SELECTION_STALE: 'Yêu cầu ảnh đã thay đổi; cần chọn từ kết quả tìm mới.',
    RESEARCH_IMAGE_DUPLICATE: 'Ảnh trùng với vị trí ảnh khác; cần chọn ảnh khác.',
    RESEARCH_IMAGE_NO_MATCH: 'Chưa tìm được ảnh phù hợp với yêu cầu.',
    RESEARCH_IMAGE_SELECTION_REQUIRED: 'Chưa chọn được ảnh phù hợp.',
    RESEARCH_IMAGE_BUDGET: 'Đã đạt giới hạn tìm hoặc chọn ảnh của yêu cầu này.',
    RESEARCH_KEY_UNAVAILABLE: 'Chưa có API key Tavily. Thêm key trong Cài đặt hoặc chọn nguồn Commons.',
    RESEARCH_QUOTA_EXHAUSTED: 'Tavily đã hết quota miễn phí. Đổi nguồn hoặc thử lại khi có quota.',
    RESEARCH_FREE_ONLY: 'Cấu hình Tavily chưa đáp ứng chế độ chỉ miễn phí.',
    RESEARCH_KEY_REJECTED: 'Tavily từ chối API key. Kiểm tra key trong Cài đặt.',
    RESEARCH_UNAVAILABLE: 'Không kết nối được Tavily. Kiểm tra cấu hình, kết nối hoặc chọn nguồn Commons.',
  })[code ?? ''] ?? 'Chưa chuẩn bị được ảnh. Đổi truy vấn hoặc cung cấp ảnh đính kèm.'

function renderImageAudit(attempts: readonly ImageAttempt[]): HTMLElement {
  const audit = element('details')
  audit.append(element('summary', `Lịch sử kiểm tra ảnh (${attempts.length} lần)`))
  for (const attempt of attempts) {
    audit.append(element('p', imageFailure(attempt.code)))
    for (const check of attempt.checks)
      audit.append(
        element(
          'p',
          `${new URL(check.sourceUrl).hostname}: ${imageFailure(check.code)}${check.httpStatus ? ` (HTTP ${check.httpStatus})` : ''}`,
        ),
      )
  }
  return audit
}

function attachImagePreview(
  detail: HTMLDetailsElement,
  figure: HTMLElement,
  alt: string,
  needId: string,
  context: ImageReviewContext,
): void {
  const { preview, sessionId, outlineId, currentEpoch, imageUrls } = context
  if (!preview || sessionId === undefined) return
  const image = element('img')
  image.alt = alt
  const epoch = currentEpoch()
  let loaded = false
  detail.addEventListener('toggle', () => {
    if (!detail.open || loaded) return
    loaded = true
    void preview(sessionId, outlineId, needId)
      .then(blob => {
        if (epoch !== currentEpoch()) return
        const url = URL.createObjectURL(blob)
        imageUrls.add(url)
        image.src = url
      })
      .catch(() => {
        image.remove()
        figure.append(element('p', 'Không đọc được ảnh đã lưu. Sửa Outline để chọn lại ảnh.'))
      })
  })
  figure.append(image)
}

export function renderImageReviewFigure(options: {
  readonly review: ImageReview
  readonly block: WebImageBlock
  readonly detail: HTMLDetailsElement
  readonly slideIndex: number
  readonly blockIndex: number
  readonly slideTitle: string
  readonly context: ImageReviewContext
}): { readonly figure: HTMLElement; readonly replaceButton: HTMLButtonElement } {
  const { review, block, detail, slideIndex, blockIndex, slideTitle, context } = options
  const figure = element('figure', undefined, 'outline-image-review')
  if (review.status === 'prepared')
    attachImagePreview(
      detail,
      figure,
      review.selection?.description || block.intent?.subject || block.query,
      review.needId,
      context,
    )
  figure.append(
    element(
      'figcaption',
      review.status === 'prepared'
        ? 'Ảnh đã chuẩn bị · cần bạn duyệt trước khi tạo slide'
        : `${imageFailure(review.failure)}${review.required ? ' Cần có ảnh trước khi xác nhận.' : ' Slide sẽ bỏ phần ảnh này.'}`,
    ),
  )
  if (review.selection)
    figure.append(
      element('p', `Lý do chọn: ${review.selection.reason}`),
      element('p', 'Đánh giá dựa trên mô tả nguồn; chưa kiểm chứng trực quan bằng model.'),
    )
  if (review.credit) {
    const credit = review.credit
    const link = element('a', 'Xem trang nguồn')
    link.href = credit.url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    figure.append(element('p', `${credit.author} · ${credit.license}`), link)
    if (credit.licenseUrl.startsWith('https://')) {
      const license = element('a', 'Điều kiện sử dụng ảnh')
      license.href = credit.licenseUrl
      license.target = '_blank'
      license.rel = 'noopener noreferrer'
      figure.append(document.createTextNode(' · '), license)
    }
  }
  if (review.attempts?.length) figure.append(renderImageAudit(review.attempts))
  const replaceButton = button('Tìm ảnh khác', () =>
    context.revise(
      `Thay ảnh tại slide ${slideIndex + 1} “${slideTitle}”, vị trí ảnh ${blockIndex + 1}. Giữ nội dung và các vị trí khác; đặt replace:true cho vị trí này và tìm ảnh khác phù hợp với vai trò.`,
    ),
  )
  figure.append(replaceButton)
  return { figure, replaceButton }
}
