/**
 * Message delivery status tracking
 * States: sending -> sent -> delivered
 */

export const MESSAGE_STATUS = {
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

/**
 * Get status icon for message delivery
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case MESSAGE_STATUS.QUEUED:
      return '⏳'; // Queued (offline)
    case MESSAGE_STATUS.SENDING:
      return '○'; // Empty circle
    case MESSAGE_STATUS.SENT:
      return '✓'; // Single checkmark
    case MESSAGE_STATUS.DELIVERED:
      return '✓✓'; // Double checkmark
    case MESSAGE_STATUS.FAILED:
      return '✗'; // X mark
    default:
      return '';
  }
};

/**
 * Get status color for message delivery
 */
export const getStatusColor = (status) => {
  switch (status) {
    case MESSAGE_STATUS.QUEUED:
    case MESSAGE_STATUS.SENDING:
      return '#9ca3af'; // Gray
    case MESSAGE_STATUS.SENT:
      return '#9ca3af'; // Gray
    case MESSAGE_STATUS.DELIVERED:
      return '#10b981'; // Green
    case MESSAGE_STATUS.FAILED:
      return '#ef4444'; // Red
    default:
      return '#9ca3af';
  }
};

/**
 * Get status text for accessibility
 */
export const getStatusText = (status) => {
  switch (status) {
    case MESSAGE_STATUS.QUEUED:
      return 'Queued';
    case MESSAGE_STATUS.SENDING:
      return 'Sending...';
    case MESSAGE_STATUS.SENT:
      return 'Sent';
    case MESSAGE_STATUS.DELIVERED:
      return 'Delivered';
    case MESSAGE_STATUS.FAILED:
      return 'Failed to send';
    default:
      return '';
  }
};
