/* eslint-env jest */
/* global describe, test, expect */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import SafetyBanner from '../SafetyBanner';
import i18n from '../../../i18n';

describe('SafetyBanner', () => {
  const renderWithI18n = (component) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  test('renders nothing for NONE risk level', () => {
    const { container } = renderWithI18n(<SafetyBanner riskLevel="NONE" />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when riskLevel is undefined', () => {
    const { container } = renderWithI18n(<SafetyBanner />);
    expect(container.firstChild).toBeNull();
  });

  test('renders low risk banner with correct styling', () => {
    renderWithI18n(<SafetyBanner riskLevel="LOW" />);

    const banner = screen.getByText(/support you/i).closest('div');
    expect(banner).toHaveClass('safety-banner-low');
  });

  test('renders medium risk banner', () => {
    renderWithI18n(<SafetyBanner riskLevel="MEDIUM" />);

    expect(screen.getByText(/check in with you/i)).toBeInTheDocument();
  });

  test('renders high risk banner', () => {
    renderWithI18n(<SafetyBanner riskLevel="HIGH" />);

    expect(screen.getByText(/concerned about you/i)).toBeInTheDocument();
  });

  test('renders critical risk banner', () => {
    renderWithI18n(<SafetyBanner riskLevel="CRITICAL" />);

    expect(screen.getByText(/Immediate help/i)).toBeInTheDocument();
  });

  test('displays crisis resources when provided', () => {
    const resources = [
      {
        name: 'Crisis Hotline',
        phoneNumber: '988',
        website: 'https://example.com',
        description: 'Available 24/7',
      },
    ];

    renderWithI18n(<SafetyBanner riskLevel="HIGH" crisisResources={resources} />);

    expect(screen.getByText('Crisis Hotline')).toBeInTheDocument();
    expect(screen.getByText('988')).toBeInTheDocument();
    expect(screen.getByText('Available 24/7')).toBeInTheDocument();
  });

  test('displays multiple crisis resources', () => {
    const resources = [
      { name: 'Hotline 1', phoneNumber: '988' },
      { name: 'Hotline 2', phoneNumber: '1-800-273-8255' },
    ];

    renderWithI18n(<SafetyBanner riskLevel="CRITICAL" crisisResources={resources} />);

    expect(screen.getByText('Hotline 1')).toBeInTheDocument();
    expect(screen.getByText('Hotline 2')).toBeInTheDocument();
  });

  test('displays moderation reason when provided', () => {
    renderWithI18n(
      <SafetyBanner riskLevel="HIGH" moderationReason="Message contains concerning language" />
    );

    expect(screen.getByText(/concerning language/i)).toBeInTheDocument();
  });

  test('renders alert icon', () => {
    renderWithI18n(<SafetyBanner riskLevel="HIGH" />);

    // Lucide icons render as SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
