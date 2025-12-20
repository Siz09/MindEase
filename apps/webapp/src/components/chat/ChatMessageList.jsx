import { useTranslation } from 'react-i18next';
import TypingIndicator from './TypingIndicator';
import ChatBubble from '../ui/ChatBubble';
import {
  MESSAGE_STATUS,
  getStatusColor,
  getStatusIcon,
  getStatusText,
} from '../../utils/messageStatus';

const ChatMessageList = ({
  messages = [],
  messageStatuses = {},
  isTyping = false,
  voiceEnabled = false,
  onRetryMessage,
  onPlayVoice,
  onPauseVoice,
  onStopVoice,
  isPlayingMessageId,
  isPaused = false,
  hasMoreHistory = false,
  loadingHistory = false,
  onLoadOlder,
  containerRef,
  onScroll,
}) => {
  const { t } = useTranslation();

  return (
    <div className="chat-messages" ref={containerRef} onScroll={onScroll}>
      {hasMoreHistory && onLoadOlder && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingHistory}
            aria-busy={loadingHistory}
            className="suggested-message"
            style={{ maxWidth: 260 }}
          >
            {loadingHistory ? t('chat.loadingOlderMessages') : t('chat.loadOlderMessages')}
          </button>
        </div>
      )}

      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message}
          messageStatus={messageStatuses[message.id]}
          onRetry={() => onRetryMessage?.(message)}
          voiceEnabled={voiceEnabled}
          onPlayVoice={() => onPlayVoice?.(message)}
          onPauseVoice={() => onPauseVoice?.(message)}
          onStopVoice={() => onStopVoice?.(message)}
          isPlaying={isPlayingMessageId === message.id && !isPaused}
          isPaused={isPlayingMessageId === message.id && isPaused}
          MESSAGE_STATUS={MESSAGE_STATUS}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ))}

      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default ChatMessageList;
