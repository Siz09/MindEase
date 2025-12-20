/**
 * Chat message normalization helpers.
 *
 * Backend payloads are mostly consistent across WebSocket + history endpoints,
 * but normalization keeps the UI defensive against shape differences.
 */

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const createFallbackMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `msg-${crypto.randomUUID()}`;
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const normalizeChatMessage = (m) => {
  const rawId = m?.id;
  const id = rawId === null || rawId === undefined ? createFallbackMessageId() : String(rawId);
  const content = m?.content ?? m?.message ?? m?.text ?? '';

  return {
    id,
    content: content || 'Empty message',
    isUserMessage: Boolean(m?.isUserMessage ?? (m?.sender ? m.sender === 'user' : false)),
    sender: m?.sender ?? (m?.isUserMessage ? 'user' : 'bot'),
    createdAt: m?.createdAt ?? '1970-01-01T00:00:00.000Z',
    isCrisisFlagged: Boolean(m?.isCrisisFlagged),
    riskLevel: m?.riskLevel ?? 'NONE',
    moderationAction: m?.moderationAction ?? 'NONE',
    moderationReason: m?.moderationReason,
    crisisResources: Array.isArray(m?.crisisResources)
      ? m.crisisResources
      : safeJsonParse(m?.crisisResourcesJson, []),
    provider: m?.provider,
  };
};

export const extractTotalPages = (res) =>
  Number.isFinite(res?.pagination?.totalPages)
    ? res.pagination.totalPages
    : Number.isFinite(res?.totalPages)
      ? res.totalPages
      : undefined;
