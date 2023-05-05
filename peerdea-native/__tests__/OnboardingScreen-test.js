import React from 'react';
import renderer from 'react-test-renderer';

import OnboardingScreen from '../screens/OnboardingScreen';

describe('Onboarding Screen', () => {
  jest.useFakeTimers();

  it(`renders the onboarding screen`, () => {
    const mockNavigation = {
      navigate: jest.fn(),
      addListener: jest.fn().mockImplementation((event, callback) => {
        callback();
        //returning value for `navigationSubscription`
        return { remove: jest.fn() }
      }),
    };

    const tree = renderer.create(
      <OnboardingScreen navigation={mockNavigation} />);
    expect(tree.toJSON()).toMatchSnapshot();

    var textList = tree.root.findAllByType('Text')
    
    textList.forEach((el) => {
      if (el.props.children === 'Skip') {
        el.parent.parent.props.onClick()
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Home')
      }
    })
  });
});
