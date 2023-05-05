import React, { Component } from 'react';
import { Image,
          View,
          StyleSheet,
          Button,
          Text,
          TouchableOpacity,
          TouchableHighlight,
          TextInput,
          Alert,
          ScrollView,
          Modal,
          ActivityIndicator,
          Pressable,
          RefreshControl,
          Dimensions} from 'react-native';
import { Buffer } from 'buffer';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');
import statusCheck from "../components/StatusCheck.js";
import styles from "../components/style";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {DOCKER_URL} from "@env"

export default class GroupMembersScreen extends React.Component {
  static navigationOptions(route) {
    const {params} = route;

    return {
      title: params ? params.title : 'Group Members', 
      headerLeft: ()=> null,
      headerRight: () => (
        <Button
          onPress={route.params?.displayAlert}
          title="Invite"
          accessibilityLabel="Invite button"
        />
      )
    };
  }

  state = {
    loading: false,
    members: [],
    currentUser: '',
    username: '',
    bio: '',
    email: '',
    goal: '',
    concepts: [],
    profilePic: [],
    modalVisible: false,
    finalImages: [],
    groupOwner: "",
    groupName: "",
    modalVisible: false,
    inviteModalVisible: false,
    showMessageMessage: true,
    inviteLink: '',
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'focus',
      () => { this.getData() },
    );
    this.props.navigation.setParams({ displayAlert: this._displayAlert });
  };

  componentWillUnmount() {
    this.focusListener();
  }

  async getData() {
    var status = await statusCheck();
    if (status == "down"){
      this.props.navigation.navigate("Maintenance");
      return;
    }

    var values = await AsyncStorage.multiGet(['groupName', 'username']);
    var groupName = values[0][1];
    var username = values[1][1]
    
    userList = `query{group(name: "${groupName}"){users groupOwner}}`;
    const checkResUserList = await fetch(`http://${DOCKER_URL}/graphql?query=` + userList, {method: 'GET'});
    const checkResUserListJson = await checkResUserList.json();
    this.setState({
      currentUser: username,
      groupName: groupName,
      members: checkResUserListJson.data.group.users,
      groupOwner: checkResUserListJson.data.group.groupOwner,
    });
    this.props.navigation.setParams({title: `${groupName} - Members`})
  }

  async removeUser (username) {
    try {
      if (username != null && this.state.currentUser == this.state.groupOwner) {
        var mutation = `mutation{removeUserFromGroup(group_name: "${this.state.groupName}", user: "${username}"){users}}`
        var mutationOther = `mutation{removeGroupFromUser(user: "${username}", group_name: "${this.state.groupName}"){groups}}`
        let removeUserRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + mutation,
          { method: "POST" }
          );
        let removeGroupRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + mutationOther,
          { method: "POST" }
        );
        let removeUserResJson = await removeUserRes.json();
        Alert.alert(`Removed ${username}`)
        let removeGroupResJson = await removeGroupRes.json();
        userList = `query{group(name: "${this.state.groupName}"){users groupOwner}}`;
        const checkResUserList = await fetch(`http://${DOCKER_URL}/graphql?query=` + userList, {method: 'GET'});
        const checkResUserListJson = await checkResUserList.json();
        this.setState({
          members: checkResUserListJson.data.group.users,
        });
      } 
    } catch (err) {
      console.log(err);
      Alert.alert("There was an error. Please try again, or reach out to the Peerdea team cheerpeerapp@gmail.com");
    }
  }
  copyToClipboard = async (message) => {
    try {
      await Clipboard.setStringAsync(message);
    } catch (e) {
      console.error("Error with copying to clipboard: " + e);
    }
    this.setState({ showMessageMessage: false })
    // this.setModalVisible(!this.state.modalVisible)
  };
  _displayAlert = () => {
    var link = "https://cheerpeer-invite.vercel.app/?group_name=" + encodeURIComponent(this.state.groupName)
    this.setState({inviteModalVisible: true, inviteLink: link})
  };
  renderInviteModal = () => {
    var messageString = `Hi I'm inviting you to join my group on Peerdea! Follow this link for the quick steps needed to install the Peerdea application: ${this.state.inviteLink}\nRemember, you're just a few steps away from getting and giving support to other entrepreneurs!`
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.inviteModalVisible}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {this.state.showMessageMessage ? this.renderMessageMessage(messageString) : this.renderCopyMessage()}

          </View>
        </View>
      </Modal>
    )
  }
  setInviteModalVisible = (visible) => {
    this.setState({ inviteModalVisible: visible, showMessageMessage: true });
  }
  renderCopyMessage() {
    return(
      <View>
        <Ionicons size={42} name="checkmark" color="green" style={{alignSelf: "center"}} />
        <Text style={{marginBottom: 12}}>Message successfully copied!</Text>
        <Pressable
            style={styles.modalButton}
            accessibilityLabel="Close button"
            onPress={() => this.setInviteModalVisible(!this.state.inviteModalVisible)}
          ><Text style={{color: "white"}}>Close</Text>
        </Pressable>
      </View>
    )
  }
  renderMessageMessage(messageString) {
    return(
      <View>
        <Text style={styles.modalHeader}>Send this text message to those who you would like to join your Peerdea group!</Text>
        <Text selectable={true}>{messageString}</Text>
        <View style={styles.buttonRow}>
          <Pressable
              style={styles.modalButton}
              onPress={() => this.copyToClipboard(messageString)}
              ><Text style={{color: "white"}}>Copy Message</Text>
          </Pressable>
          <Pressable
            style={styles.modalButton}
            onPress={() => this.setInviteModalVisible(!this.state.inviteModalVisible)}
            ><Text style={{color: "white"}}>Close</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  async setProfile(username){
    this.setState({loading: true})
    var userInfo = `
    query{
      user(username: "${username}"){
        bio
        email
        goal
        concepts
        profilePic{
          data
        }
      }
    }`;
    const checkResUserInfo = await fetch(`http://${DOCKER_URL}/graphql?query=` + userInfo, {method: 'GET'});
    // console.log("response values are " + Object.values(checkResUserInfo));
    const checkResUserInfoJson = await checkResUserInfo.json();
    var goallist = checkResUserInfoJson.data.user.goal;
    var latest_goal = goallist[goallist.length - 1]; 
    this.setState({
      username: username,
      bio: checkResUserInfoJson.data.user.bio,
      email: checkResUserInfoJson.data.user.email,
      goal: latest_goal,
      concepts: checkResUserInfoJson.data.user.concepts,
      profilePic: checkResUserInfoJson.data.user.profilePic,
      loading: false,
    });

    var images = [];
    for (var imageI = 0; imageI < this.state.profilePic.length; imageI++){
        const buff = new Buffer(this.state.profilePic[imageI].data);
        const base64data = buff.toString('base64');
        const uriString = `data:image/gif;base64,${base64data}`;
        images.push(uriString);
    }
    this.setState({finalImages: images, modalVisible: true});
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: "#fff"}} pointerEvents={this.state.loading ? 'none' : 'auto'}>
        <this.renderInviteModal/>
        <ScrollView persistentScrollbar={true}>
            <View>
            {
              this.state.members.map((username) => {
                if (username != "undefined"){
                  return (
                    <View 
                    key={username}
                    style={{flexDirection: "row", justifyContent: "center"}}
                    >
                      {username != this.state.groupOwner && 
                      this.state.currentUser == this.state.groupOwner &&
                        <Ionicons
                          name="close"
                          size={26}
                          style={{paddingRight: 24, marginTop: "auto", marginBottom: "auto"}}
                          color="red"
                          accessible={true}
                          accessibilityLabel="delete this group member"
                          onPress={() => Alert.alert("Remove Member?", "Are you sure you want to remove this user from your group?",
                          [
                            {
                              text: "Cancel",
                              style: "cancel",
                            },
                            {
                              text: "Remove",
                              onPress: () => this.removeUser(username),
                              style: "default",
                            },
                          ],
                          {
                            cancelable: true,
                          }
                          )}
                        />
                      }
                      {username == this.state.groupOwner &&
                        <Ionicons
                          name="star"
                          size={26}
                          style={{marginTop: "auto", marginBottom: "auto"}}
                          color="#f1c40f"
                          accessible={true}
                          accessibilityLabel="group admin"
                          onPress={() => Alert.alert(`${this.state.groupOwner} is the group owner`)}
                        />
                      }
                      {/* add padding here to make each username element easier to click
                       */}
                      <Text 
                        style={{alignSelf: "center", padding: 12}}
                        key={username} onPress={ async () => {
                        await this.setProfile(username);
                      }}>
                        <Text style={{
                          textAlign: 'center',
                          fontSize: 25,
                          paddingVertical: "3%",
                          textDecorationLine: "underline"
                        }}>
                          {username}
                        </Text>
                      </Text>
                    </View>
                  );
                }
              })
            }
            </View>
        </ScrollView>

        {
          this.state.modalVisible && <Modal
              animationType="slide"
              transparent={false}
              visible={true}
              onRequestClose={() => {
                console.log('Modal is closed'); //onRequestClose is a required parameter of the Modal component
            }}>
            <View style={{marginTop: 0.05*height}}>
              <ScrollView persistentScrollbar={true}>
                <Text style={{fontSize: 25, textAlign: "center", fontWeight: "bold"}}>
                  {this.state.username + "'s profile"}
                </Text>

                {this.state.finalImages.length > 0 && this.state.finalImages.map(url => (
                  <View key={url} style={styles.slideContainer}>
                  <Image
                    style={{ width: width * 0.95, height: width * 0.9, borderRadius: 30}}
                    source={{uri: url}}
                    resizeMode="contain"
                  />
                  </View>
                ))}

                <Text style={{fontSize: 20, textAlign: "center", fontWeight: "bold", marginVertical: 5}}>
                  {this.state.username + "'s email"}
                </Text>

                <Text style={{fontSize: 18, marginHorizontal: 10, marginVertical: 5}}>
                  {this.state.email}
                </Text>

                <Text style={{fontSize: 20, textAlign: "center", fontWeight: "bold", marginVertical: 5}}>
                {this.state.username + "'s bio"}
                </Text>

                <Text style={{fontSize: 18, marginHorizontal: 10, marginVertical: 5}}>
                {this.state.bio}
                </Text>

                <Text style={{fontSize: 20, textAlign: "center", fontWeight: "bold", marginVertical: 5}}>
                  {this.state.username + "'s goal"}
                </Text>

                <Text style={{fontSize: 18, marginHorizontal: 10, marginVertical: 5}}>
                  {this.state.goal}
                </Text>

                <TouchableHighlight
                  onPress={() => {
                    this.setState({ modalVisible:false,});
                  }}>
                  <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginTop: 10}}>
                    Exit
                  </Text>
                </TouchableHighlight>

              </ScrollView>
            </View>
            </Modal>
        }
        {this.state.loading &&
          <View style={styles.loading}>
            <ActivityIndicator size='large' color="#0000ff" />
          </View>
        }
      </View>
    );
  }
}
