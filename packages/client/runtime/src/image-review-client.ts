import type { OutlineImageReview, ImageCredit, ImageSelection, ImageAttempt } from '@deckagent/deck'

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
  const license = (['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const).find(k => k === v.license)
  if (!license || v.unknownLicense !== (license === 'unknown')) return invalid()
  if (v.evidence !== undefined && v.evidence !== 'image-metadata' && v.evidence !== 'pexels-cdn') return invalid()
  if (v.downloadUrl !== undefined && !url(v.downloadUrl)) return invalid()
  return {
    url: v.url,
    author: v.author,
    license,
    licenseUrl: v.licenseUrl,
    retrievedAt: v.retrievedAt,
    unknownLicense: license === 'unknown',
    ...(v.evidence === 'image-metadata' || v.evidence === 'pexels-cdn' ? { evidence: v.evidence } : {}),
    ...(typeof v.downloadUrl === 'string' ? { downloadUrl: v.downloadUrl } : {}),
  }
}
function attempts(value: unknown): readonly ImageAttempt[] {
  if (!Array.isArray(value) || value.length > 4) return invalid()
  return value.map(a => {
    if (
      !object(a) ||
      !string(a.candidateId) ||
      !url(a.imageUrl) ||
      !string(a.code) ||
      !Array.isArray(a.checks) ||
      a.checks.length > 3
    )
      return invalid()
    return {
      candidateId: a.candidateId,
      imageUrl: a.imageUrl,
      code: a.code,
      checks: a.checks.map((c: unknown) => {
        if (
          !object(c) ||
          !url(c.sourceUrl) ||
          !string(c.code) ||
          (c.httpStatus !== undefined &&
            (typeof c.httpStatus !== 'number' ||
              !Number.isInteger(c.httpStatus) ||
              c.httpStatus < 100 ||
              c.httpStatus > 599))
        )
          return invalid()
        return {
          sourceUrl: c.sourceUrl,
          code: c.code,
          ...(typeof c.httpStatus === 'number' ? { httpStatus: c.httpStatus } : {}),
        }
      }),
    }
  })
}
function selection(v: unknown): ImageSelection {
  if (
    !object(v) ||
    !url(v.imageUrl) ||
    !string(v.query) ||
    !string(v.description) ||
    !string(v.reason) ||
    v.evidence !== 'metadata' ||
    (v.policy !== 'web-images-v1' && v.policy !== 'web-images-v2') ||
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
      ...(item.attempts === undefined ? {} : { attempts: attempts(item.attempts) }),
      ...(item.credit === undefined ? {} : { credit: credit(item.credit) }),
      ...(item.selection === undefined ? {} : { selection: selection(item.selection) }),
    }
  })
}

export const imageFailure = (code?: string): string =>
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
