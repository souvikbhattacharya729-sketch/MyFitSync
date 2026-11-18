import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquareCode, Zap } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { api } from '../../services/api';
import { ChatMessage } from './ChatMessage';

const EXAMPLE_PROMPTS = [
  "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours.",
  "3x5 @ 100kg deadlift, legs sore 6/10, resting heart rate 54 bpm",
  "Ate 200g chicken breast with 150g rice and avocado",
  "Bench 220 lb for 5 reps, 3 sets at RPE 8.5",
];

export const ChatDrawer = ({ isOpen, onClose }) => {
  const { user, refreshDashboard } = useFitness();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      reply: `Hi ${user?.name || 'there'}! I'm your fitness assistant. Type whatever you trained, ate, or slept in natural plain English, and I will parse and track it for you.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const idempotencyKey = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const response = await api.sendChatMessage(text, user?.timezone, idempotencyKey);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          reply: response.reply,
          saved: response.saved,
          clarifications: response.clarifications,
          warnings: response.warnings,
          metrics: response.metrics,
        },
      ]);

      const saved = response.saved || {};
      if (
        (saved.workouts && saved.workouts.length > 0) ||
        (saved.nutrition && saved.nutrition.length > 0) ||
        (saved.readiness && saved.readiness.length > 0)
      ) {
        refreshDashboard();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          reply: `Sorry, an error occurred while logging: ${err.message}`,
          warnings: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-sage-forest/40 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-lg flex-col bg-white border-l border-sage-border shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sage-border px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Zap className="h-5 w-5 fill-sage-action" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sage-forest">Natural Language Logger</h2>
              <p className="text-[11px] text-sage-muted">Track sets, meals, or sleep in one sentence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface transition-colors"
            aria-label="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sage-bg/30">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSelectChip={(chipText) => handleSendMessage(chipText)}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-sage-border px-4 py-2.5 text-xs text-sage-muted shadow-sm">
                <div className="h-2 w-2 rounded-full bg-sage-action animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-sage-action animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-sage-action animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-medium">Parsing training intelligence...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Quick Prompts */}
        <div className="border-t border-sage-border bg-white px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sage-muted mb-1.5">
            <Sparkles className="h-3 w-3 text-sage-action" />
            <span>Try an Example:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EXAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap rounded-lg bg-sage-surface border border-sage-border px-2.5 py-1 text-[11px] text-sage-forest font-medium hover:bg-sage-mint hover:text-sage-action transition-all shadow-sm"
              >
                "{prompt.slice(0, 32)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-sage-border bg-white p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Squat 100kg 5x5, ate 2 boiled eggs..."
              className="flex-1 rounded-xl border border-sage-border bg-sage-surface/60 px-4 py-2.5 text-sm text-sage-forest placeholder-sage-muted/60 focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action transition-all shadow-sm font-medium"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-action hover:bg-sage-forest text-white font-bold shadow-card disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
