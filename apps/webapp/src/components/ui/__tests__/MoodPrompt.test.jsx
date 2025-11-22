/* eslint-env jest */
/* global describe, test, expect, jest, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import MoodPrompt from '../MoodPrompt';
import i18n from '../../../i18n';

describe('MoodPrompt', () => {
  const renderWithI18n = (component) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  const mockOnSubmit = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders mood prompt title', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    expect(screen.getByText(/How are you feeling/i)).toBeInTheDocument();
  });

  test('renders all 5 mood options', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    // Should have mood buttons with emojis
    const buttons = screen.getAllByRole('button');
    // At least 5 mood buttons + submit button + dismiss button
    expect(buttons.length).toBeGreaterThanOrEqual(7);
  });

  test('submit button is disabled when no mood selected', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    const submitButton = screen.getByText(/submit/i);
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled after selecting mood', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    // Click a mood button (find by emoji or role)
    const moodButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.textContent.match(/submit|cancel/i));

    fireEvent.click(moodButtons[2]); // Click mood 3

    const submitButton = screen.getByText(/submit/i);
    expect(submitButton).not.toBeDisabled();
  });

  test('calls onSubmit with correct mood score', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    const moodButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.textContent.match(/submit|cancel/i));

    // Click mood 4
    fireEvent.click(moodButtons[3]);

    // Click submit
    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(4);
  });

  test('calls onDismiss when X button is clicked', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByLabelText(/cancel/i);
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  test('highlights selected mood', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    const moodButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.textContent.match(/submit|cancel/i));

    const selectedButton = moodButtons[2];
    fireEvent.click(selectedButton);

    // Check if button has mood-specific class
    expect(selectedButton.className).toMatch(/mood-3/);
  });

  test('can change mood selection', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    const moodButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.textContent.match(/submit|cancel/i));

    // Select mood 2
    fireEvent.click(moodButtons[1]);

    // Change to mood 4
    fireEvent.click(moodButtons[3]);

    // Submit
    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    // Should submit the last selected mood
    expect(mockOnSubmit).toHaveBeenCalledWith(4);
  });

  test('displays mood labels', () => {
    renderWithI18n(<MoodPrompt onSubmit={mockOnSubmit} onDismiss={mockOnDismiss} />);

    // Check for mood label text (these come from i18n)
    expect(screen.getByText(/Very Bad|Bad|Neutral|Good|Very Good/i)).toBeInTheDocument();
  });
});
