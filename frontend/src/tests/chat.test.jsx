import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ClarificationChips } from '../components/chat/ClarificationChips';
import { FitnessProvider } from '../context/FitnessContext';
import { api } from '../services/api';

describe('Chat Components & Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatMessage Component', () => {
    it('renders user message correctly', () => {
      render(
        <ChatMessage
          message={{
            id: '1',
            sender: 'user',
            text: 'Bench press 100kg for 5 reps 3 sets',
          }}
        />
      );

      expect(screen.getByText('Bench press 100kg for 5 reps 3 sets')).toBeInTheDocument();
    });

    it('renders assistant message with workout parsing card', () => {
      const msg = {
        id: '2',
        sender: 'assistant',
        reply: 'Logged workout successfully.',
        saved: {
          workouts: [
            {
              exercise: 'bench_press',
              sets: 3,
              reps: 5,
              weight_kg: 100,
              rpe: 8,
            },
          ],
        },
      };

      render(<ChatMessage message={msg} />);

      expect(screen.getByText('Logged workout successfully.')).toBeInTheDocument();
      expect(screen.getByText('bench press')).toBeInTheDocument();
      expect(screen.getByText(/100 kg/)).toBeInTheDocument();
      expect(screen.getByText(/@RPE 8/)).toBeInTheDocument();
    });
  });

  describe('ClarificationChips Component', () => {
    it('renders chips and handles click', () => {
      const handleSelect = vi.fn();
      const clarifications = [
        {
          question: 'How many sets did you perform for squats?',
          field: 'sets',
        },
      ];

      render(<ClarificationChips clarifications={clarifications} onSelectChip={handleSelect} />);

      expect(screen.getByText('Clarification Required')).toBeInTheDocument();
      expect(screen.getByText(/How many sets/)).toBeInTheDocument();
      const chipBtn = screen.getByText('3 sets');
      fireEvent.click(chipBtn);

      expect(handleSelect).toHaveBeenCalledWith('3 sets');
    });
  });

  describe('ChatPage Component', () => {
    it('renders chat input and sends natural language query', async () => {
      vi.spyOn(api, 'sendChatMessage').mockResolvedValueOnce({
        reply: 'Logged 1 workout set and 1 meal.',
        saved: {
          workouts: [
            { exercise: 'squat', sets: 3, reps: 5, weight_kg: 120, rpe: 8 },
          ],
        },
        clarification_prompts: [],
      });

      render(
        <BrowserRouter>
          <FitnessProvider>
            <ChatPage />
          </FitnessProvider>
        </BrowserRouter>
      );

      const input = screen.getByPlaceholderText(/Type your workout/i);
      const sendBtn = screen.getByLabelText('Send Message');

      fireEvent.change(input, { target: { value: 'Squat 120kg 5 reps 3 sets' } });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText('Logged 1 workout set and 1 meal.')).toBeInTheDocument();
        expect(screen.getByText('squat')).toBeInTheDocument();
      });
    });
  });
});
