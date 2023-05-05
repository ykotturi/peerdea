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
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
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
    groupName: "",
    groupID: "",
  };

  async onCreate() {
    var groupName = this.state.groupName;
    //to see if a group with same groupname exists
    var query = `query{group(name: "${groupName}"){name id}}`;
    //to create a group
    var mutation = `mutation{addGroup(name:"${groupName}"){name}}`;
    //check if the group exists first
    try {
      let checkRes = await fetch(
        `http://${DOCKER_URL}/graphql?query=` + query,
        { method: "GET" }
      );
      let checkResJson = await checkRes.json();
      console.log("checkResJson.data.group is " + checkResJson.data.group);
      if (checkResJson.data.group !== null) {
        Alert.alert(
          "Group name " + groupName + " already exists",
          "Please try again with a different group name",
          [{ text: "OK", onPress: () => console.log("OK Pressed") }],
          { cancelable: false }
        );
      }
      //the group does not exist, so create it
      else {
        var username = ""
        var value = await AsyncStorage.multiGet(["username"]);
        if (value[0][1] !== null || value[0][1] !== undefined) {
          console.log(value[0][1]);
          username = value[0][1];
        }
        mutation = `mutation{addGroup(name:"${groupName}", groupOwner: "${username}"){name groupOwner}}`;
        let createRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + mutation,
          { method: "POST" }
        );
        let createResJson = await createRes.json();
        //TODO not sure the is the right check to make sure the post was successful

        let getIDRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + query,
          { method: "GET" }
        );
        let getIDResJson = await getIDRes.json();

        //after youve created a group, then add the user to the group, and the group to user
        this.setState({ groupID: getIDResJson.data.group.id });
        await AsyncStorage.multiSet([
          ["groupName", this.state.groupName],
          ["groupID", this.state.groupID],
        ]);
          //newly created groups always get added to a user's record of groups
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

          //add user to list of users in this group
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
          const checkAddUsereJson = await checkAddUser.json();
          this.props.navigation.navigate("Third");
        }
    } catch (err) {
      console.log(err);
      Alert.alert("There was an error. Please try again.");
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
              <Text style={styles.getStartedText}>
                Create a new group below:
              </Text>

              <TextInput
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

              <TouchableHighlight
                style={styles.buttonLargeLeft}
                onPress={() => this.onCreate()}
              >
                <Text style={styles.buttonText}>Create group</Text>
              </TouchableHighlight>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    );
  }
}
