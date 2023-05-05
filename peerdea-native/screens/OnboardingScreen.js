import { Dimensions, Image, View, Animated, Platform } from 'react-native';
import React from 'react';
import { Button , Icon} from 'react-native-elements';
import Onboarding from 'react-native-onboarding-swiper';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');


export default class OnboardingScreen extends React.Component {
  scale = new Animated.Value(1);

  onPinchStateChange = (event) => {
    if (event.nativeEvent.numberOfPointers === 2){
      if (Platform.OS != "ios"){
        console.log("match");
        //have to have this separately because pinches are different in Android
        //and harder to detect 
        event.nativeEvent.oldState = State.ACTIVE;
        Animated.spring(this.scale, {
          toValue: 1,
          useNativeDriver: true
        }).start();
      }
      else if (event.nativeEvent.oldState === State.ACTIVE) {
        Animated.spring(this.scale, {
          toValue: 1,
          useNativeDriver: true
        }).start();
      }
    }
  }

  render(){
  return (
    <Onboarding
    containerStyles={{paddingTop: '15%', paddingBottom: '10%', flex: .5, justifyContent: 'flex-start',}}
    titleStyles={{ color: 'black', fontSize: 10, paddingLeft: '3%', paddingRight: '3%'}}
    subTitleStyles={{paddingLeft: '3%', paddingRight: '3%'}}
    onSkip={() => this.props.navigation.navigate('Home')}
    onDone={() => this.props.navigation.navigate('Home')}
    pages={[
      {
        backgroundColor: '#fff',
        image: (<Icon
          name="lightbulb-o"
          type="font-awesome"
          size={SCREEN_HEIGHT/4}
          color="#0076ff"
        />),
        title: 'Welcome to Peerdea!',
        subtitle: 'Swipe to learn how Peerdea is intended to help your design process by facilitating feedback in its early stages.',
      },
      {
        backgroundColor: '#fff',
        image: (
          <PinchGestureHandler
          onGestureEvent={
            Animated.event([{nativeEvent: { scale: this.scale }}],
            {useNativeDriver: true})
          }
          onHandlerStateChange={this.onPinchStateChange}>
            <Animated.Image
              source={require("../assets/images/create_group.jpg")}
              style={{
                width: SCREEN_WIDTH * 0.95,
                height: SCREEN_WIDTH * 0.7,
                transform: [{ scale: this.scale }]
              }}
              resizeMode='contain'
            />
          </PinchGestureHandler>
          ),
        title: 'As the name suggests, Peerdea leverages the power of peers!',
        subtitle: 'First, create a group on Peerdea. To invite your peers to join your group, share the group credentials with them securely.'
      },
      {
        backgroundColor: '#fff',
        image: (
        <PinchGestureHandler
        minPoints={2}
          onGestureEvent={Animated.event([{nativeEvent: { scale: this.scale }}],
            {useNativeDriver: true})
          }
          onHandlerStateChange={this.onPinchStateChange}>
            <Animated.Image
              source={require("../assets/images/i_like.jpg")}
              style={{
                width: SCREEN_WIDTH * 0.95,
                height: SCREEN_WIDTH * 0.7,
                transform: [{ scale: this.scale }]
              }}
              resizeMode='contain'
            />
          </PinchGestureHandler>
        ),
        title: 'Give your peers feedback!',
        subtitle: 'Once in a group, you are able to give feedback on design concepts (ideas, sketches, prototypes) you and your peers have shared. Giving feedback to others can help to foster relationships as well as improve your own creative practices.'
      },
      {
        backgroundColor: '#fff',
        image: (
          <PinchGestureHandler
          onGestureEvent={Animated.event([{nativeEvent: { scale: this.scale }}],
            {useNativeDriver: true})
          }
          onHandlerStateChange={this.onPinchStateChange}>
            <Animated.Image
              source={require("../assets/images/give_feedback.jpg")}
              style={{
                width: SCREEN_WIDTH * 0.95,
                height: SCREEN_WIDTH * 0.7,
                transform: [{ scale: this.scale }]
              }}
              resizeMode='contain'
            />
          </PinchGestureHandler>
        ),
        title: 'Want feedback on your ideas?',
        subtitle: 'Peerdea enables you to share your design concepts (ideas, sketches, prototypes), and pings your peers to let them know you are counting on them for feedback.'
      },
      {
        backgroundColor: '#fff',
        image: (<Icon
          name="book"
          type="font-awesome"
          size={SCREEN_HEIGHT/4}
          color="#0076ff"
         />),
        title: 'Document your Peerdea experiences in a diary!',
        subtitle: 'To help foster your reflections on asking for feedback on in-progress work, it may be helpful to describe your experiences using Peerdea in a notepad (we can provide you with one if interested!).'
      },
      {
        backgroundColor: '#fff',
        image: (<Icon
          name="heart"
          type="font-awesome"
          size={SCREEN_HEIGHT/4}
          color="#0076ff"
          />),
        title: 'Thank you for being a Peerdea Beta tester!',
        subtitle: 'If you run into any difficulties, please let us know. We value both positive and critical feedback on Peerdea.'
      }]}
    />);
  }
}
