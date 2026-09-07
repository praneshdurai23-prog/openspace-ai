import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Sparkles } from 'lucide-react';

interface VoiceModeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    sendMessage,
    isStreaming,
    streamingContent,
    activeConversation,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
  } = useChat();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isVoiceModalOpen;
  const onClose = propOnClose || (() => setIsVoiceModalOpen(false));

  const [isListening, setIsListening] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [lastAssistantSpoken, setLastAssistantSpoken] = useState('');
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([16, 24, 40, 60, 48, 32, 20, 36, 52, 44, 28, 16]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Animate audio waveform bars
  useEffect(() => {
    let animId: number;
    const updateWave = () => {
      if (isListening || isStreaming) {
        setVisualizerHeights(
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 56) + 12)
        );
      } else {
        setVisualizerHeights([14, 20, 28, 36, 32, 24, 18, 22, 30, 34, 26, 18, 14, 12]);
      }
      animId = requestAnimationFrame(() => {
        setTimeout(updateWave, 120);
      });
    };
    updateWave();
    return () => cancelAnimationFrame(animId);
  }, [isListening, isStreaming]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            setTranscript(fullText.trim());
          };

          rec.onerror = (err: any) => {
            console.warn('Voice error:', err);
            setIsListening(false);
          };

          rec.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = rec;
        } catch (e) {
          console.warn('Voice recognition not supported:', e);
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak AI response when streaming completes
  useEffect(() => {
    if (!speechSynthesisEnabled || !synthRef.current) return;

    if (!isStreaming && activeConversation && activeConversation.messages.length > 0) {
      const lastMsg = activeConversation.messages[activeConversation.messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content && lastMsg.content !== lastAssistantSpoken) {
        setLastAssistantSpoken(lastMsg.content);
        // Clean markdown for speech
        const cleanSpeech = lastMsg.content
          .replace(/```[\s\S]*?```/g, 'Code block omitted.')
          .replace(/[#*_`>\[\]]/g, '')
          .slice(0, 500); // speak first 500 chars naturally

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanSpeech);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synthRef.current.speak(utterance);
      }
    }
  }, [isStreaming, activeConversation, speechSynthesisEnabled, lastAssistantSpoken]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Auto-send transcript if non-empty
      if (transcript.trim()) {
        sendMessage(transcript.trim());
        setTranscript('');
      }
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const handleSendTranscript = () => {
    if (transcript.trim()) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      sendMessage(transcript.trim());
      setTranscript('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0B0E19] border border-[#1E2337] rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden flex flex-col items-center text-center">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top close & mute controls */}
        <div className="w-full flex items-center justify-between z-10 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              OpenSpace Voice Interface
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSpeechSynthesisEnabled(!speechSynthesisEnabled);
                if (synthRef.current) synthRef.current.cancel();
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                speechSynthesisEnabled
                  ? 'border-[#06B6D4]/40 text-[#06B6D4] bg-[#06B6D4]/10'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={speechSynthesisEnabled ? 'AI Voice response is ON' : 'AI Voice response is MUTED'}
            >
              {speechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (recognitionRef.current) recognitionRef.current.stop();
                if (synthRef.current) synthRef.current.cancel();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Animated Visualizer Sphere & Bars */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          {/* Central orb */}
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isListening
                ? 'bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/30 scale-110'
                : isStreaming
                ? 'bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] shadow-[#7C3AED]/40 animate-pulse'
                : 'bg-gradient-to-tr from-[#1E2337] to-[#171A2B] border border-[#2A314E]'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 text-white animate-bounce" />
            ) : isStreaming ? (
              <Radio className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Sparkles className="w-10 h-10 text-[#06B6D4]" />
            )}
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="flex items-center gap-1.5 h-16 mt-6">
            {visualizerHeights.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}px` }}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  isListening
                    ? 'bg-rose-500 shadow-xs shadow-rose-500'
                    : isStreaming
                    ? 'bg-[#06B6D4] shadow-xs shadow-[#06B6D4]'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Status Text & Live Transcript */}
        <div className="w-full min-h-[70px] flex flex-col items-center justify-center mb-6">
          <p className="text-xs font-medium text-slate-400 mb-1.5">
            {isListening
              ? 'Listening... Speak your question or command'
              : isStreaming
              ? 'OpenSpace is thinking & speaking...'
              : 'Tap microphone below to start speaking'}
          </p>

          <p className="text-sm font-medium text-[#F5F7FF] max-w-sm line-clamp-3 italic">
            {transcript ? `"${transcript}"` : streamingContent ? streamingContent.slice(-120) : 'Ready'}
          </p>
        </div>

        {/* Main Microphone Action Button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl active:scale-95 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 ring-4 ring-rose-500/30'
                : 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] hover:opacity-90 text-white shadow-[#7C3AED]/40'
            }`}
            title={isListening ? 'Stop and send' : 'Start speaking'}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          {transcript.trim() && !isListening && (
            <button
              type="button"
              onClick={handleSendTranscript}
              className="px-4 py-3 rounded-2xl bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Send to Chat
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 mt-6">
          Hands-free Voice Mode with continuous speech recognition and neural synthesis.
        </p>
      </div>
    </div>
  );
};
