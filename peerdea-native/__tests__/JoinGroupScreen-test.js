import React from 'react';
import renderer from 'react-test-renderer';

import JoinGroupScreen from '../screens/JoinGroupScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Join group Screen', () => {
  jest.useFakeTimers();

  it(`renders the join group screen`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };

    const tree = renderer.create(
      <JoinGroupScreen navigation={mockNavigation} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
