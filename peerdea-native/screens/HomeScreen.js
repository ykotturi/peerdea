import * as WebBrowser from 'expo-web-browser';
import React, {Component} from 'react';
import {
  Button,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Dimensions,
} from 'react-native';
import styles from '../components/style';
import statusCheck from "../components/StatusCheck.js";


export default class HomeScreen extends React.Component {
  static navigationOptions = {
    header: null
  };

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'focus',
      async () => {
        var status = await statusCheck();
        if (status == "down"){
          this.props.navigation.navigate("Maintenance");
          return;
        }
      },
    );
  }

  render() {
    const {navigate} = this.props.navigation;
    return (
      <View style={styles.container}>

          <Image
            style={{width: 300, height: 50}}
            source={require('../assets/images/peerdea-logo-draft.png')}
            accessible={true}
            accessibilityLabel="Peerdea app logo"
          />

          <Text style={styles.getStartedText}>Welcome to Peerdea</Text>

          <TouchableHighlight
           style={styles.buttonSmallLeft}
           onPress={() => navigate('CreateUser')}
          >
            <Text style={styles.buttonText}>
              Sign up
            </Text>
          </TouchableHighlight>

          <View style={{padding: 5}} />

          <TouchableHighlight
           style={styles.buttonSmallLeft}
           onPress={() => navigate('UserLogin')}
          >
            <Text style={styles.buttonText}>
              Log in
            </Text>
          </TouchableHighlight>

          <View style={{padding: 5}} />

          <TouchableHighlight
           underlayColor="#CECECE"
           onPress={() => navigate('Onboarding')}
          >
            <Text style={{fontSize: 18, color: "#777777", textDecorationLine: "underline"}}>
              Learn more about Peerdea!
            </Text>
          </TouchableHighlight>

      </View>
    );
  }
}
