export const scrollToBottom = (container, behavior = 'smooth') => {
  if (!container) return;
  try {
    container.scrollTo({ top: container.scrollHeight, behavior });
  } catch {
    container.scrollTop = container.scrollHeight;
  }
};

export const isNearBottom = (container, thresholdPx = 140) => {
  if (!container) return true;
  const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
  return distance <= thresholdPx;
};

export const restoreScrollAfterPrepend = (container, previousScrollHeight) => {
  if (!container) return;
  const delta = container.scrollHeight - previousScrollHeight;
  container.scrollTop += delta;
};
