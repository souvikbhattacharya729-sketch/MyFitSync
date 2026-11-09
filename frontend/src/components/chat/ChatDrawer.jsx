import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquareCode } from 'lucide-react';
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

    // Optimistic UI display
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

      // Automatically refresh dashboard data if records were saved
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg border-l border-slate-800 bg-[#0B0F17] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950">
                <MessageSquareCode className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Log in Plain English</h2>
                <span className="text-[11px] text-emerald-400 font-medium">Deterministic NLP Engine Active</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Chat Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSelectChip={(chipText) => handleSendMessage(chipText)}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Parsing workout, macros & sleep...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Example Prompts for first-time / quick log */}
          {messages.length <= 2 && (
            <div className="px-6 py-2 border-t border-slate-850 bg-[#131B2A]/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Example Prompts (click to try):</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 p-2 rounded-lg border border-slate-800/70 transition-colors line-clamp-1"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="border-t border-slate-800 bg-[#0B0F17] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Squat 100kg 5 reps 3 sets @8, ate 2200 kcal..."
                className="flex-1 rounded-xl border border-slate-800 bg-[#131B2A] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Press Enter to send. Unambiguous entries are stored in a single transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
