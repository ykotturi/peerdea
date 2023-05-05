import React from 'react';
import { Button,
		  Dimensions,
          Image,
          View,
          StyleSheet,
          Text,
          TouchableOpacity,
          TouchableHighlight,
          Alert,
          ScrollView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
const { width, height } = Dimensions.get('window');
import statusCheck from "../components/StatusCheck.js";
import {DOCKER_URL} from "@env"

export default class HomeHome extends React.Component {

  state = {
    username: null,
    groups: [],
    loaded: false,
  };

  static logOut(nav) {
    nav.navigate('Auth', { screen: 'Home' });
    AsyncStorage.clear();

  }

  static navigationOptions(navigation) {
    return {
      title: 'Home', 
      headerLeft: () => (
        <TouchableHighlight
          underlayColor="#CECECE"
          onPress={() => this.logOut(navigation)}
          style={{marginTop: 7, marginLeft: 10}}
        >
          <Text style={{fontSize: 18, color: "#0076ff", textDecorationLine: "underline"}}>
            {"Log out"}
          </Text>
        </TouchableHighlight>)
    };
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'focus',
      async () => {
				var status = await statusCheck();
		    if (status == "down"){
		      this.props.navigation.navigate('Maintenance');
					return;
		    }
      	await this.getUser();
      	await this.getGroups();
      },
    );
    this.registerForPushNotifications();
  };

  componentWillUnmount() {
    this.focusListener();
  }

  async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("got here 1");
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("got here 2");
    }

    if (finalStatus !== 'granted') {
      console.log("got here 3");
      return;
      console.log("got here 4");
    }

    let token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("token is " + token);

    query = `
      mutation{
        addTokenToUser(username: "${this.state.username}", token: "${token}"){
        pushTokens
      }
    }`;
    await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'POST'});

  }

  async getUser() {
    let value
    try {
      value = await AsyncStorage.multiGet(['username']);
      this.setState({username: value[0][1]});
    } catch (err) {
      console.log(err);
    }
  }

  async getGroups() {
    var query = `
   	  query{
        user(username:"${this.state.username}") {
          groups
        }
      }`;
   	const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    var groups = resJson.data.user.groups;
		if (groups[0] === "Ppppp" || groups[0] === "Ppp")
			groups = [];
    this.setState({groups:groups});
    // this block is in case someone gets removed from a group.
    // in asyncstorage, there's a group name stored. this name dictates 
    // if a person sees a group. here, the user's list of groups is also fetched.
    // we check if the group name from AsyncStorage is found in the user's list.
    // if it isn't and the user has other groups, one of those other groups is set.
    // otherwise, we remove the groupName attribute from AsyncStorage
    var groupName = await AsyncStorage.multiGet(['groupName']);
    groupName = groupName[0][1]
    if (!groups.includes(groupName)) {
        await AsyncStorage.removeItem(
          "groupName");
    }
  }

  async joinGroup(group) {
    var query = `query{group(name:"${group}") {id} }`
    const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    id = resJson.data.group.id;
    await AsyncStorage.multiSet([
          ["groupName", group],
          ["groupID", id],
        ]);
    this.props.navigation.navigate('Third');
  }

  render() {
    if(this.state.groups.length == 0) {
      return(
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: "#fff"}}>
          <Text style={styles.noGroupsHeader}>You're not a member of any Peerdea groups yet!</Text>
          <TouchableHighlight
            underlayColor="#CECECE"
          	onPress={() => { this.props.navigation.navigate('GroupOptions') }}>
	          <Text style={styles.noGroupsText}>
	          		Join or create a group here!
	          </Text>
	      </TouchableHighlight>
        </View>
      );
    } else {
        return(
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: "#fff" }}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.getStartedText}>Click the group you'd like to enter:</Text>
          {this.state.groups.map(group => (
          	<TouchableHighlight
          	  key={group}
         	    style={styles.groupButton}
         	    onPress={async () => await this.joinGroup(group) }
        	   >
          	  <Text style={{paddingHorizontal: width * 0.10, fontSize: 20, color: "#ffffff"}}>
          		  {group}
              </Text>
        	   </TouchableHighlight>
          ))}

          <TouchableHighlight
            underlayColor="#CECECE"
            onPress={() => { this.props.navigation.navigate('GroupOptions') }}>
            <Text style={styles.noGroupsText}>
                Join or Create another group
            </Text>
          </TouchableHighlight>
        </ScrollView>
        </View>
        );
      }
  }

}

const styles = StyleSheet.create({
  groupButton: {
    marginTop: 10,
    paddingTop: 15,
    paddingBottom: 0,
    borderWidth:1,
    borderRadius: 9,
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    width: width * 0.8,
    height: 60,
  },
  container: {
    paddingTop: 30,
    paddingBottom: 30,
    flex: 1,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 20,
    textAlign: 'center',
  },
  noGroupsText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 30,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  noGroupsHeader: {
    fontSize: 25,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 40,
    textAlign: 'center'
  },
  contentContainer: {
    paddingTop: 20,
  },
   absoluteView: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
