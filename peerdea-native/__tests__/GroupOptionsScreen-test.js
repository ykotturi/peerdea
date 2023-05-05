import React from 'react';
import renderer from 'react-test-renderer';

import GroupOptionsScreen from '../screens/GroupOptionsScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Group options Screen', () => {
  jest.useFakeTimers();

  it(`renders the group options screen`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };

    const tree = renderer.create(
      <GroupOptionsScreen navigation={mockNavigation} />);
    expect(tree.toJSON()).toMatchSnapshot();
    
    var textList = tree.root.findAllByType('Text')
    
    textList.forEach((el) => {
      if (el.props.children === 'Create a new group') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateGroup')
      }
      else if (el.props.children === 'Join an existing group') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('JoinGroup')
      }
    })
  });
});
