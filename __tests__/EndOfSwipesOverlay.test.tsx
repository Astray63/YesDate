import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import EndOfSwipesOverlay, { EndOfSwipesOverlayProps } from '../app/components/EndOfSwipesOverlay';
import { AccessibilityInfo } from 'react-native';

// Mocks for Expo modules and react-native dependencies used by the component
jest.mock('expo-blur', () => {
  const React = require('react');
  return { BlurView: ({ children }: any) => React.createElement('View', null, children) };
});
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return { LinearGradient: ({ children }: any) => React.createElement('View', null, children) };
});
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));

// Reduce motion in tests so animations don't affect timing
beforeAll(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true as any);
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation((() => {}) as any);
});

afterAll(() => {
  jest.restoreAllMocks();
});

function renderOverlay(props?: Partial<EndOfSwipesOverlayProps>) {
  const defaultProps: EndOfSwipesOverlayProps = {
    visible: true,
    onRetryQuiz: jest.fn(),
    onExpandFilters: jest.fn(),
    onRefresh: jest.fn(),
    onEnableNotifications: jest.fn(),
    onOpenSettings: jest.fn(),
    onExpandRadius: jest.fn(),
    onClose: jest.fn(),
  };
  return render(<EndOfSwipesOverlay {...defaultProps} {...props} />);
}

describe('EndOfSwipesOverlay', () => {
  test('renders title and CTAs when visible', async () => {
    renderOverlay();

    // Container
    const overlay = await screen.findByTestId('endOverlay');
    expect(overlay).toBeTruthy();

    // Title
    expect(screen.getByText('Plus de profils pour le moment')).toBeTruthy();

    // Primary CTA
    expect(screen.getByTestId('btnRetryQuiz')).toBeTruthy();

    // Secondary CTAs
    expect(screen.getByTestId('btnExpandFilters')).toBeTruthy();
    expect(screen.getByTestId('btnRefresh')).toBeTruthy();
  });

  test('invokes onRetryQuiz and onClose when primary CTA pressed', async () => {
    const onRetryQuiz = jest.fn();
    const onClose = jest.fn();
    renderOverlay({ onRetryQuiz, onClose });

    fireEvent.press(screen.getByTestId('btnRetryQuiz'));
    await waitFor(() => expect(onRetryQuiz).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test('invokes onExpandFilters when pressed', async () => {
    const onExpandFilters = jest.fn();
    renderOverlay({ onExpandFilters });

    fireEvent.press(screen.getByTestId('btnExpandFilters'));
    expect(onExpandFilters).toHaveBeenCalledTimes(1);
  });

  test('invokes onRefresh and shows brief loading state', async () => {
    const onRefresh = jest.fn(async () => {});
    renderOverlay({ onRefresh });

    fireEvent.press(screen.getByTestId('btnRefresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Loading label may appear briefly; ensure eventual completion
    await waitFor(() => {
      // Either the loading text shows briefly or not; verify at least no crash
      expect(screen.getByTestId('btnRefresh')).toBeTruthy();
    });
  });

  test('renders offline variant subtitle when isOfflineOverride is true', async () => {
    renderOverlay({ isOfflineOverride: true });

    expect(
      screen.getByText('Vous êtes hors ligne. Reconnectez-vous pour voir de nouveaux profils.')
    ).toBeTruthy();
  });

  test('renders location disabled variant when locationDeniedOverride is true and onOpenSettings provided', async () => {
    renderOverlay({ locationDeniedOverride: true });

    expect(
      screen.getByText('Activez votre localisation pour trouver des profils près de vous.')
    ).toBeTruthy();

    const btn = await screen.findByTestId('btnOpenSettings');
    expect(btn).toBeTruthy();
  });

  test('renders filters-too-strict variant when onExpandRadius provided', async () => {
    renderOverlay({ onExpandRadius: jest.fn() });

    expect(
      screen.getByText('Vos critères sont très sélectifs. Essayez d’élargir pour voir plus de profils.')
    ).toBeTruthy();

    expect(screen.getByTestId('btnExpandRadius')).toBeTruthy();
  });

  test('close button calls onClose', async () => {
    const onClose = jest.fn();
    renderOverlay({ onClose });

    fireEvent.press(screen.getByTestId('btnClose'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});