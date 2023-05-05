import React from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import statusCheck from "../components/StatusCheck.js";

export default class AuthLoadingScreen extends React.Component {
  componentDidMount() {
    this.load();
  }

  // Fetch the token from storage then navigate to our appropriate place
  load = async () => {
    const value = await AsyncStorage.multiGet(["username", "loggedin"]);
    const userToken = value[0][1];
    const loggedin = value[1][1];

    var status = await statusCheck();
    var nextScreen = "Auth";
    if (status == "down") {
      nextScreen = "Maintenance";
    } else if (loggedin && userToken) {
      nextScreen = "Main";
    }

    // This will switch to the App screen or Auth screen or Maintenance Screen and this loading
    // screen will be unmounted and thrown away.
    this.props.navigation.navigate(nextScreen);
  };

  // Render any loading content that you like here
  render() {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }
}
