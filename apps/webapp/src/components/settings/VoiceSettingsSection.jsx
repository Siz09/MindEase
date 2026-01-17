import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  mapI18nToSpeechLang,
  filterVoicesByLang,
} from '../../utils/speechUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Separator } from '../ui/Separator';
import Button from '../ui/Button';
import { Mic, Volume2, Gauge, MessageCircle } from 'lucide-react';

const VoiceSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const {
    voiceInputEnabled,
    voiceOutputEnabled,
    speechRate,
    volume,
    selectedVoiceName,
    setVoiceInputEnabled,
    setVoiceOutputEnabled,
    setSpeechRate,
    setVolume,
    setSelectedVoiceName,
  } = useVoiceSettings();

  const isVoiceInputSupported = isSpeechRecognitionSupported();
  const isVoiceOutputSupported = isSpeechSynthesisSupported();

  const {
    speak,
    availableVoices,
    selectedVoice,
    setVoice,
    rate,
    setRate,
    setVolume: setTtsVolume,
  } = useTextToSpeech({
    language: mapI18nToSpeechLang(i18n.language),
    defaultRate: speechRate,
    defaultVolume: volume,
  });

  useEffect(() => {
    setRate(speechRate);
    setTtsVolume(volume);
  }, [speechRate, volume, setRate, setTtsVolume]);

  useEffect(() => {
    if (!selectedVoiceName || availableVoices.length === 0) return;
    if (selectedVoice?.name === selectedVoiceName) return;
    const voice = availableVoices.find((v) => v.name === selectedVoiceName);
    if (voice) setVoice(voice);
  }, [selectedVoiceName, availableVoices, selectedVoice, setVoice]);

  const handleVoiceInputToggle = (enabled) => {
    setVoiceInputEnabled(enabled);
    toast.success(enabled ? t('settings.voice.inputEnabled') : t('settings.voice.inputDisabled'));
  };

  const handleVoiceOutputToggle = (enabled) => {
    setVoiceOutputEnabled(enabled);
    toast.success(enabled ? t('settings.voice.outputEnabled') : t('settings.voice.outputDisabled'));
  };

  const handleVoiceChange = (voice) => {
    setVoice(voice);
    setSelectedVoiceName(voice.name);
  };

  const handleRateChange = (values) => {
    const newRate = values[0];
    setRate(newRate);
    setSpeechRate(newRate);
  };

  const handleVolumeChange = (values) => {
    const newVolume = values[0];
    setTtsVolume(newVolume);
    setVolume(newVolume);
  };

  const handleTestVoice = () => {
    speak(t('chat.testVoiceSample'));
  };

  // Filter voices by current language
  const currentSpeechLang = mapI18nToSpeechLang(i18n.language);
  const filteredVoices = useMemo(() => {
    if (!availableVoices || availableVoices.length === 0) return [];

    // First try to get voices matching the current language
    const langVoices = filterVoicesByLang(availableVoices, currentSpeechLang);

    // If no voices found for the language, show all voices as fallback
    // This helps when the OS doesn't have language-specific voices installed
    return langVoices.length > 0 ? langVoices : availableVoices;
  }, [availableVoices, currentSpeechLang]);

  if (!isVoiceInputSupported && !isVoiceOutputSupported) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.voiceSettings')}</CardTitle>
          <CardDescription>{t('settings.voice.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Input */}
          {isVoiceInputSupported && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {t('chat.enableVoiceInput')}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.voice.inputDescription')}
                  </p>
                  {i18n.language === 'ne' && (
                    <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">⚠️ Nepali STT Limitation</p>
                      <p>
                        Nepali speech-to-text has limited browser support. Voice input may not work
                        reliably for Nepali. You can still type in Nepali and receive responses in
                        Nepali.
                      </p>
                    </div>
                  )}
                </div>
                <Switch checked={voiceInputEnabled} onCheckedChange={handleVoiceInputToggle} />
              </div>
              <Separator />
            </>
          )}

          {/* Voice Output */}
          {isVoiceOutputSupported && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {t('chat.enableVoiceOutput')}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.voice.outputDescription')}
                  </p>
                </div>
                <Switch checked={voiceOutputEnabled} onCheckedChange={handleVoiceOutputToggle} />
              </div>

              {voiceOutputEnabled && (
                <>
                  <Separator />

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('chat.selectVoice')}
                    </label>
                    {filteredVoices.length === 0 ? (
                      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                        {i18n.language === 'ne' ? (
                          <div className="space-y-2">
                            <p className="font-medium">⚠️ Nepali TTS Not Available</p>
                            <p className="text-xs">
                              Unfortunately, Nepali text-to-speech is not supported by your
                              browser/OS. This is a limitation of the Web Speech API, not this
                              application.
                            </p>
                            <p className="text-xs mt-2">
                              <strong>Alternative:</strong> You can still type in Nepali and the bot
                              will respond in Nepali. Voice output will use English until browser
                              support improves.
                            </p>
                          </div>
                        ) : (
                          'No voices available for the selected language.'
                        )}
                      </div>
                    ) : (
                      <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                        value={selectedVoice?.name || ''}
                        onChange={(e) => {
                          const voice = filteredVoices.find((v) => v.name === e.target.value);
                          if (voice) handleVoiceChange(voice);
                        }}
                      >
                        {filteredVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    )}
                    {filteredVoices.length > 0 &&
                      filteredVoices.length < availableVoices.length && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Showing {filteredVoices.length} voice
                          {filteredVoices.length !== 1 ? 's' : ''} for{' '}
                          {i18n.language === 'ne' ? 'Nepali' : 'English'}
                        </p>
                      )}
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-purple-600" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('chat.speechRate')}
                        </label>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {rate.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={rate}
                      onValueChange={handleRateChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>0.5x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-blue-600" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('chat.volume')}
                        </label>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onValueChange={handleVolumeChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Test Voice Button */}
                  <Button variant="outline" onClick={handleTestVoice} className="w-full gap-2">
                    <Volume2 className="h-4 w-4" />
                    {t('chat.testVoice')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Voice Conversation Mode Info */}
          {voiceInputEnabled && voiceOutputEnabled && (
            <>
              <Separator />
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                    {t('settings.voice.conversationModeTitle')}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('settings.voice.conversationModeDescription')}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceSettingsSection;
