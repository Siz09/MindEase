import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';
import SafetyBanner from './SafetyBanner';

const ChatMessage = ({
  message,
  isTyping = false,
  onPlayVoice,
  onStopVoice,
  isPlaying = false,
  voiceEnabled = false,
}) => {
  const isUser = message?.isUserMessage;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 mb-4"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="chat-bubble-bot">
          <div className="typing-indicator flex gap-1">
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start gap-3 mb-4', isUser && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary-500 text-white' : 'bg-primary-100 dark:bg-primary-900'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        )}
      </div>

      <div className={cn('flex-1 max-w-[80%]', isUser && 'flex flex-col items-end')}>
        {/* Safety banner for bot messages */}
        {!isUser && message.riskLevel && message.riskLevel !== 'NONE' && (
          <SafetyBanner
            riskLevel={message.riskLevel}
            crisisResources={message.crisisResources}
            moderationReason={message.moderationReason}
          />
        )}

        <div className={cn(isUser ? 'chat-bubble-user' : 'chat-bubble-bot')}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400',
            isUser && 'flex-row-reverse'
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {!isUser && voiceEnabled && (
            <button
              onClick={isPlaying ? onStopVoice : onPlayVoice}
              className="hover:text-primary-500 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isPlaying ? 'Stop voice' : 'Play voice'}
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
