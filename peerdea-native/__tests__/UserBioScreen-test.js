import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow'

import SettingsScreen from '../screens/UserBioScreen';

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

describe('User bio Screen', () => {
  jest.useFakeTimers();

  it(`renders the user bio screen`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };
    const renderer = new ShallowRenderer();

    const tree = renderer.render(
      <SettingsScreen navigation={mockNavigation} />);
    expect(tree).toMatchSnapshot();
  });
});
