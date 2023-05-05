import * as WebBrowser from 'expo-web-browser';
import React, {Component} from 'react';
import {
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Dimensions,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from '../components/style';

const { width, height } = Dimensions.get('window');

export default class HomeScreen extends React.Component {
  state = {
    username: ''
  };

  async setData() {
    let values
    try {
      values = await AsyncStorage.multiGet(['username']);
      this.setState({
        username: values[0][1],
      })
    } catch (err) {
      console.log(err);
    }
  };

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'focus',
      () => { this.setData() },
    );
  };

  componentWillUnmount() {
    this.focusListener();
  };

  render() {
    const {navigate} = this.props.navigation;

    return (
      <View style={styles.container}>
          <Image
            style={{width: 300, height: 51}}
            source={require('../assets/images/peerdea-logo-draft.png')}
            accessible={true}
            accessibilityLabel="Peerdea app logo"
          />

          <Text style={styles.getStartedText}>Welcome to Peerdea, {this.state.username}!</Text>

          <View style={{width: '80%', justifyContent: 'center', alignItems: 'center'}}>
          <TouchableHighlight
           style={styles.buttonLargeLeft}
           onPress={() => navigate('CreateGroup')}
          >
            <Text style={styles.buttonText}>
              Create a new group
            </Text>
          </TouchableHighlight>
          <View style={{marginBottom: 5}} />
          <TouchableHighlight
           style={styles.buttonLargeLeft}
           onPress={() => navigate('JoinGroup')}
          >
            <Text style={styles.buttonText}>
              Join an existing group
            </Text>
          </TouchableHighlight>
          </View>
          </View>
    );
  }
}
