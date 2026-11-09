import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquareCode, Sparkles, RefreshCw } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { api } from '../services/api';
import { ChatMessage } from '../components/chat/ChatMessage';

const EXAMPLE_PROMPTS = [
  "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours.",
  "3x5 @ 100kg deadlift, legs sore 6/10, resting heart rate 54 bpm",
  "Ate 200g chicken breast with 150g rice and avocado",
  "Bench 220 lb for 5 reps, 3 sets at RPE 8.5",
  "Yesterday overhead press 50kg 5 reps 3 sets",
];

export const ChatPage = () => {
  const { user, refreshDashboard } = useFitness();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      reply: `Welcome ${user?.name || 'Athlete'}! You can log your training sets, meals, macros, and recovery directly in plain English. Multiple exercises and multi-intent statements are saved in one single database transaction.`,
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
          reply: `Sorry, an error occurred while logging: ${err.message}`,
          warnings: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6.5rem)] rounded-2xl border border-slate-800 bg-[#131B2A] overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B0F17] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-md">
            <MessageSquareCode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Fitness Conversational Assistant</h1>
            <p className="text-[11px] text-slate-400">Rule-based deterministic NLP with clarification protocol</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
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
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Parsing and persisting verified entries...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompts Bar */}
      <div className="border-t border-slate-800 bg-[#0B0F17]/90 px-6 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Quick Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs text-slate-300 hover:text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 transition-colors line-clamp-1 max-w-xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
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
            placeholder="Type your workout, nutrition or sleep in plain English... (Press Enter)"
            className="flex-1 rounded-xl border border-slate-800 bg-[#131B2A] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
            aria-label="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
