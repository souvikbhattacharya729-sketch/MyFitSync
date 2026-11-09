import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { FitnessProvider } from '../context/FitnessContext';
import { api } from '../services/api';

describe('Auth Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Login Component', () => {
    it('renders email and password inputs and login button', () => {
      render(
        <BrowserRouter>
          <FitnessProvider>
            <Login />
          </FitnessProvider>
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('athlete@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('allows entering credentials and toggling remember me', () => {
      render(
        <BrowserRouter>
          <FitnessProvider>
            <Login />
          </FitnessProvider>
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('athlete@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      const rememberCheckbox = screen.getByLabelText(/remember this device/i);

      fireEvent.change(emailInput, { target: { value: 'athlete@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecretPassword123!' } });
      fireEvent.click(rememberCheckbox);

      expect(emailInput.value).toBe('athlete@example.com');
      expect(passwordInput.value).toBe('SecretPassword123!');
      expect(rememberCheckbox.checked).toBe(false); // was true, toggled to false
    });

    it('displays error message when login fails', async () => {
      vi.spyOn(api, 'login').mockRejectedValueOnce(new Error('Invalid email or password.'));

      render(
        <BrowserRouter>
          <FitnessProvider>
            <Login />
          </FitnessProvider>
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('athlete@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'bad@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });
  });

  describe('Register Component', () => {
    it('renders all required registration fields', () => {
      render(
        <BrowserRouter>
          <FitnessProvider>
            <Register />
          </FitnessProvider>
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('Alex Mercer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('alex@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows error if password is less than 10 characters', async () => {
      render(
        <BrowserRouter>
          <FitnessProvider>
            <Register />
          </FitnessProvider>
        </BrowserRouter>
      );

      const nameInput = screen.getByPlaceholderText('Alex Mercer');
      const emailInput = screen.getByPlaceholderText('alex@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      const submitBtn = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 10 characters/i)).toBeInTheDocument();
      });
    });
  });
});
