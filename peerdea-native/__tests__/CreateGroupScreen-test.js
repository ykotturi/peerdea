import React from 'react';
import renderer from 'react-test-renderer';

import CreateGroupScreen from '../screens/CreateGroupScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Create Group Screen', () => {
  jest.useFakeTimers();

  it(`renders the create group screen`, () => {
    const tree = renderer.create(<CreateGroupScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
