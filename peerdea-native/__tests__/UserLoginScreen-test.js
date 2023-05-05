import React from 'react';
import renderer from 'react-test-renderer';

import UserLoginScreen from '../screens/UserLoginScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Login Screen', () => {
  jest.useFakeTimers();

  it(`renders the login screen`, () => {
    const tree = renderer.create(<UserLoginScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
