'use client';

import { User, Bot, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import SafetyBanner from './SafetyBanner';
import VoicePlayer from '../VoicePlayer';

const ChatBubble = ({
  message,
  messageStatus,
  onRetry,
  onPlayVoice,
  onPauseVoice,
  onStopVoice,
  isPlaying = false,
  isPaused = false,
  voiceEnabled = false,
  getStatusIcon,
  getStatusColor,
  getStatusText,
  MESSAGE_STATUS,
  renderRiskLabel,
  renderModerationNote,
  renderCrisisResources,
}) => {
  const isUser = message?.isUserMessage;

  const formatTime = (timestamp, locale = 'en-US') => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '0.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          maxWidth: '75%',
          alignItems: 'flex-start',
          gap: '0.5rem',
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '2rem',
            width: '2rem',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: isUser ? 'var(--primary-green)' : 'var(--bg-secondary)',
            marginTop: '0.25rem',
          }}
        >
          {isUser ? (
            <User className="h-4 w-4" style={{ color: 'white' }} />
          ) : (
            <Bot className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Safety banner for bot messages */}
          {!isUser && message.riskLevel && message.riskLevel !== 'NONE' && (
            <div style={{ marginBottom: '0.5rem' }}>
              <SafetyBanner
                riskLevel={message.riskLevel}
                crisisResources={message.crisisResources}
                moderationReason={message.moderationReason}
              />
            </div>
          )}

          <div
            style={{
              borderRadius: isUser
                ? '1.125rem 1.125rem 0.25rem 1.125rem'
                : '1.125rem 1.125rem 1.125rem 0.25rem',
              padding: '0.5rem 0.75rem',
              ...(isUser
                ? {
                    backgroundColor: 'var(--primary-green-dark)',
                    color: 'white',
                  }
                : {
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }),
            }}
          >
            <p
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontSize: '0.9375rem',
                lineHeight: '1.4',
                color: isUser ? 'white' : 'var(--text-primary)',
              }}
            >
              {message.content}
            </p>

            {/* Risk label and moderation note inside bubble */}
            {renderRiskLabel && renderRiskLabel(message)}
            {renderModerationNote && renderModerationNote(message)}
            {renderCrisisResources && renderCrisisResources(message)}
          </div>

          <div
            style={{
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              padding: '0 0.5rem',
            }}
          >
            <span>{formatTime(message.createdAt)}</span>

            {/* Message status for user messages */}
            {isUser && messageStatus && getStatusIcon && (
              <>
                <span
                  className="text-xs"
                  style={{
                    color: getStatusColor ? getStatusColor(messageStatus) : undefined,
                  }}
                  title={getStatusText ? getStatusText(messageStatus) : ''}
                >
                  {getStatusIcon(messageStatus) || '✓'}
                </span>
                {messageStatus === MESSAGE_STATUS?.FAILED && onRetry && (
                  <button
                    onClick={onRetry}
                    className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Retry sending message"
                  >
                    Retry
                  </button>
                )}
              </>
            )}

            {/* Voice player for bot messages */}
            {!isUser && voiceEnabled && (
              <VoicePlayer
                compact
                isPlaying={isPlaying}
                isPaused={isPaused}
                onPlay={onPlayVoice}
                onPause={onPauseVoice}
                onStop={onStopVoice}
              />
            )}
          </div>

          {/* Crisis warning badge */}
          {message.isCrisisFlagged && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l7 14H1L8 1z" fill="currentColor" />
                <path d="M8 6v3M8 11h.01" stroke="white" strokeWidth="1.5" />
              </svg>
              <span>Crisis support available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
