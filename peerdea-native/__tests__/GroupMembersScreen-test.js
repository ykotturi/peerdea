import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow'

import GroupMembersScreen from '../screens/GroupMembersScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Group members Screen', () => {
  jest.useFakeTimers();

  it(`renders the group members screen`, () => {
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
      <GroupMembersScreen navigation={mockNavigation} />);
    expect(tree).toMatchSnapshot();
  });
});
