import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow'

import ShareConcept from '../screens/ShareConceptScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Share concept Screen', () => {
  jest.useFakeTimers();

  it(`renders the share concept screen`, () => {
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
      <ShareConcept navigation={mockNavigation} />);
    expect(tree).toMatchSnapshot();
  });
});
