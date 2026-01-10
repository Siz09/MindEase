'use client';

import { User, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SafetyBanner from './SafetyBanner';
import VoicePlayer from '../VoicePlayer';
import BreathingPatternSelector from '../chat/BreathingPatternSelector';
import ChatBreathingTimer from '../chat/ChatBreathingTimer';
import ChatMeditationTimer from '../chat/ChatMeditationTimer';

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
  // Interactive content props
  onSelectBreathingPattern,
  onTimerComplete,
  onDismissInteractive,
  interactiveState,
}) => {
  const { t } = useTranslation();
  const isUser = message?.isUserMessage;
  const hasInteractiveContent = message?.interactiveType && !isUser;

  const renderRiskLabel = (message) => {
    if (!message || !message.riskLevel || message.riskLevel === 'NONE') return null;
    const label = `Risk: ${message.riskLevel.toUpperCase()}`;
    const color =
      message.riskLevel === 'CRITICAL'
        ? '#b91c1c'
        : message.riskLevel === 'HIGH'
          ? '#dc2626'
          : message.riskLevel === 'MEDIUM'
            ? '#d97706'
            : '#2563eb';
    return (
      <div style={{ marginTop: 4, fontSize: '0.75rem', fontWeight: 500, color }}>
        {label}
        {message.moderationAction && message.moderationAction !== 'NONE'
          ? ` • Action: ${message.moderationAction.toLowerCase()}`
          : null}
      </div>
    );
  };

  const renderModerationNote = (message) => {
    if (!message || !message.moderationReason) return null;
    return (
      <div style={{ marginTop: 2, fontSize: '0.7rem', color: '#6b7280' }}>
        {message.moderationReason}
      </div>
    );
  };

  const renderCrisisResources = (message) => {
    if (
      !message ||
      !Array.isArray(message.crisisResources) ||
      message.crisisResources.length === 0
    ) {
      return null;
    }
    return (
      <div
        style={{
          marginTop: 6,
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          backgroundColor: 'rgba(254, 226, 226, 0.6)',
          border: '1px solid #fecaca',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 2 }}>
          {t('chat.crisisResourcesTitle') || 'Crisis support contacts near you:'}
        </div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, fontSize: '0.75rem' }}>
          {message.crisisResources.map((r) => (
            <li
              key={`${r.region || ''}-${r.name || ''}-${r.phoneNumber || ''}`}
              style={{ marginTop: 2 }}
            >
              {r.name && <span style={{ fontWeight: 500 }}>{r.name}</span>}
              {r.phoneNumber && <span> • {r.phoneNumber}</span>}
              {r.website && (
                <span>
                  {' '}
                  •{' '}
                  <a href={r.website} target="_blank" rel="noreferrer">
                    {new URL(r.website).hostname.replace(/^www\./, '')}
                  </a>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const formatTime = (timestamp, locale = 'en-US') => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Render interactive content based on message type
   */
  const renderInteractiveContent = () => {
    if (!message?.interactiveType) return null;

    switch (message.interactiveType) {
      case 'breathing-selector':
        return (
          <BreathingPatternSelector
            onSelect={(patternKey, pattern) => {
              if (onSelectBreathingPattern) {
                onSelectBreathingPattern(message.id, patternKey, pattern);
              }
            }}
          />
        );

      case 'breathing-timer':
        return (
          <ChatBreathingTimer
            patternKey={interactiveState?.selectedPattern || '478'}
            pattern={interactiveState?.patternData}
            onComplete={(data) => {
              if (onTimerComplete) {
                onTimerComplete(message.id, 'breathing', data);
              }
            }}
            onClose={() => {
              if (onDismissInteractive) {
                onDismissInteractive(message.id);
              }
            }}
          />
        );

      case 'meditation-timer':
        return (
          <ChatMeditationTimer
            onComplete={(data) => {
              if (onTimerComplete) {
                onTimerComplete(message.id, 'meditation', data);
              }
            }}
            onClose={() => {
              if (onDismissInteractive) {
                onDismissInteractive(message.id);
              }
            }}
          />
        );

      default:
        return null;
    }
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
          maxWidth: hasInteractiveContent ? '90%' : '75%',
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

          {/* Text content bubble */}
          {message.content && (
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
          )}

          {/* Interactive content (breathing/meditation timers) */}
          {hasInteractiveContent && (
            <div style={{ marginTop: message.content ? '0.5rem' : 0 }}>
              {renderInteractiveContent()}
            </div>
          )}

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
