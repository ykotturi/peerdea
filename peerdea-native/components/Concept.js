import React, { Component } from 'react';
import {  Button,
          Image,
          View,
          StyleSheet,
          Text,
          Switch,
          TouchableOpacity,
          TouchableHighlight,
          TextInput,
          // Alert,
          ScrollView,
          Modal,
          Platform,
          Keyboard,
          KeyboardAvoidingView,
          Dimensions,
          Animated
        } from 'react-native';
// because we're using mangaged apps version of expo (and not bare version):
// import { ImagePicker,
//          Camera } from 'expo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import GiveFeedbackIcon from '../components/GiveFeedbackIcon';
import ConceptDescription from '../components/ConceptDescription';
import Autolink from 'react-native-autolink';
import * as WebBrowser from 'expo-web-browser';
// import { Buffer } from 'buffer';
import Expo from 'expo-server-sdk';
import Collapsible from 'react-native-collapsible';
// import ImageCarousel from 'react-native-image-carousel';
import Swiper from "react-native-swiper";
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
const { width, height } = Dimensions.get('window');
let expo = new Expo();
import {DOCKER_URL} from "@env"

export default class Concept extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      concept: props.concept,
      name: props.concept.name,
      sentenceStarterID: props.concept.sentence_starter,
      pollOptions: props.concept.poll_options,
      pollVotes: new Array(props.concept.poll_options.length).fill(0),
      modalVisible: false,
      modalErrorMessage: '',
      modalErrorShown: false,
      switchValue: true,
      iLike: '',
      iWish: '',
      openEnded: '',
      username: '',
      sentence1: '',
      sentence2: '',
      timeStamp1: '',
      timeStamp2: '',
      imageLinks:[]
    };
  }

  scale = new Animated.Value(1);

  onPinchStateChange = (event) => {
    if (Platform.OS != "ios"){
      console.log("match");
      //have to have this separately because pinches are different in Android
      //and harder to detect
      event.nativeEvent.oldState = State.ACTIVE;
      Animated.spring(this.scale, {
        toValue: 1,
        useNativeDriver: true
      }).start();
    }
    else if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(this.scale, {
        toValue: 1,
        useNativeDriver: true
      }).start();
    }
  }

  async componentDidMount() {
    // Create a new Expo SDK client
    let expo = new Expo();

    var values = await AsyncStorage.multiGet(['username']);
    var name = values[0][1];
    this.setState({username: name});

    //set the sentence starters by retrieving from database
    var ssID = "5d3b3ffcd295074d706f9bb3"; //default ID if not assigned one previously
    if (this.state.sentenceStarterID != null && this.state.sentenceStarterID != undefined){
      console.log("valid ssID");
      ssID = this.state.sentenceStarterID;
    }
    var query = `
    query{
      sentenceStarterByID(id: "${ssID}"){
        sentences
      }
    }`
    var res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    var resJson = await res.json();
    this.setState({
      sentence1: resJson.data.sentenceStarterByID.sentences[0],
      sentence2: resJson.data.sentenceStarterByID.sentences[1]
    });

    //gets signed images link from s3
    var urlArr = [];
    for (let i = 0; i < this.state.concept.s3.length; i++){
      var s3Res = await fetch(`http://${DOCKER_URL}/api/s3Url?imageName=` + this.state.concept.s3[i],{method: "GET"});
      var s3ResJson = await s3Res.json();
      var url = s3ResJson.data;
      urlArr.push(url);
    }
    await this.setState({imageLinks: urlArr});
  }

  async updateConceptYesAnd() {
    var query = `
    query{
      conceptByID(id: "${this.state.concept.id}"){
          id
          group_id
          s3
          poll_options
          poll_votes
          voter_list
          description
          yes
          yesand
          timestamp
          sentence_starter
      }
    }
    `
    const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    const conceptNew = resJson.data.conceptByID;
    conceptNew.isCollapsed = true;
    this.setState({concept: conceptNew});
  }

  async updateConceptYes() {
    var query = `
    query{
      conceptByID(id: "${this.state.concept.id}"){
          id
          group_id
          s3
          poll_options
          poll_votes
          voter_list
          description
          yes
          yesand
          timestamp
          sentence_starter
      }
    }
    `
    const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    const conceptNew = resJson.data.conceptByID;
    if (this.state.concept.isCollapsed != undefined)
      conceptNew.isCollapsed = this.state.concept.isCollapsed;

   this.setState({concept: conceptNew});
  }

  async updateVote() {
    var query = `
    query{
      conceptByID(id: "${this.state.concept.id}"){
          id
          group_id
          s3
          poll_options
          poll_votes
          voter_list
          description
          yes
          yesand
          timestamp
          sentence_starter
      }
    }
    `
    const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    const conceptNew = resJson.data.conceptByID;
    if (this.state.concept.isCollapsed != undefined){
      conceptNew.isCollapsed = this.state.concept.isCollapsed;
    }
    this.setState({concept: conceptNew});
  }

  toggleSwitch = value => {
    //onValueChange of the switch this function will be called
    this.setState({ switchValue: value });
    //state changes according to switch
    //which will result in re-render the text
  };

  flipVote(index) {
    var temp = this.state.pollVotes;
    if (temp[index] == 1){
      temp[index] = 0;
    }
    else{
      temp[index] = 1;
    }
    this.setState({ pollVotes: temp});
  }

  renderInputs = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{flex: 1}} contentContainerStyle={{flexGrow: 1,justifyContent: 'flex-end'}}>
        <View style={{padding: 0, width: width, justifyContent: 'flex-end', backgroundColor: '#dddddd', borderTopRightRadius: 30, borderTopLeftRadius: 30}}>
        <View style={{marginTop: 20, alignItems:'center'}}></View>
          {this.state.modalErrorShown && <Text style={{color: 'red', fontWeight: 'bold', paddingLeft: 30}}> {this.state.modalErrorMessage} </Text>}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
            <View style={{flexDirection: 'column'}}>
              <Text style={[styles.getStartedText, {paddingLeft: 30}]}>
              Respond or provide your feedback
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#dddddd",
                  justifyContent: "flex-start",
                  alignItems: "center"
                }}
              >
                <Text style={[styles.getStartedText, {paddingLeft: 30}]}>
                  Feedback assistance
                </Text>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Switch
                    style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={this.state.switchValue ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={this.toggleSwitch}
                    value={this.state.switchValue}
                  />
                </View>
              </View>
            </View>
          <TouchableHighlight
            underlayColor="#CECECE"
            style={{marginRight: 30}}
            onPress={() => {
              //if user decides to cancel, close modal and reset state for iLike and iWish, as user has decided to cancel submission of feedback
              this.setState({ modalErrorMessage: '',
                              modalErrorShown: false,
                              iLike: '',
                              iWish: '',
                              openEnded: '',
                              switchValue: true,
                              modalVisible:false,});
            }}>
            <Image
              style={{width: 30, height: 30}}
              source={require('../assets/images/cross.png')}
            />
          </TouchableHighlight>
          </View>
          <View style={{ backgroundColor: "#dddddd" }}>
            <View style={{ flexDirection: "row" }}>
              {this.state.switchValue == false && (
                <TextInput
                  style={{
                    height: 60,
                    flex: 1,
                    backgroundColor: "white",
                    borderColor: "gray",
                    borderWidth: 1,
                    borderRadius: 5,
                    marginLeft: 30,
                    marginRight:30,
                    paddingHorizontal: 5
                  }}
                  onChangeText={text => {
                    var date = new Date();
                    var timestamp = `${date.getMonth() +
                      1}/${date.getDate()}/${date.getFullYear()}`;
                    this.setState({
                      timeStamp1: timestamp,
                      openEnded: text
                    });
                  }}
                  multiline={true}
                  placeholder={"Enter your response"}
                  returnKeyType={"next"}
                  ref={ref => {
                    this._iLikeinput = ref;
                  }}
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={false}
                  value={this.state.openEnded}
                />
              )}
            </View>
            <View style={{flexDirection: 'row'}}>
              {this.state.switchValue == true && ( <TextInput
                style={{
                  height: 60, 
                  flex: 1,
                  backgroundColor: "white",
                  borderColor: "gray",
                  borderWidth: 1,
                  borderRadius: 5,
                  marginLeft: 30,
                  marginRight: 30,
                  paddingHorizontal: 5,
                  marginBottom: 10
                }}
                onChangeText={(text) => {
                  var date = new Date();
                  var timestamp = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                  this.setState({
                    timeStamp1: timestamp,
                    iLike: text,
                  });
                  if (this.state.iLike.startsWith("I") == false && this.state.iLike.startsWith("i") == false &&
                  this.state.iLike.includes(this.state.sentence1) == false && this.state.iLike.includes(this.state.sentence1) == false){
                    this.setState({iLike: this.state.sentence1 + " " + this.state.iLike});
                  }
                }
              }
                multiline= {true}
                placeholder={this.state.sentence1 + "..."}
                returnKeyType={ "next" }
                ref={ref => {
                  this._iLikeinput = ref;
                }}
                onSubmitEditing={() =>
                  this._iWishinput && this._iWishinput.focus()
                }
                blurOnSubmit={false}
                value={this.state.iLike}
              />
              )}
            </View>
            <View style={{flexDirection: 'row'}}>
              {this.state.switchValue == true && (<TextInput
                returnKeyType={ "done" }
                style={{height: 60, 
                  flex: 1,
                  backgroundColor: "white",
                  borderColor: "gray",
                  borderWidth: 1,
                  borderRadius: 5,
                  marginLeft: 30,
                  marginRight: 30,
                  paddingHorizontal: 5
                }}
                onChangeText={(text) => {
                  var date = new Date();
                  var timestamp = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                  this.setState({
                    timeStamp2: timestamp,
                    iWish: text,
                  });
                  if (this.state.iWish.startsWith("I") == false && this.state.iWish.startsWith("i") == false &&
                  this.state.iWish.includes(this.state.sentence2) == false && this.state.iWish.includes(this.state.sentence2) == false){
                    this.setState({iWish: this.state.sentence2 + " " + this.state.iWish});
                  }
                }
              }
                multiline= {true}
                placeholder={this.state.sentence2 + "..."}
                ref={ref => {
                  this._iWishinput = ref;
                }}
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={false}
                value={this.state.iWish}
              />
              )}
            </View>
          </View>
          <View style={{flexDirection: "row", justifyContent: "flex-end"}}>
          <TouchableHighlight style={[styles.submitButton,{marginRight: 30, marginLeft: 30, marginBottom: 20, marginTop: 10, alignItems: "center"}]} onPress={async () =>
              {
                await this._sendFeedback(this.state.iLike, this.state.iWish, this.state.openEnded);
              }}
          >
            <Text style={{fontSize: 17, color: "#ffffff"}}>
              Post response
            </Text>
          </TouchableHighlight>
          </View>
          </View>
    </ScrollView>)
}


  render() {
      const concept = this.state.concept;
      var yesAndViews = [];
      if (concept.yesand.length > this.props.concept.yesand.length){
        for (j = 0; j < concept.yesand.length; j++){
          const yesandText = concept.yesand[j];
          yesAndViews.push(
                  <Text key = {j}> {yesandText} </Text>
          )
        }
      }
      else{
        for (j = 0; j < this.props.concept.yesand.length; j++){
          const yesandText = this.props.concept.yesand[j];
          yesAndViews.push(
                  <Text key = {j}> {yesandText} </Text>
          )
        }
      }
      const yesAnds = yesAndViews;

      var yeses = 0;
      if (concept.yes > this.props.concept.yes){
        yeses = concept.yes;
      }
      else {
        yeses = this.props.concept.yes;
      }

      const yesDisplay = yeses;

      var selected_poll_concept = this.props.concept;

      if (concept.poll_options.length > 0){
        if (concept.voter_list.length > this.props.concept.voter_list.length){
          selected_poll_concept = concept;
        }
      }
      const poll_concept = selected_poll_concept;
      /*
      var images = [];
      for (imageI = 0; imageI < concept.media.length; imageI++){
          const buff = new Buffer(concept.media[imageI].data);
          const base64data = buff.toString('base64');
          const uriString = `data:image/gif;base64,${base64data}`;
          images.push(uriString);
      }
      const finalImages = images;
      */
      const Bold = (props) => { return <Text style={{fontWeight: 'bold'}}>{props.children}</Text>}

      return (
        <View key = {i} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginTop: height * 0.02,
                marginBottom: height * 0.005
              }}
            >
              {this.state.name}{" "}
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "normal",
                  marginVertical: height * 0.005,
                  color: "#999999"
                }}
              >
                {concept.timestamp}
              </Text>
            </Text>
            <Autolink text={concept.description} url={true} component={ConceptDescription} onPress={async (url) => { await WebBrowser.openBrowserAsync(url);}}/>
            {this.state.imageLinks.length > 0 && <Swiper height={width*0.9} width={width*0.95} showsButtons = {this.state.imageLinks.length > 1 ? true : false} >
              {this.state.imageLinks.map(url => (
                <View key={url} style={styles.slideContainer}>
                <PinchGestureHandler
                onGestureEvent={
                  Animated.event([{nativeEvent: { scale: this.scale }}],
                    {useNativeDriver: true})
                  }
                onHandlerStateChange={this.onPinchStateChange}>
                  <Animated.Image
                    style={{ width: width * 0.95, height: width * 0.9, borderRadius: 30, transform: [{ scale: this.scale }]}}
                    source={{uri: url}}
                    resizeMode="contain"
                    accessibilityLabel= {this.state.name + "'s concept"}
                  />
                </PinchGestureHandler>


                </View>
              ))}
             </Swiper>}
            {this.state.pollOptions && this.state.pollOptions.length > 0 && (
              <View style={{flexDirection: "column", width: width*0.85, borderWidth: 1, borderColor:'#D3D3D3', borderRadius: 5, marginTop: 10, alignItems: 'center'}}>
                <Text style={{fontSize: 18, marginTop: 10}}>{this.state.name} created a poll:</Text>
                {poll_concept.voter_list.length == 1 && (<Text style={{fontSize: 18, color:'#454545'}}>(No members have voted yet)</Text>)}
                {poll_concept.voter_list.length == 2 && (<Text style={{fontSize: 18, color:'#454545'}}>(1 member has voted)</Text>)}
                {poll_concept.voter_list.length > 2 && (<Text style={{fontSize: 18, color:'#454545'}}>({poll_concept.voter_list.length-1} members have voted)</Text>)}
                {this.state.pollOptions.map((option, index) => (
                  <View key={concept.id+"polloption"+index} style={{flexDirection: "row", justifyContent:"space-between", width: width*0.75}}>
                    <Text style={{fontSize: 18}}>Choice {index+1}:</Text>
                    <Text style={{fontSize: 18, width: "70%"}}>{option}</Text>
                  </View>
                ))}
                {poll_concept.voter_list.includes(this.state.username) != true &&(
                  <View style={{paddingTop: 10, borderTopColor: "#D3D3D3", borderTopWidth: 1, width: "90%"}}>
                  <Text style={{fontSize: 18, color:'#454545'}}>(You can vote for more than one option but you may only vote once. Click to select options you would like to vote for and then click submit vote. Clicking a selected option will unselect it.)</Text>
                  </View>
                )}
                {poll_concept.voter_list.includes(this.state.username) != true && (
                <View style={{flexDirection: "row", flexWrap: 'wrap'}}>
                  {this.state.pollVotes.map((option, index) => (
                    <TouchableOpacity key={concept.id+"voteoptions"+index} style={[styles.buttonselectvote, this.state.pollVotes[index] == 1 && styles.buttonunselectvote]}  onPress = {() => this.flipVote(index)}>
                    <Text style={[styles.textselect, this.state.pollVotes[index] == 1 && styles.textunselect]}>{index+1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                )}
                {poll_concept.voter_list.includes(this.state.username) != true && (
                <TouchableHighlight
                  style={[styles.button, {marginBottom:10}]}
                  onPress = {() => { this._sendVote();}}
                >
                  <Text style={styles.textselect}>Submit Vote</Text>
                </TouchableHighlight>
                )}
                {poll_concept.voter_list.includes(this.state.username) &&(
                  <View style={{paddingTop: 10, borderTopColor: "#D3D3D3", borderTopWidth: 1, width: "90%"}}>
                  <Text style={{fontSize: 18}}>Result <Text style={{fontSize: 18, color:'#454545'}}>(votes corresponding to each choice number)</Text> :</Text>
                  </View>
                )}
                {poll_concept.voter_list.includes(this.state.username) &&(
                  <View style={{flexDirection: "row", flexWrap: 'wrap', paddingBottom: 10, marginLeft: 5, justifyContent:"flex-start"}}>
                    {poll_concept.poll_votes.map((votes,index) => (
                      <Text key={concept.id+"pollresult"+index} style={[styles.textselect, { borderRadius:10, borderWidth: 1, borderColor: 'black', padding: 10, height: 40, marginVertical: 2.5, marginHorizontal: 2.5, width:"30%"}]}>{index+1} ({votes} Votes)</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start'}}>
              <TouchableOpacity 
                style={styles.button}  
                onPress = {async () => { this._yes();}}
                accessible={true}
                accessibilityLabel={yesDisplay == 1 ? "1 like." : yesDisplay + "likes."}>
                 <GiveFeedbackIcon
                      name={Platform.OS === 'ios' ? 'ios-heart' : 'md-heart'}
                    />
                 <Text style={{fontSize: width*0.04}}>  {yesDisplay}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button} 
                onPress = {() => { this._yesAnd();}}
                accessible={true}
                accessibilityLabel="Responses.">
                  <GiveFeedbackIcon
                    name={Platform.OS === 'ios' ? 'ios-heart' : 'md-heart'}
                  /><Text style={{fontSize: 20}}>  and...</Text>
              </TouchableOpacity>
            </View>

            {this.state.concept.isCollapsed===undefined &&
              <Text alignSelf="center" style={{
                fontSize: 18, marginVertical: 10, color: "#999999", marginHorizontal: 10
              }}>
                There is currently no feedback!
              </Text>
            }

            {this.state.concept.isCollapsed && (
            <View style={{ width: width*0.8}} accessible={true} accessibilityLabel="View peer feedback">
            <Button title="View peer feedback" onPress={() => this._changeCollapse(false)}/>
            </View>
            )}
            <Collapsible collapsed={concept.isCollapsed}>
                <View style={{ width: width*0.8}} accessible={true} accessibilityLabel="Close peer feedback">
                <Button title="Close peer feedback" onPress={() => this._changeCollapse(true)}/>
                {yesAnds}
                </View>
            </Collapsible>

        {this.state.modalVisible && <Modal
            animationType="slide"
            transparent
            visible={true}
            style={{flex: 1, justifyContent: 'undefined', marginTop: 0, marginBottom: 0}}
            onRequestClose={() => {
              console.log('Modal is closed');
              this.setState({ modalVisible: false }); //onRequestClose is a required parameter of the Modal component
            }}>
            <View key = {i} style={{ marginTop: 0, backgroundColor: 'rgba(0, 0, 0, 0)', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {Platform.OS === 'android' ? (this.renderInputs()) : (
                <KeyboardAvoidingView behavior="padding">
                    {this.renderInputs()}
                </KeyboardAvoidingView>
              )}
            </View>
          </Modal>

        }
        </View>

      );
  }

  _sendVote = async () => {
    let data = {
      method: 'POST',
      credentials: 'same-origin',
      mode: 'same-origin',
      body: JSON.stringify({
        _id: this.state.concept.id,
        voter: this.state.username,
        vote: this.state.pollVotes
      }),
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        // 'X-CSRFToken':  cookie.load('csrftoken')
      }
   }
   await fetch(`http://${DOCKER_URL}/api/submitvote`, data)
   .then(function(response){
     return response.text();
   })
   .then(function(json){
   });

   await this.updateVote();
  }

  _sendFeedback = async (iLike, iWish, openEnded) => {
    var newiLike = this.state.username + ` (${this.state.timeStamp1})`+": " + iLike;
    var newiWish = this.state.username + ` (${this.state.timeStamp2})`+": " + iWish;
    var newopenEnded = this.state.username + ` (${this.state.timeStamp1})` + ": " + openEnded;
    var updated = false;
    // check if feedback assistance is off. If it is off then make sure that their response is not empty
    if (this.state.switchValue == false) {
      if (openEnded.length == 0) {
        this.setState({
          modalErrorMessage: "You must enter a response to submit",
          modalErrorShown: true
        });
        return;
      } else {
        let data = {
          method: "POST",
          credentials: "same-origin",
          mode: "same-origin",
          body: JSON.stringify({
            _id: this.state.concept.id,
            text: newopenEnded
          }),
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        };
        const res = await fetch(
          `http://${DOCKER_URL}/api/yesandunstructured`,
          data
        );
        const resJson = await res.json();
        updated = true;
        //send push notification
        var query3 = `
        query{
          conceptByID(id: "${this.state.concept.id}") {
            name
          }
        }`;
        const res3 = await fetch(`http://${DOCKER_URL}/graphql?query=` + query3, {method: 'GET'});
        const resJson3 = await res3.json();
        author = resJson3.data.conceptByID.name;

        var query2 = `
          query{
            user(username: "${author}") {
              pushTokens
            }
          }`;
        const res2 = await fetch(`http://${DOCKER_URL}/graphql?query=` + query2, {method: 'GET'});
        const resJson2 = await res2.json();
        const pushTokens = resJson2.data.user.pushTokens;

        //code below based on https://www.npmjs.com/package/expo-server-sdk
        let messages = [];
        let body = 'Someone commented on your concept!'

        for (let pushToken of pushTokens) {
          if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
          }
          messages.push([{
            to: pushToken,
            sound: 'default',
            body: body,
            data: { withSome: 'data' },
            ttl: 2419200 //for Androids
          }]);
        }

        let chunks = []
        for (let m of messages){
          chunks.push(expo.chunkPushNotifications(m));
        }
        let tickets = [];
        (async () => {
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

        for (let ticket of tickets){
          if (ticket[0].status === "ok"){
            continue;
          }
          else {
            //there was error with push notification sending
            console.log("There was an error sending this notification");
            let badToken = messages[i].to;
            var removeToken = `
            mutation{
              removeTokenFromUser(user: "${this.state.name}", pushToken: "${badToken}"){
                pushTokens
              }
            }`;
            var removeTokenRes = await fetch(`http://${DOCKER_URL}/graphql?query=` + removeToken, {method: 'POST'});
            var removeTokenResJson = await removeTokenRes.json();
          }
        }
      }
    }
    //else check to see they have entered both one piece of positive and one piece of critical
    else if (iLike.length == 0 || iWish.length == 0 ||
          iLike.trim() == this.state.sentence1 || iWish.trim() == this.state.sentence2) {
      this.setState({ modalErrorMessage: 'You must enter both positive and critical feedback', modalErrorShown: true});
      return;
    }
    else if (iLike.length > 0 && iWish.length > 0) {
        if (!iLike.includes(this.state.sentence1) && !iLike.includes(this.state.sentence1.toLowerCase())){
            this.setState({ modalErrorMessage: 'Feedback in first spot must start with ' + this.state.sentence1, modalErrorShown: true});
            return;
        }
        if (!iWish.includes(this.state.sentence2) && !iWish.includes(this.state.sentence2.toLowerCase())){
            this.setState({ modalErrorMessage: 'Feedback in second spot must start with ' + this.state.sentence2, modalErrorShown: true});
            return;
        }else{
          let data = {
            method: 'POST',
            credentials: 'same-origin',
            mode: 'same-origin',
            body: JSON.stringify({
              _id: this.state.concept.id,
              text1: newiLike,
              text2: newiWish,
            }),
            headers: {
              'Accept':       'application/json',
              'Content-Type': 'application/json',
           }
          }
          const res = await fetch(`http://${DOCKER_URL}/api/yesand`, data);
          const resJson = await res.json();
          updated = true;

          //send push notification
          var query3 = `
            query{
              conceptByID(id: "${this.state.concept.id}") {
                name
              }
            }`;
          const res3 = await fetch(`http://${DOCKER_URL}/graphql?query=` + query3, {method: 'GET'});
          const resJson3 = await res3.json();
          author = resJson3.data.conceptByID.name;

          var query2 = `
            query{
              user(username: "${author}") {
                pushTokens
              }
            }`;
          const res2 = await fetch(`http://${DOCKER_URL}/graphql?query=` + query2, {method: 'GET'});
          const resJson2 = await res2.json();
          const pushTokens = resJson2.data.user.pushTokens;

          //code below based on https://www.npmjs.com/package/expo-server-sdk
          let messages = [];
          let body = 'Someone commented on your concept!'

          for (let pushToken of pushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
              console.error(`Push token ${pushToken} is not a valid Expo push token`);
              continue;
            }
            messages.push([{
              to: pushToken,
              sound: 'default',
              body: body,
              data: { withSome: 'data' },
              ttl: 2419200 //for Androids
            }]);
          }

          let chunks = []
          for (let m of messages){
            chunks.push(expo.chunkPushNotifications(m));
          }
          let tickets = [];
          (async () => {
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

          for (let ticket of tickets){
            if (ticket[0].status === "ok"){
              continue;
            }
            else {
              //there was error with push notification sending
              console.log("There was an error sending this notification");
              let badToken = messages[i].to;
              var removeToken = `
              mutation{
                removeTokenFromUser(user: "${this.state.name}", pushToken: "${badToken}"){
                  pushTokens
                }
              }`;
              var removeTokenRes = await fetch(`http://${DOCKER_URL}/graphql?query=` + removeToken, {method: 'POST'});
              var removeTokenResJson = await removeTokenRes.json();
            }
          }
        }
    }else{
      this.setState({ modalErrorMessage: 'An error occurred, are you sure you entered feedback correctly?', nodalErrorShown: true});
      return;
    }
    //after user send feedback, close modal and reset state for iLike and iWish, as user has decided to cancel submission of feedback
    if (updated){
        this.updateConceptYesAnd();
        this.setState({ iLike: '',
                      modalErrorMessage: '',
                      modalErrorShown: false,
                      iWish: '',
                      openEnded: '',
                      switchValue: true,
                      modalVisible: false,});
    }
   }

  _changeCollapse = async (val) => {
        var conceptNew = this.state.concept;
        conceptNew.isCollapsed = val;
        this.setState({concept: conceptNew});
  }

  _yes = async () => {
    let data = {
       method: 'POST',
       credentials: 'same-origin',
       mode: 'same-origin',
       body: JSON.stringify({
         _id: this.state.concept.id
       }),
       headers: {
         'Accept':       'application/json',
         'Content-Type': 'application/json',
         // 'X-CSRFToken':  cookie.load('csrftoken')
       }
    }
    await fetch(`http://${DOCKER_URL}/api/yes`, data)
    .then(function(response){
      return response.text();
    })
    .then(function(json){
    });

    await this.updateConceptYes();
  }

// id here is the concept id
  _yesAnd = async (id) => {
    this.setState({modalVisible: true});
  }
}


const styles = StyleSheet.create({
  submitButton: {
    marginTop: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth:1,
    borderRadius: 9,
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    width: width * 0.45,
  },
  button: {
    marginTop:10,
    paddingTop:15,
    paddingBottom:15,
    marginLeft:10,
    marginRight:5,
    backgroundColor:'#00BCD4',
    borderRadius:10,
    borderWidth: 1,
    borderColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
  buttonselectvote: {
    marginTop:10,
    marginLeft:10,
    marginRight:5,
    backgroundColor:'white',
    borderRadius:10,
    borderWidth: 1,
    borderColor: 'black',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: "20%",
  },
  buttonunselectvote: {
    marginTop:10,
    marginLeft:10,
    marginRight:5,
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    borderRadius:10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: "20%",
  },
  textselect: {
    fontSize: width*0.04,
    color: 'black',
  },
  textunselect: {
    fontSize: width*0.04,
    color: 'white',
  },
  container: {
    paddingTop: 30,
    paddingBottom: 20,
    flex: 1,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
   absoluteView: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
});
