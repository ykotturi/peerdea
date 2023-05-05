import React from "react";
import {
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
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
// import { WebBrowser } from "expo";
// import { Button } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Sha256 from "../components/sha256.js";
import styles from "../components/style";
const { width, height } = Dimensions.get("window");
import {DOCKER_URL} from "@env"

export default class JoinGroupScreen extends React.Component {
  state = {
    groupName: "",
    groupPassword: "",
  };

  async onJoin() {
    try {
      var groupName = this.state.groupName;
      var values = await AsyncStorage.multiGet(["username"]);
      var username = values[0][1];
      var values = await AsyncStorage.multiGet(["username"]);
      var username = values[0][1];
      var query = `query{group(name: "${groupName}"){name password id}}`;
      //check if the group exists first
      const checkRes = await fetch(
        `http://${DOCKER_URL}/graphql?query=` + query,
        { method: "GET" }
      );
      const checkResJson = await checkRes.json();
      var groupID;
      if (checkResJson.data.group != null)
        var groupID = checkResJson.data.group.id;
      //if the group does not exist, notify the user to create a new group name
      if (checkResJson.data.group == null) {
        //new error checking for graphQL
        Alert.alert(
          "Group " + groupName + " does not exist",
          "Please try again with a different group name",
          [{ text: "OK", onPress: () => console.log("OK Pressed") }],
          { cancelable: false }
        );
      }
      // //if the group password is incorrect, notify the user
      // else if (
      //   unhashed != checkResJson.data.group.password &&
      //   checkResJson.data.group.password != null &&
      //   groupPassword != checkResJson.data.group.password
      // ) {
      //   Alert.alert("Your group password is incorrect.");
      // }
      //if the group exists, redirect the screen to the create concept screen
      else {
        await AsyncStorage.multiSet([
          ["groupName", groupName],
          ["groupID", groupID],
        ]);

        //add user to list of users in the group
        userList = `query{group(name: "${groupName}"){users}}`;
        const checkResUserList = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + userList,
          { method: "GET" }
        );
        const checkResUserListJson = await checkResUserList.json();
        //decreased to 5 for debugging, return to 25 for live deployments
        if (
          checkResUserListJson.data.group.users.length >= 25 &&
          !checkResUserListJson.data.group.users.includes(username)
        ) {
          Alert.alert(
            "This group is already full! Try creating or joining another group."
          );
          return;
        } else if (
          checkResUserListJson.data.group.users.includes(username) == false
        ) {
          var addUser = `
          mutation {
            addUserToGroup(username: "${username}", groupName: "${groupName}"){
              users
            }
          }`;
          const checkAddUser = await fetch(
            `http://${DOCKER_URL}/graphql?query=` + addUser,
            { method: "POST" }
          );
          const checkAddUserJson = await checkAddUser.json();

          //check if the group is already in the user's groups record
          query = `query{user(username: "${username}"){groups}}`;
          const checkRes = await fetch(
            `http://${DOCKER_URL}/graphql?query=` + query,
            { method: "GET" }
          );
          const checkResJson = await checkRes.json();

          //if the group is not in the groups record, add it
          if (
            checkResJson.data.user.groups == null ||
            checkResJson.data.user.groups.includes(groupName) == false
          ) {
            query = `
            mutation{
              addGroupToUser(username: "${username}", groupName: "${groupName}"){
                groups
              }
            }`;
            const checkAddGroup = await fetch(
              `http://${DOCKER_URL}/graphql?query=` + query,
              { method: "POST" }
            );
            const checkAddGroupJson = await checkAddGroup.json();
          }
        }

        this.props.navigation.navigate("Third");
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
              <Text style={styles.getStartedText}>Join a group below:</Text>

              <TextInput
                accessibilityLabel="groupName"
                style={styles.hintText}
                onChangeText={(text) =>
                  this.setState({ groupName: text.trim() })
                }
                placeholder="Enter your group name"
                //workaround to prevent autofill
                textContentType="oneTimeCode"
                ref={(ref) => {
                  this._groupNameinput = ref;
                }}
                returnKeyType="next"
                onSubmitEditing={() =>
                  this._groupPasswordinput && this._groupPasswordinput.focus()
                }
                blurOnSubmit={false}
              />

              {/* <TextInput
                accessibilityLabel="groupPassword"
                style={styles.hintText}
                onChangeText={(text) => this.setState({ groupPassword: text })} //don't trim the text, as passwords can end in whitespace
                placeholder="Enter your group password"
                secureTextEntry={true}
                //workaround to prevent autofill
                textContentType="oneTimeCode"
                ref={(ref) => {
                  this._groupPasswordinput = ref;
                }}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={false}
              /> */}

              <TouchableHighlight
                style={styles.buttonLargeLeft}
                onPress={() => this.onJoin()}
              >
                <Text style={styles.buttonText}>Join group</Text>
              </TouchableHighlight>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    );
  }
}
