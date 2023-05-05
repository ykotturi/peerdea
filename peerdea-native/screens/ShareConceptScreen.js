import React, { Component } from "react";
import {
  Button,
  Dimensions,
  Image,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
// because we're using mangaged apps version of expo (and not bare version):
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Buffer } from "buffer";
import ImageCarousel from "react-native-image-carousel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Swiper from "react-native-swiper";
import Expo from "expo-server-sdk";
import styles from "../components/style";
const { width, height } = Dimensions.get("window");
let expo = new Expo();
import statusCheck from "../components/StatusCheck.js";
import {DOCKER_URL} from "@env"

// PICK UP HERE
//TODO: change infrastructure of this file to make state hold multple values of what a concept is

export default class ShareConcept extends React.Component {
  static navigationOptions = {
    title: "Share a Concept",
    headerLeft: ()=> null
  };

  state = {
    author: "",
    images: [], //contain uri of the images to use as key and image source
    imagesBase64: [], //contains the actual pixel value arrays of the images
    story: "",
    group_id: "",
    hasCameraPermission: null,
    hasCameraRollPermission: null,
    conceptID: null,
    addImage: false,
    addPoll: false,
    pollOptionsNumber: 2,
    pollOptions: [],
    imageNames: [],
    loading: false,
  };

  async s3Upload() {
    var tmpImageNames = [];
    for (i = 0; i < this.state.imagesBase64.length; i++) {
      var buff = new Buffer(this.state.imagesBase64[i], "base64");
      var imageUri = this.state.images[i];
      let date = new Date();
      let s3Timestamp = date.toLocaleString();
      var imageName = `${this.state.author}-${this.state.groupName}-${s3Timestamp}`;
      console.log("imageName:", imageName);
      tmpImageNames.push(imageName);
      var contentType = "image/png";
      if (imageUri.includes("jpg")) contentType = "image/jpg";
      const params = {
        Bucket: "peerdea/images",
        Key: imageName, // File name you want to save as in S3
        Body: JSON.stringify(buff),
        ContentEncoding: "base64",
        ContentType: contentType,
      };
      // Uploading files to the bucket
      // what should be saved to mongodb is the imageName, which we can use later
      // to get a signed URL to access the object
      var uploadRes = await fetch(`http://${DOCKER_URL}/api/s3Upload`, {
        method: "POST",
        credentials: "same-origin",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(params),
      });
      var uploadResJson = await uploadRes.json();

      var s3Res = await fetch(
        `http://${DOCKER_URL}/api/s3Url?imageName=` + imageName,
        { method: "GET" }
      );
      var s3ResJson = await s3Res.json();
      console.log("res of s3 upload", JSON.stringify(s3ResJson));
    }

    this.setState({ imageNames: tmpImageNames });
  }

  // In VisualStudio (which generates in-app compile time errors, this idx:number renders an error bc js doesn't have types. I wondering where this came from, as we don't use TypeScript... do we need `number?`)
  renderImage = (idx) => (
    <Image
      style={StyleSheet.absoluteFill}
      resizeMode="contain"
      source={{ uri: this.state.images[idx] }}
    />
  );

  askCameraPermissionsAsync = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === "granted") {
      //not sure we actually need to store this; we can just
      //call requestCameraPermissionsAsync every time
      this.state.hasCameraPermission = true;
    } else {
      Alert.alert("This function requires camera permissions!");
    }
    return;
  };

  askCameraRollPermissionsAsync = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "granted") {
      this.state.hasCameraRollPermission = true;
    } else {
      Alert.alert("This function requires camera roll permissions!");
    }
    return;
  };

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      "focus",
      () => {
        this.setData();
      }
    );
  }

  componentWillUnmount() {
    this.focusListener();
  }

  async setData() {
    var status = await statusCheck();
    if (status == "down") {
      this.props.navigation.navigate("Maintenance");
      return;
    }

    let values;
    try {
      values = await AsyncStorage.multiGet([
        "groupName",
        "username",
        "groupID",
      ]);
      this.setState({
        groupName: values[0][1],
        author: values[1][1],
        group_id: values[2][1],
        story: "",
        images: [],
        imagesBase64: [],
        imageNames: [],
      });
    } catch (err) {
      console.log(err);
    }
  }

  randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
  }

  toggleAddImage = () => {
    this.setState({ addImage: true });
  };

  toggleRemoveImage = () => {
    this.setState({ addImage: false });
    this.setState({ images: [], imagesBase64: [], imageNames: [] });
  };

  toggleAddPoll = () => {
    this.setState({ addPoll: true, pollOptions: ["", ""] });
  };

  toggleRemovePoll = () => {
    this.setState({ addPoll: false });
    this.setState({ pollOptionsNumber: 2, pollOptions: [] });
  };

  addOption = () => {
    var optionsnumber = this.state.pollOptionsNumber;
    optionsnumber = optionsnumber + 1;
    this.setState({ pollOptionsNumber: optionsnumber});
    var temp = this.state.pollOptions;
    temp.push("");
    this.setState({ pollOptions: temp });
  };


  render() {
    return (
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        resetScrollToCoords={{ x: 0, y: 0 }}
        contentContainerStyle={{ backgroundColor: "#fff"}}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        pointerEvents={this.state.loading ? 'none' : 'auto'}
      >
        <View
          style={{
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "center",
            padding: 10,
            marginBottom: 100
          }}
        >
          <Image
            style={{ width: 300, height: 50 }}
            source={require("../assets/images/peerdea-logo-draft.png")}
            accessible={true}
            accessibilityLabel="Peerdea app logo"
          />
          <Text style={{ paddingBottom: 15 }}>
            Welcome to {this.state.groupName}, {this.state.author}!
          </Text>
          <Text style={{ paddingBottom: 15 }}>
            Share an idea you are thinking about or ask a question that you would like group members' inputs on. You can add links by direcly pasting them into the text box. You can also add photos or create a poll.
          </Text>

          <TextInput
            returnKeyType={"done"}
            multiline={true}
            blurOnSubmit={true}
            style={{
              height: 60,
              maxHeight: 60,
              width: 300,
              width: "90%",
              borderColor: "gray",
              borderWidth: 1,
              borderRadius: 5,
              padding: 10,
              marginBottom: 10
            }}
            onChangeText={text => {
              this.setState({ story: text });
            }}
            placeholder="What do you want to share with your group today? (minimum of 10 characters)"
            value={this.state.story}
          />

          {this.state.addImage == true && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                width: "90%"
              }}
            >
              <TouchableHighlight
                onPress={this._takePicture}
                style={styles.buttonSmall}
              >
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableHighlight>

              <TouchableHighlight
                onPress={this._pickImage}
                style={styles.buttonSmall}
              >
                <Text style={styles.buttonText}>Camera Roll</Text>
              </TouchableHighlight>
            </View>
          )}

          {this.state.addImage == true &&
          this.state.images.length == 0 && ( //no image placeholder image
              <View key={this.state.images[0]} style={styles.slideContainer}>
                <Image
                  style={{
                    width: width * 0.7,
                    height: width * 0.7,
                    borderRadius: 30,
                    opacity: 0.6
                  }}
                  source={{
                    uri:
                      "https://t3.ftcdn.net/jpg/02/68/55/60/240_F_268556012_c1WBaKFN5rjRxR2eyV33znK4qnYeKZjm.jpg"
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
          {this.state.addImage == true &&
          this.state.images.length == 1 && ( //just 1 uploaded image
              <View key={this.state.images[0]} style={styles.slideContainer}>
                <Image
                  style={{
                    width: width * 0.7,
                    height: width * 0.7,
                    borderRadius: 30
                  }}
                  source={{ uri: this.state.images[0] }}
                  resizeMode="cover"
                />
              </View>
            )}
          {this.state.addImage == true &&
          this.state.images.length > 1 && ( //if there's more than 1 image uploaded
              <Swiper height={width * 0.7+16} width={width * 0.7}>
                {this.state.images.map(url => (
                  <View key={url} style={styles.slideContainer}>
                    <Image
                      style={{
                        width: width * 0.7,
                        height: width * 0.7,
                        borderRadius: 30
                      }}
                      source={{ uri: url }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </Swiper>
            )}

          {this.state.addPoll == true && (
            <View style={{flexDirection: "column", width: "90%", borderTopColor: "#D3D3D3", borderTopWidth: 1, paddingTop: 10}}>
              <Text style={{
                      fontSize: 17,
                      color: "black",
                      paddingBottom: 10,
              }}>
                Poll:
              </Text>
              {[...Array(this.state.pollOptionsNumber)].map((e,i) => (
                <View key={i} style={{flexDirection:"row", justifyContent:"space-between"}}>
                  <Text
                    style={{
                      color: "#777777",
                    }}
                  >
                    Choice {i+1}:
                  </Text>
                  <TextInput
                    accessibilityLabel={"Choice" + [i+1] + ", required"}
                    returnKeyType={"done"}
                    multiline={true}
                    blurOnSubmit={true}
                    style={{
                      height: 40,
                      width: width*0.65,
                      borderColor: "gray",
                      borderWidth: 1,
                      borderRadius: 5,
                      padding: 5,
                      marginBottom: 10
                    }}
                    onChangeText={text => {
                      let temp = [...this.state.pollOptions];
                      temp[i] = text;
                      this.setState({ pollOptions: temp});
                    }}
                    value={this.state.pollOptions[i]}
                  />
                </View>
              ))}
              <View>
                <TouchableHighlight
                  onPress={this.addOption}
                  style={{width: "100%", paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: 'black', marginBottom: 30}}
                >
                  <View style={{flexDirection:"row", justifyContent:"center", alignItems: "center"}}>
                    <Image
                      style={{width: 20, height: 20}}
                      source={require('../assets/images/addicon.png')}
                    />
                    <Text style={{color:"black"}}>Add Option</Text>
                  </View>
                </TouchableHighlight>
              </View>
            </View>
          )}
          <View style={{flexDirection:"row", justifyContent: "space-evenly"}}>
          {this.state.addImage == false && (
            <TouchableHighlight
              onPress={this.toggleAddImage}
              style={[
                styles.buttonSmall,
                {
                  marginBottom: 10,
                  marginRight: 5,
                  backgroundColor: "#dddddd",
                  borderColor: "transparent"
                }
              ]}
            >
              <Text style={[styles.buttonText, { color: "black" }]}>
                Add Image(s)
              </Text>
            </TouchableHighlight>
          )}
          {this.state.addImage == true && (
            <TouchableHighlight
              onPress={this.toggleRemoveImage}
              style={[
                styles.buttonSmall,
                {
                  marginBottom: 10,
                  marginRight: 5,
                  backgroundColor: "#dddddd",
                  borderColor: "transparent"
                }
              ]}
            >
              <Text style={[styles.buttonText, { color: "black" }]}>
                Remove Images
              </Text>
            </TouchableHighlight>
          )}

          {this.state.addPoll == false && (
            <TouchableHighlight
              onPress={this.toggleAddPoll}
              style={[
                styles.buttonSmall,
                {
                  marginBottom: 10,
                  marginLeft: 5,
                  backgroundColor: "#dddddd",
                  borderColor: "transparent"
                }
              ]}
            >
              <Text style={[styles.buttonText, { color: "black" }]}>
                Create Poll
              </Text>
            </TouchableHighlight>
          )}
          {this.state.addPoll == true && (
            <TouchableHighlight
              onPress={this.toggleRemovePoll}
              style={[
                styles.buttonSmall,
                {
                  marginBottom: 10,
                  marginLeft: 5,
                  backgroundColor: "#dddddd",
                  borderColor: "transparent"
                }
              ]}
            >
              <Text style={[styles.buttonText, { color: "black" }]}>
                Remove Poll
              </Text>
            </TouchableHighlight>
          )}
          </View>

          <View style={{ padding: 15, width: "100%", alignItems: "center" }}>
            <TouchableHighlight
              style={styles.buttonMedium}
              onPress={async () => {
                if (this.state.story.trim().length < 10) {
                  await Alert.alert(
                    "Your description or question is too short!", "Please provide enough context for your group members to respond effectively. Your response should be at least 10 non-space characters long!"
                  );
                  return;
                } 
                else if (this.state.addPoll == true){
                  var polloptions = this.state.pollOptions;
                  var trimmedoptions = polloptions.map(function(option, index){
                      return option.trim().length;
                  });
                  if(trimmedoptions.includes(0)){
                    await Alert.alert(
                      "Poll options can not be empty", "Please fill options that are empty. You can click `Remove poll' if you want to remove the poll. If you want to create a poll with fewer options, remove the poll and create one with fewer options."
                    );
                    return;
                  }
                  else {
                    await this._sendConcept();
                    this.props.navigation.navigate("Third");
                  }
                }
                else {
                  await this._sendConcept();
                  this.props.navigation.navigate("Third");
                }
              }}
            >
              <Text
                style={{
                  paddingHorizontal: 23,
                  fontSize: 20,
                  color: "#ffffff",
                }}
              >
                Share post
              </Text>
            </TouchableHighlight>
          </View>
        </View>
        {this.state.loading &&
            <View style={styles.loading}>
              <ActivityIndicator animating={true} size='large' 
              style={{ transform: [{ scaleX: 3 }, { scaleY: 3 }] }}
              color="#0076ff"
              />
            </View>
          }
      </KeyboardAwareScrollView>
    );
  }

  //this function taken from:
  //https://stackoverflow.com/questions/2952237/removing-quotation-marks-in-jsonobject
  CleanJSONQuotesOnKeys(json) {
    return json.replace(/"(\w+)"\s*:/g, "$1:");
  }

  async _sendConcept() {
    // get requests to get users group keyword
    const { navigation } = this.props;
    /*
    var temp = []
    for (i = 0; i < this.state.imagesBase64.length; i++){
        const buff = new Buffer(this.state.imagesBase64[i], 'base64');

        this transformation below is so we can extract only the integer array from
        the buffer object (which is what we need). otherwise, if you call
        buff.data without turning into JSON object, the keys are the indices of
        the inner array and there is no way to extract the array from the object.
        All for the sake of formatting the graphQL query with proper syntax

        buff = JSON.stringify(buff);
        buff = JSON.parse(buff);
        const elem = {
          data: buff.data,
          contentType: 'image/png'};
        temp.push(elem);
    }

    var tempJson = JSON.stringify(temp);
    tempJson = this.CleanJSONQuotesOnKeys(tempJson); //get rid of quotes around keys
    */

    this.setState({loading: true});

    await this.s3Upload();

    var date = new Date();
    var mlist = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var month = mlist[date.getMonth()];
    var year = date.getFullYear();
    var day = date.getDate();
    var timestamp = `${month} ${day}, ${year}`;
    //var s3Timestamp = date.toLocaleString('en-GB', { timeZone: 'UTC' }));

    //retrieves all possible sentence starters from mongo
    var ssQuery = `
    query{
    	allSentenceStarters{
        id
      }
    }`;
    var ssRes = await fetch(
      `http://${DOCKER_URL}/graphql?query=` + ssQuery
    );
    var ssResJson = await ssRes.json();
    //randomly selects one for the newly shared concept
    var sentenceStarter = this.randomChoice(
      ssResJson.data.allSentenceStarters
    ).id;
    console.log("randomly chosen sentence starter", sentenceStarter);
    var votes = new Array(this.state.pollOptions.length).fill(0);
    var vlist = [String(this.state.author)];
    if (this.state.imagesBase64.length == 0) {
      var mutation = `
      mutation{
        addConcept(group_id:"${this.state.group_id}", name:"${this.state.author}",
          concept_type: "text",
          poll_options: ${JSON.stringify(this.state.pollOptions)},
          poll_votes: ${JSON.stringify(votes)},
          voter_list: ${JSON.stringify(vlist)},
          description: "${this.state.story.trim()}",
          timestamp: "${timestamp}",
          sentence_starter: "${sentenceStarter}"
        ) {
          group_id
          name
          concept_type
          poll_options
          poll_votes
          voter_list
          description
          id
          timestamp
          sentence_starter
        }
      }`;
    } else {
      var mutation = `
      mutation{
        addConcept(group_id:"${this.state.group_id}", name:"${this.state.author}",
          concept_type: "image",
          poll_options: ${JSON.stringify(this.state.pollOptions)}, 
          poll_votes: ${JSON.stringify(votes)},
          voter_list: ${JSON.stringify(vlist)},
          s3: ${JSON.stringify(this.state.imageNames)},
          description: "${this.state.story.trim()}",
          timestamp: "${timestamp}",
          sentence_starter: "${sentenceStarter}"
        ) {
          group_id
          name
          concept_type
          poll_options
          poll_votes
          voter_list
          s3
          description
          id
          timestamp
          sentence_starter
        }
      }`;
    }

    var body = {
      query: mutation,
    };
    let data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    };

    //const that = this;
    fetch(`http://${DOCKER_URL}/graphql`, data)
      .then((response) => {
        return response.json();
      })
      .then(async (json) => {
        console.log("success");
        this.setState({loading: false})

        Alert.alert(
          "Thanks for sharing!",
          "While you wait for your peers to provide feedback, please take a moment to describe this experience of asking for feedback on in-progress work in a notepad."
        );
        await this.setState({
          conceptID: json.data.addConcept.id,
          story: "",
          images: [],
          imagesBase64: [],
          imageNames: [],
          addImage: false,
          addPoll: false,
          pollOptionsNumber: 2,
          pollOptions: [],
        });

        //add concept to user's list of concepts
        var addConcepts = `
        mutation{
          addConceptToUser(username: "${this.state.author}", conceptID: "${this.state.conceptID}"){
            concepts
          }
        }
        `;
        var addConceptRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + addConcepts,
          { method: "POST" }
        );
        var addConceptResJson = await addConceptRes.json();

        //sending push notifications to all users in the group
        var groupUsersQuery = `
        query{
          group(name:"${this.state.groupName}"){
            users
          }
        }`;
        var groupUsersRes = await fetch(
          `http://${DOCKER_URL}/graphql?query=` + groupUsersQuery,
          { method: "GET" }
        );
        var groupUsersResJson = await groupUsersRes.json();
        var groupUsers = groupUsersResJson.data.group.users;
        const index = groupUsers.indexOf(this.state.author);
        if (index > -1) {
          groupUsers.splice(index, 1);
        }

        //add all the pushtokens in list to send EXCEPT the current author's
        var pushTokens = [];
        var tokensMapping = {};
        for (let groupUser of groupUsers) {
          var userTokensQuery = `
          query{
            user(username: "${groupUser}"){
              pushTokens
            }
          }`;
          var userTokensRes = await fetch(
            `http://${DOCKER_URL}/graphql?query=` + userTokensQuery,
            { method: "GET" }
          );
          var userTokensResJson = await userTokensRes.json();
          pushTokens = pushTokens.concat(
            userTokensResJson.data.user.pushTokens
          );
          for (let token of userTokensResJson.data.user.pushTokens) {
            if (token in tokensMapping) {
              tokensMapping[token].push(groupUser);
            } else {
              tokensMapping[token] = [groupUser];
            }
          }
        }
        // remove push tokens that are duplicates
        // in case user has multiple accounts in same group
        pushTokens = [...new Set(pushTokens)];

        //actually send the push notifications
        let messages = [];
        let body = `Someone in ${this.state.groupName} shared a concept and needs feedback!`;

        for (let pushToken of pushTokens) {
          if (!Expo.isExpoPushToken(pushToken)) {
            console.error(
              `Push token ${pushToken} is not a valid Expo push token`
            );
            continue;
          }
          messages.push([
            {
              to: pushToken,
              sound: "default",
              body: body,
              data: { withSome: "data" },
              ttl: 2419200, //for Androids
            },
          ]);
        }

        let chunks = [];
        for (let m of messages) {
          chunks.push(expo.chunkPushNotifications(m));
        }
        let tickets = [];
        await (async () => {
          // Send the chunks to the Expo push notification service.
          for (let chunk of chunks) {
            try {
              let ticketChunk = await expo.sendPushNotificationsAsync(chunk[0]);
              tickets.push(...ticketChunk);
              //console.log('ticketChunk', ticketChunk)
              // errors to handle:
              // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
            } catch (error) {
              console.error(error);
            }
          }
        })();

        //console.log('lengths? tickets, chunks, messages', tickets.length, chunks.length, messages.length);
        //console.log(JSON.stringify(tickets));
        for (var i = 0; i < tickets.length; i++) {
          if (tickets[i].status === "ok") {
            continue;
          } else {
            //need to remove bad token associated with every user
            console.log("There was an error sending this notification");
            let badToken = messages[i][0].to;
            let badUsers = tokensMapping[badToken];
            for (let badUser of badUsers) {
              var removeToken = `
                mutation{
                  removeTokenFromUser(user: "${badUser}", pushToken: "${badToken}"){
                    pushTokens
                  }
                }`;
              var removeTokenRes = await fetch(
                `http://${DOCKER_URL}/graphql?query=` + removeToken,
                { method: "POST" }
              );
              var removeTokenResJson = await removeTokenRes.json();
            }
          }
        }
      })
      .catch(function (error) {
        console.log(
          "There has been a problem with your fetch operation: " + error.message
        );
        Alert.alert("Something went wrong!", "Make sure you are not using any paragraphs in your text input and contact the Peerdea team cheerpeerapp@gmail.com");
        throw error;
      });
  }

  //underscore before function name to distinguish internal methods from the lifecycle methods of react
  _pickImage = async () => {
    await this.askCameraRollPermissionsAsync();
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 3],
      base64: true,
    });

    // probably need some express api post call to add "result" variable to database

    if (!result.canceled) {
      var temp = this.state.images;
      temp.push(result.assets[0].uri);
      var temp2 = this.state.imagesBase64;
      temp2.push(result.assets[0].base64);
      this.setState({ images: temp, imagesBase64: temp2 });
    }
  };

  _takePicture = async () => {
    await this.askCameraPermissionsAsync();
    await this.askCameraRollPermissionsAsync();
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 3],
      base64: true,
    });

    if (!result.canceled) {
      var temp = this.state.images;
      temp.push(result.assets[0].uri);
      var temp2 = this.state.imagesBase64;
      temp2.push(result.assets[0].base64);
      this.setState({ images: temp, imagesBase64: temp2 });
    }
  };
}
