import React from 'react';
import renderer from 'react-test-renderer';

import HomeScreen from '../screens/HomeScreen';

describe('Home Screen', () => {
  jest.useFakeTimers();

  it(`renders the home screen`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };

    const tree = renderer.create(
      <HomeScreen navigation={mockNavigation} />);
    expect(tree.toJSON()).toMatchSnapshot();

    var textList = tree.root.findAllByType('Text')
    
    textList.forEach((el) => {
      if (el.props.children === 'Sign up') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateUser')
      }
      else if (el.props.children === 'Log in') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('UserLogin')
      }
      else if (el.props.children === 'Learn more about Peerdea!') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Onboarding')
      }
    })
  });
});
