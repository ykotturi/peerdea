import React from "react";
import * as WebBrowser from "expo-web-browser";
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
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sha256 from "../components/sha256.js";
import styles from "../components/style";
const { width, height } = Dimensions.get("window");
import {DOCKER_URL} from "@env"

// first, should check to make sure valid group name (numbers and letters only, longer than 5 characters)
// then, there should be some check as to whether the group name is already taken
// if not already taken, submit API post request to create a new group
// if it is taken, catch error and say group name already taken

export default class CreateGroupScreen extends React.Component {
  state = {
    username: "",
    password: "",
  };

  async onLogin() {
    try {
      var username = this.state.username;
      var unhashed = this.state.password;
      var password = Sha256.hash(unhashed);
      var query = `query{user(username: "${username}"){username password id}}`;
      //check if the user exists first
      const checkRes = await fetch(
        `http://${DOCKER_URL}/graphql?query=` + query,
        { method: "GET" }
      );
      const checkResJson = await checkRes.json();

      //if the user doesn't exist, notify the user to create a new profile
      if (checkResJson.data.user == null) {
        Alert.alert(
          "User " + username + " does not exist",
          "Please try again with a different username",
          [{ text: "OK", onPress: () => console.log("OK Pressed") }],
          { cancelable: false }
        );
      }
      //if password is incorrect, notify user
      else if (
        password != checkResJson.data.user.password &&
        checkResJson.data.user.password != null &&
        unhashed != checkResJson.data.user.password
      ) {
        console.log("got here4");
        Alert.alert("Your username or password is incorrect.");
      }
      //if the group does not exist, create a new group with the name
      //and redirect the screen to the create concept screen
      else {
        await AsyncStorage.multiSet([
          ["username", this.state.username],
          ["loggedin", "true"],
        ]);
        this.props.navigation.navigate('Main', { screen: 'First' });
      }
    } catch (err) {
      console.log(err);
    }
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          style={{ width: "100%", backgroundColor: "#fff" }}
        >
          <KeyboardAvoidingView enabled>
            <View style={styles.container}>
              <Image
                style={{ width: 300, height: 51 }}
                source={require("../assets/images/peerdea-logo-draft.png")}
                accessible={true}
                accessibilityLabel="Peerdea app logo"
              />
              <Text style={styles.getStartedText}>Log into your profile:</Text>

              <TextInput
                style={styles.hintText}
                onChangeText={(text) =>
                  this.setState({ username: text.trim() })
                }
                placeholder="Enter your username"
                //workaround to prevent autofill
                textContentType="oneTimeCode"
                ref={(ref) => {
                  this._usernameinput = ref;
                }}
                returnKeyType="next"
                onSubmitEditing={() =>
                  this._passwordinput && this._passwordinput.focus()
                }
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.hintText}
                onChangeText={(text) => this.setState({ password: text })}
                placeholder="Enter your password"
                secureTextEntry={true}
                //workaround to prevent autofill
                textContentType="oneTimeCode"
                ref={(ref) => {
                  this._passwordinput = ref;
                }}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={false}
              />

              <TouchableHighlight
                style={styles.buttonLargeLeft}
                onPress={() => this.onLogin()}
              >
                <Text style={styles.buttonText}>Log in</Text>
              </TouchableHighlight>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    );
  }
}
