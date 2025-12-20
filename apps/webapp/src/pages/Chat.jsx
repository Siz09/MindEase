'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useAuth } from '../contexts/AuthContext';
import { apiPost } from '../lib/api';
import { isFeatureEnabled } from '../config/featureFlags';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatHistory } from '../hooks/useChatHistory';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import { MESSAGE_STATUS } from '../utils/messageStatus';
import { mapI18nToSpeechLang } from '../utils/speechUtils';
import { isNearBottom, restoreScrollAfterPrepend, scrollToBottom } from '../utils/chat/scrollManager';

import ChatHeader from '../components/chat/ChatHeader';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatInput from '../components/chat/ChatInput';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import VoiceControls from '../components/chat/VoiceControls';

import '../styles/Chat.css';

const Chat = () => {
  const { t, i18n } = useTranslation();
  const { token, currentUser } = useAuth();
  const isOnline = useOnlineStatus();

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesContainerRef = useRef(null);
  const preventAutoScrollRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const {
    messages,
    messageStatuses,
    addMessage,
    addMessages,
    removeMessage,
    setMessages,
    normalizeMessage,
    isMessageProcessed,
    updateMessageStatus,
    markMessageDelivered,
  } = useChatMessages();

  const history = useChatHistory({
    token,
    currentUser,
    addMessages,
    setMessages,
    normalizeMessage,
    isMessageProcessed,
    messagesContainerRef,
    preventAutoScrollRef,
    prevScrollHeightRef,
  });

  const offlineQueue = useOfflineQueue();

  const registerBotMessageRef = useRef(() => {});

  const handleSendText = useCallback(
    async (text, { optimisticId = null, removeFromQueueId = null } = {}) => {
      const trimmed = (text ?? '').trim();
      if (!trimmed) return;

      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      if (!isOnline) {
        const queuedId = offlineQueue.addToQueue({ message: trimmed });
        addMessage({
          id: queuedId,
          content: trimmed,
          isUserMessage: true,
          createdAt: new Date().toISOString(),
          sender: 'user',
        });
        updateMessageStatus(queuedId, MESSAGE_STATUS.FAILED);
        return;
      }

      const localId =
        optimisticId || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      if (!optimisticId) {
        addMessage({
          id: localId,
          content: trimmed,
          isUserMessage: true,
          createdAt: new Date().toISOString(),
          sender: 'user',
        });
      }

      updateMessageStatus(localId, MESSAGE_STATUS.SENDING);

      try {
        const res = await apiPost('/api/chat/send', { message: trimmed }, token);
        const userMessage = res?.data?.userMessage;
        const botMessage = res?.data?.botMessage;
        const crisisMessage = res?.data?.crisisMessage;

        removeMessage(localId);
        if (removeFromQueueId) {
          offlineQueue.removeFromQueue(removeFromQueueId);
        }

        if (userMessage) {
          addMessage(userMessage);
          if (userMessage.id) updateMessageStatus(userMessage.id, MESSAGE_STATUS.DELIVERED);
        }

        if (crisisMessage) addMessage(crisisMessage);
        if (botMessage) {
          addMessage(botMessage);
          registerBotMessageRef.current({
            id: botMessage.id,
            text: botMessage.content || '',
          });
        }

        setInputValue('');
      } catch (err) {
        console.error('Failed to send message:', err);
        updateMessageStatus(localId, MESSAGE_STATUS.FAILED);
        toast.error(t('chat.messageFailed'));
      }
    },
    [
      token,
      isOnline,
      offlineQueue,
      addMessage,
      removeMessage,
      updateMessageStatus,
      t,
      setInputValue,
    ]
  );

  const voiceConversationFeatureEnabled = isFeatureEnabled('voiceConversation');
  const showVoiceConversationUi = voiceConversationFeatureEnabled && isFeatureEnabled('voiceInput');
  const voice = useVoiceConversation({
    language: mapI18nToSpeechLang(i18n.language),
    voiceConversationEnabled: showVoiceConversationUi,
    onSendText: (text) => handleSendText(text),
  });

  useEffect(() => {
    registerBotMessageRef.current = voice.registerBotMessage;
  }, [voice.registerBotMessage]);

  const onScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = isNearBottom(el);
  }, []);

  const applyScrollBehavior = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (preventAutoScrollRef.current) {
      restoreScrollAfterPrepend(el, prevScrollHeightRef.current);
      preventAutoScrollRef.current = false;
      prevScrollHeightRef.current = 0;
      return;
    }

    if (shouldAutoScrollRef.current) {
      scrollToBottom(el);
    }
  }, []);

  useEffect(() => {
    applyScrollBehavior();
  }, [messages.length, applyScrollBehavior]);

  const handleIncomingMessage = useCallback(
    (raw) => {
      const added = addMessage(raw);

      if (raw && !raw.isUserMessage) {
        registerBotMessageRef.current({
          id: raw.id,
          text: raw.content || raw.message || raw.text || '',
        });
      }

      if (added && raw && raw.isUserMessage && raw.id) {
        markMessageDelivered(raw.id);
      }
    },
    [addMessage, markMessageDelivered]
  );

  const ws = useWebSocket({
    token,
    currentUser,
    isOnline,
    onMessage: handleIncomingMessage,
    onTyping: setIsTyping,
    processOfflineQueue: () => {
      if (!isOnline) return;
      offlineQueue.processQueue(async (queuedMessage, item) => {
        const text = typeof queuedMessage === 'string' ? queuedMessage : queuedMessage?.message;
        if (!text) return;
        updateMessageStatus(item.id, MESSAGE_STATUS.SENDING);
        await handleSendText(text, { optimisticId: item.id, removeFromQueueId: item.id });
      });
    },
    loadHistory: history.loadHistory,
    historyPage: history.historyPage,
    loadingHistory: history.loadingHistory,
  });

  const handleSend = useCallback(() => handleSendText(inputValue), [handleSendText, inputValue]);

  const retryMessage = useCallback(
    (message) => {
      if (!message?.content) return;
      const isQueued = typeof message.id === 'string' && message.id.startsWith('offline-');
      handleSendText(message.content, {
        optimisticId: message.id,
        removeFromQueueId: isQueued ? message.id : null,
      });
    },
    [handleSendText]
  );

  const voiceEnabled = useMemo(() => {
    return Boolean(voice.voiceOutputEnabled && isFeatureEnabled('voiceOutput'));
  }, [voice.voiceOutputEnabled]);

  const playVoiceForMessage = useCallback(
    (message) => {
      if (!message?.content) return;
      setSpeakingMessageId(message.id);
      voice.speakText(message.content);
    },
    [voice]
  );

  const stopVoice = useCallback(() => {
    setSpeakingMessageId(null);
    voice.tts.stop();
  }, [voice]);

  const pauseVoice = useCallback(() => {
    voice.tts.pause();
  }, [voice]);

  useEffect(() => {
    if (!voice.tts.isPlaying) {
      setSpeakingMessageId(null);
    }
  }, [voice.tts.isPlaying]);

  const selectQuickMessage = useCallback((msg) => setInputValue(msg), []);

  return (
    <div className="chat-page">
      <ChatHeader isConnected={ws.isConnected} offlineQueueCount={offlineQueue.offlineQueueCount} />

      {messages.length === 0 && history.initialLoadComplete ? (
        <ChatEmptyState onSelectMessage={selectQuickMessage} />
      ) : (
        <ChatMessageList
          messages={messages}
          messageStatuses={messageStatuses}
          isTyping={isTyping}
          voiceEnabled={voiceEnabled}
          onRetryMessage={retryMessage}
          onPlayVoice={playVoiceForMessage}
          onPauseVoice={pauseVoice}
          onStopVoice={stopVoice}
          isPlayingMessageId={speakingMessageId}
          isPaused={voice.tts.isPaused}
          hasMoreHistory={history.hasMoreHistory}
          loadingHistory={history.loadingHistory}
          onLoadOlder={history.loadOlderHistory}
          containerRef={messagesContainerRef}
          onScroll={onScroll}
        />
      )}

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={!token}
        showVoiceConversationToggle={showVoiceConversationUi}
        voiceConversationActive={voice.isVoiceConversationActive}
        onToggleVoiceConversation={voice.toggleVoiceConversation}
      />

      <VoiceControls
        enabled={showVoiceConversationUi}
        active={voice.isVoiceConversationActive}
        isSupported={voice.voiceRecorder.isSupported}
        isRecording={voice.voiceRecorder.isRecording}
        isTranscribing={voice.voiceRecorder.isTranscribing}
        error={voice.voiceError}
        interimTranscript={voice.voiceRecorder.interimTranscript}
        onToggle={voice.toggleVoiceConversation}
        onStartRecording={voice.voiceRecorder.startRecording}
        onStopRecording={voice.voiceRecorder.stopRecording}
        onCancelRecording={voice.voiceRecorder.cancelRecording}
      />
    </div>
  );
};

export default Chat;
