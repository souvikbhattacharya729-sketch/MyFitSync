import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquareCode, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { api } from '../services/api';
import { ChatMessage } from '../components/chat/ChatMessage';

const EXAMPLE_PROMPTS = [
  "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours.",
  "What are the macros and calories in 3 boiled eggs?",
  "Suggest a 4-day progressive overload workout split for hypertrophy.",
  "How much protein should I eat per day for my bodyweight?",
  "3x5 @ 100kg deadlift, legs sore 6/10, resting heart rate 54 bpm",
  "Ate 200g chicken breast with 150g rice and avocado",
];

export const ChatPage = () => {
  const { user, refreshDashboard } = useFitness();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      reply: `Welcome ${user?.name || 'Athlete'}! I am your MyFitSync AI Fitness Coach (powered like Grok for fitness intelligence).\n\nYou can ask me training & nutrition advice (e.g. "calories in boiled eggs", "suggest a chest routine"), or log multiple sets, meals, and recovery in a single plain English statement.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const idempotencyKey = `chatpage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
          reply: `Sorry, an error occurred: ${err.message}`,
          warnings: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6.5rem)] rounded-2xl border border-sage-border bg-white overflow-hidden shadow-card transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sage-border bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
            <Zap className="h-5 w-5 fill-sage-action" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sage-forest flex items-center gap-2">
              <span>MyFitSync Intelligence Assistant</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-mint text-sage-action border border-sage-sage/30 px-2 py-0.5 rounded-full">
                AI Coach
              </span>
            </h1>
            <p className="text-[11px] text-sage-muted">
              Instant fitness questions & deterministic plain-English multi-intent logging
            </p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-sage-bg/30">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSelectChip={(chipText) => handleSendMessage(chipText)}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-sage-border px-4 py-3 text-xs text-sage-muted shadow-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-sage-action" />
              <span>Analyzing athletic intelligence & processing records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="border-t border-sage-border bg-white px-6 py-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sage-muted mb-2">
          <Sparkles className="h-3.5 w-3.5 text-sage-action" />
          <span>Quick Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.slice(0, 4).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs font-semibold text-sage-forest hover:text-sage-action hover:border-sage-sage bg-sage-surface px-3 py-1.5 rounded-xl border border-sage-border transition-all text-left line-clamp-1 max-w-sm active:scale-95 shadow-sm"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-sage-border bg-white p-4">
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
            placeholder="Type your workout, nutrition, or ask AI advice in plain English... (e.g. 'Squats 100kg 5x5, ate 2 boiled eggs')"
            className="flex-1 rounded-xl border border-sage-border bg-sage-surface/60 px-4 py-3 text-sm text-sage-forest placeholder-sage-muted/60 focus:border-sage-action focus:outline-none focus:ring-1 focus:ring-sage-action transition-all shadow-sm font-medium"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-action hover:bg-sage-forest text-white font-bold shadow-card disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            aria-label="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
