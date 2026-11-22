import type { OutlineImageReview, ImageCredit, ImageSelection } from '@deckagent/deck'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const string = (v: unknown): v is string => typeof v === 'string' && v.length <= 2048 && v.isWellFormed()
const invalid = (): never => {
  throw new Error('INVALID_RESPONSE')
}
const url = (v: unknown): v is string => {
  if (!string(v)) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && !u.username && !u.password
  } catch {
    return false
  }
}
function credit(v: unknown): ImageCredit {
  if (!object(v) || !url(v.url) || !string(v.author) || !string(v.licenseUrl) || !string(v.retrievedAt))
    return invalid()
  const license = (['public-domain', 'CC0', 'CC BY', 'unknown'] as const).find(k => k === v.license)
  if (!license || v.unknownLicense !== (license === 'unknown')) return invalid()
  return {
    url: v.url,
    author: v.author,
    license,
    licenseUrl: v.licenseUrl,
    retrievedAt: v.retrievedAt,
    unknownLicense: license === 'unknown',
  }
}
function selection(v: unknown): ImageSelection {
  if (
    !object(v) ||
    !url(v.imageUrl) ||
    !string(v.query) ||
    !string(v.description) ||
    !string(v.reason) ||
    v.evidence !== 'metadata' ||
    v.policy !== 'web-images-v1' ||
    (v.provider !== 'tavily' && v.provider !== 'commons')
  )
    return invalid()
  return {
    imageUrl: v.imageUrl,
    query: v.query,
    description: v.description,
    reason: v.reason,
    evidence: v.evidence,
    policy: v.policy,
    provider: v.provider,
  }
}
export function decodeImageReview(v: unknown): readonly OutlineImageReview[] {
  if (!Array.isArray(v) || v.length > 32) return invalid()
  return v.map(item => {
    if (
      !object(item) ||
      typeof item.needId !== 'string' ||
      !/^need-[a-f0-9]{64}$/.test(item.needId) ||
      typeof item.slideIndex !== 'number' ||
      !Number.isSafeInteger(item.slideIndex) ||
      item.slideIndex < 0 ||
      typeof item.blockIndex !== 'number' ||
      !Number.isSafeInteger(item.blockIndex) ||
      item.blockIndex < 0 ||
      typeof item.required !== 'boolean' ||
      (item.status !== 'prepared' && item.status !== 'unavailable') ||
      (item.failure !== undefined && !string(item.failure)) ||
      (item.digest !== undefined && (typeof item.digest !== 'string' || !/^[a-f0-9]{64}$/.test(item.digest)))
    )
      return invalid()
    return {
      needId: item.needId,
      slideIndex: item.slideIndex,
      blockIndex: item.blockIndex,
      required: item.required,
      status: item.status,
      ...(typeof item.digest === 'string' ? { digest: item.digest } : {}),
      ...(typeof item.failure === 'string' ? { failure: item.failure } : {}),
      ...(item.credit === undefined ? {} : { credit: credit(item.credit) }),
      ...(item.selection === undefined ? {} : { selection: selection(item.selection) }),
    }
  })
}

export const imageFailure = (code?: string): string =>
  ({
    RESEARCH_IMAGE_LICENSE_REQUIRED: 'Chưa xác minh được giấy phép cho phép sử dụng ảnh.',
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
