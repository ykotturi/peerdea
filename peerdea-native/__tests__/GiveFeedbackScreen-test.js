import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow'

import GiveFeedback from '../screens/GiveFeedbackScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-autolink', () => {
  return {
    Autolink: jest
      .fn()
      .mockImplementation(({ children }) => children),
  };
});

describe('Give Feedback Screen', () => {
  jest.useFakeTimers();

  const mockNavigation = {
    navigate: jest.fn(),
    addListener: jest.fn().mockImplementation((event, callback) => {
      callback();
      //returning value for `navigationSubscription`
      return { remove: jest.fn() }
    }),
  };
  const renderer = new ShallowRenderer();

  it(`renders the give feedback screen loading`, () => {
    const tree = renderer.render(<GiveFeedback navigation={mockNavigation} />);
    expect(tree).toMatchSnapshot();
  });
});
