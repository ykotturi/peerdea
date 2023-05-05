import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import styles from '../components/style';
import statusCheck from "../components/StatusCheck.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default class MaintenanceScreen extends React.Component {
  componentDidMount() {
    this.load();
  }

  // Fetch the token from storage then navigate to our appropriate place
  load = async () => {
    const value = await AsyncStorage.multiGet(['username', 'loggedin']);
    const userToken = value[0][1];
    const loggedin = value[1][1];

    var status = await statusCheck();
    if (status == "up"){
      this.props.navigation.navigate((loggedin && userToken) ? "Main":"Auth");
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <Text style={{textAlignVertical: "center",textAlign: "center", color: "blue",fontSize : 25,}}> Peerdea is currently under maintenance--we are working hard to make it better based on your feedback! {'\n'}{'\n'} Please check back later. {'\n'}{'\n'} Thanks, {'\n'} Jenny, Yasmine, and the Peerdea Team! </Text>
      </View>
    );
  }
}
