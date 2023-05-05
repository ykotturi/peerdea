import React from 'react';
import renderer from 'react-test-renderer';

import CreateUserScreen from '../screens/CreateUserScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-keyboard-aware-scroll-view', () => {
  return {
    KeyboardAwareScrollView: jest
      .fn()
      .mockImplementation(({ children }) => children),
  };
});

describe('Create User Screen', () => {
  jest.useFakeTimers();

  it(`renders the create user screen`, () => {
    const tree = renderer.create(<CreateUserScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
