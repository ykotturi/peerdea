import React from 'react';
import renderer from 'react-test-renderer';

import HomeHome from '../screens/HomeHomeScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Home home Screen', () => {
  jest.useFakeTimers();

  it(`renders the home home screen without any groups`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };

    const tree = renderer.create(
      <HomeHome navigation={mockNavigation} />);
    expect(tree.toJSON()).toMatchSnapshot();

    var textList = tree.root.findAllByType('Text')
    
    textList.forEach((el) => {
      if (el.props.children === 'Join or create a group here!') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('GroupOptions')
      }
    })
  });
});
