import React, { Component } from 'react';
import {  // Button,
          // Image,
          View,
          // StyleSheet,
          Text,
          Dimensions,
          // TouchableOpacity,
          // TouchableHighlight,
          // TextInput,
          // Alert,
          ScrollView,
          // Modal,
          // Pressable,
          RefreshControl } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
// because we're using mangaged apps version of expo (and not bare version):
// import { Camera } from 'expo';
// import * as ImagePicker from 'expo-image-picker';
// import { Buffer } from 'buffer';
// import Clipboard from 'expo-clipboard';
// import Collapsible from 'react-native-collapsible';
// import ImageCarousel from 'react-native-image-carousel';
import Concept from '../components/Concept';
import styles from '../components/style';
import statusCheck from "../components/StatusCheck.js";
// import { render } from 'enzyme';
// import { Ionicons } from '@expo/vector-icons';
import {DOCKER_URL} from "@env"
const { width, height } = Dimensions.get("window");

// PICK UP HERE
//TODO: change infrastructure of this file to make state hold multple values of what a concept is

export default class GiveFeedback extends React.Component {
  static navigationOptions = {
    title: "Give Feedback",
    headerLeft: ()=> null
  };

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
  state = {
    username: null,
    group_id: null,
    groupName: null,
    priorityConcepts: new Array(), // Concepts that have no yes ands in the last week
    concepts: true,
    modalVisible: false,
    showMessageMessage: true,
    inviteLink: '',
    // testConcepts: new Array()
  };

  async getData() {
    var status = await statusCheck();
    if (status == "down"){
      this.props.navigation.navigate("Maintenance");
      return;
    }

    await this.setData();
    this.getConcepts(this.state.group_id);
  }

  
  _onRefresh = async () => {
    this.setState({refreshing: true});
    await this.setData();
    this.getConcepts(this.state.group_id).then(() => {
      this.setState({refreshing: false});
    });
  }

  async setData() {
    let values
    try {
      values = await AsyncStorage.multiGet(['groupName', 'username', 'groupID']);
      this.setState({groupName: values[0][1], username: values[1][1], group_id: values[2][1]})
    } catch (err) {
      console.log(err);
    }
  }

  async getConcepts(groupid) {
    var query = `
      query{
        concept(group_id: "${groupid}"){
          id
          name
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
      }`;
    //console.log('query', query);
    const res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
    const resJson = await res.json();
    //console.log('query results', JSON.stringify(resJson));
    var conceptsList = resJson.data.concept;
    var priorityList = new Array();
    var nonPriorityList = new Array();
    // console.info(conceptsList);
    if (conceptsList != null) {
      for (i = 0; i < conceptsList.length; i++) {
        if (conceptsList[i].yesand.length > 0){
          conceptsList[i].isCollapsed = true;
        }

        var timeNow =  new Date();
        var postTime = new Date(conceptsList[i].timestamp);
        // Number of days between the post timestamp and the current time
        var dateDiff = (timeNow.getTime() - postTime.getTime())/(1000*3600*24);
        // Prioritization of posts with no yes ands that are older than a week and less than 3 weeks old
        if (((conceptsList[i].poll_options.length == 0 && conceptsList[i].yesand.length == 0) ||
            (conceptsList[i].poll_options.length > 0 && !conceptsList[i].voter_list.includes(this.state.username))) && 
            dateDiff >= 7 && dateDiff <= 22) {
          priorityList.push(conceptsList[i]);
        } else {
          nonPriorityList.push(conceptsList[i]);
        }

        for (var j = 0; j < conceptsList[i].yesand.length; j++){
        //  console.log(concepts[i].yesand, groupid);
          if (conceptsList[i].yesand[j] != null && conceptsList[i].yesand[j])
            conceptsList[i].isCollapsed = true;
        }
      }
      this.setState({priorityConcepts: priorityList})
      this.setState({concepts: nonPriorityList.reverse()});
    }
  }

  render() {
    if (this.state.concepts == true){
      return(<View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.noConceptsHeader}>Loading concepts...</Text>
      </View>);
    }
    else if(this.state.concepts.length == 0 && this.state.priorityConcepts.length == 0) {
      return(
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={styles.noneYetHeader}>Nothing to give feedback on yet!</Text>
          <Text style={styles.noneYetText}>Once you or a member of your peer group uploads a concept, they will appear here!</Text>
        </View>
      );
    }
    else {
          return(
            <ScrollView contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                  refreshing={this.state.refreshing}
                  onRefresh={this._onRefresh}
                />
              }>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: "#fff" }}>
              <Text style={styles.getStartedText}>Review Concepts for {this.state.groupName}</Text>
              {this.state.priorityConcepts.length > 0 &&
                <Text style={styles.feedbackSectionText}>
                  These posts are prioritized because they haven't had feedback in more than a week.
                </Text>
              }
              {this.state.priorityConcepts.map(concept => (
                  <View key={"feedbackview" + concept.id} style={{ width: width, borderTopColor: "#D3D3D3", borderTopWidth: 1}}>
                    <Concept key={concept.id} concept={concept} />
                  </View>
                ))}
              {this.state.concepts.length > 0 && this.state.priorityConcepts.length > 0 && 
                  <Text style={styles.feedbackSectionText}>You've seen all prioritized posts.</Text>
              }
              {this.state.concepts.map(concept => (
                <View key={"feedbackview" + concept.id} style={{ width: width, borderTopColor: "#D3D3D3", borderTopWidth: 1}}>
                  <Concept key={concept.id} concept={concept} />
                </View>
              ))}
            </View>
            </ScrollView>
          );
      }
  }
}