import React, { Component } from 'react';
import { Image,
          View,
          StyleSheet,
          Text,
          TouchableOpacity,
          TouchableHighlight,
          TextInput,
          Alert,
          ScrollView,
          Modal,
          RefreshControl,
          Dimensions,
          KeyboardAvoidingView,
          Keyboard} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from 'buffer';
const { width, height } = Dimensions.get('window');
import Concept from '../components/Concept';
import statusCheck from "../components/StatusCheck.js";
import {DOCKER_URL} from "@env"

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: "Your info",
    headerLeft: ()=> null
  };

  state = {
    username: '',
    bio: '',
    newbio: '',
    email: '',
    goal: '',
    newgoal: '',
    concepts: null,
    profilePic: [],
    modalErrorMessage: '',
    modalErrorShown: false,
    consentModalVisible: false,
    editBioModalVisible: false,
    editGoalModalVisible: false
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'focus',
      () => { this.getData() },
    );
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

    //query for user bio and other profile info from database:
    var values = await AsyncStorage.multiGet(['username']);
    var username = values[0][1];

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
    const checkResUserInfoJson = await checkResUserInfo.json();
    var goallist = checkResUserInfoJson.data.user.goal;
    var latest_goal = goallist[goallist.length - 1]; 
    await this.setState({
      username: username,
      bio: checkResUserInfoJson.data.user.bio,
      newbio: checkResUserInfoJson.data.user.bio,
      email: checkResUserInfoJson.data.user.email,
      goal: latest_goal,
      newgoal: latest_goal,
      profilePic: checkResUserInfoJson.data.user.profilePic
    });

    var userConcepts = []
    var userConceptID = []
    var noDuplicatesID = [...new Set(checkResUserInfoJson.data.user.concepts)];
    //query for all the concept objects user has shared based on concept ID from database
    console.log("concept list before", noDuplicatesID.length);
    var no
    for (i = 0; i < noDuplicatesID.length; i++){
       var query = `query{
         conceptByID(id: "${noDuplicatesID[i]}"){
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
       var res = await fetch(`http://${DOCKER_URL}/graphql?query=` + query, {method: 'GET'});
       var resJson = await res.json();
       concept = resJson.data.conceptByID;
       if (concept != null && !(concept.id in userConceptID)){
        userConcepts.push(concept);
        userConceptID.push(concept.id);
      }
    }

    for (i = 0; i < userConcepts.length; i++) {
      userConcepts[i].isCollapsed = true;
    }

    var newConcepts = `
      mutation{
        newUserConcepts(username: "${this.state.username}", concepts: ${JSON.stringify(userConceptID)}){
          username
          concepts
        }
      }
    `;
    //this means we have concept ID's in our user model of deleted concepts
    //so we should get rid of them
    if (userConceptID.length < checkResUserInfoJson.data.user.concepts.length){
      var newConceptsRes = await fetch(`http://${DOCKER_URL}/graphql?query=` + newConcepts, {method: 'POST'});
      var newConceptsResJson = await newConceptsRes.json();
    }

    this.setState({concepts: userConcepts.reverse()});

  }

  async editBio() {
    var mutation = `
      mutation{
        editBio(username: "${this.state.username}", bio: "${this.state.newbio}"){
          username
          bio
        }
      }
    `;

    var res = await fetch(`http://${DOCKER_URL}/graphql?query=` + mutation, {method: 'POST'});
    var resJson = await res.json();
    await this.updateUserInfo();
  }

  async editGoal() {
    var mutation = `
      mutation{
        editGoal(username: "${this.state.username}", goal: "${this.state.newgoal}"){
          username
          goal
        }
      }
    `;

    var res = await fetch(`http://${DOCKER_URL}/graphql?query=` + mutation, {method: 'POST'});
    var resJson = await res.json();
    await this.updateUserInfo();
  }

  async updateUserInfo() {
    var values = await AsyncStorage.multiGet(['username']);
    var username = values[0][1];
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
    const checkResUserInfoJson = await checkResUserInfo.json();
    var goallist = checkResUserInfoJson.data.user.goal;
    var latest_goal = goallist[goallist.length - 1]; 
    await this.setState({
      username: username,
      bio: checkResUserInfoJson.data.user.bio,
      newbio: checkResUserInfoJson.data.user.bio,
      email: checkResUserInfoJson.data.user.email,
      goal: latest_goal,
      newgoal: latest_goal,
      profilePic: checkResUserInfoJson.data.user.profilePic
    });

  }

  async deleteConcept(conceptID){
    var mutation = `
      mutation{
        removeConcept(id: "${conceptID}"){
          id
        }
      }
    `;
    var res = await fetch(`http://${DOCKER_URL}/graphql?query=` + mutation, {method: 'POST'});
    var resJson = await res.json();
  }

  render() {
    var images = [];
    //this is for profile pic, not concept
    for (imageI = 0; imageI < this.state.profilePic.length; imageI++){
        const buff = new Buffer(this.state.profilePic[imageI].data);
        const base64data = buff.toString('base64');
        const uriString = `data:image/gif;base64,${base64data}`;
        images.push(uriString);
    }
    const finalImages = images;
    return (
      <View style={{backgroundColor: "#fff"}}>
        <ScrollView persistentScrollbar={true}>
          <Text style={{fontSize: width*0.06, textAlign: "center", fontWeight: "bold",
                      paddingVertical: width*0.03}}>
            {this.state.username + "'s profile"}
          </Text>

          {finalImages.length > 0 && finalImages.map(url => (
            <View key={url} style={styles.slideContainer}>
            <Image
              style={{ width: width * 0.95, height: width * 0.9, borderRadius: 30}}
              source={{uri: url}}
              resizeMode="contain"
            />
            </View>
          ))}

          <Text style={{fontSize: width*0.05, textAlign: "center", fontWeight: "bold",
                        marginVertical: 5, paddingTop: height*0.02}}>
          {this.state.username + "'s email"}
          </Text>

          <Text style={{fontSize: width*0.04, marginHorizontal: width*0.05,
            marginVertical: height*0.02}}>
          {this.state.email}
          </Text>

          <Text style={{fontSize: width*0.05, textAlign: "center", fontWeight: "bold",
                        marginVertical: 5, paddingTop: height*0.02}}>
          {this.state.username + "'s bio"}
          </Text>

          <TouchableHighlight
            accessibilityLabel="Edit bio"
            onPress={() => {
              this.setState({ editBioModalVisible:true,});
            }}>
            <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginBottom: 10}}>
              Edit bio
            </Text>
          </TouchableHighlight>

          <Text style={{fontSize: width*0.04, marginHorizontal: width*0.05,
            marginVertical: height*0.02}}>
          {this.state.bio}
          </Text>

          <TouchableHighlight
          accessibilityLabel="Edit goal"
            onPress={() => {
              this.setState({ editGoalModalVisible:true,});
            }}>
            <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginBottom: 10}}>
              Edit goal
            </Text>
          </TouchableHighlight>

          <Text style={{fontSize: width*0.04, marginHorizontal: width*0.05,
            marginVertical: height*0.02}}>
          {this.state.goal}
          </Text>

          <TouchableHighlight
            accessibilityLabel="View consent form"
            onPress={() => {
              this.setState({ consentModalVisible:true,});
            }}>
            <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginTop: 10, marginBottom: 10}}>
              View Consent Form
            </Text>
          </TouchableHighlight>

          <View
            style={{
              borderBottomColor: '#555555',
              borderBottomWidth: 2,
              marginHorizontal: 20,
              borderRadius: 30,
              marginVertical: 20,
              alignSelf:'stretch',
            }}
          />

          <Text style={{fontSize: width*0.05, textAlign: "center", fontWeight: "bold", marginVertical: 5}}>
          {this.state.username + "'s concepts"}
          </Text>
          {
            this.state.concepts == null &&
            <Text style={{textAlign: "center", fontSize: width*0.04, color: "#777777"}}> Loading concepts ... </Text>
          }
          {
            this.state.concepts != null && this.state.concepts.length == 0 &&
            <Text style={{textAlign: "center", fontSize: width*0.04, color: "#777777"}}>
              You have not shared any concepts yet!
            </Text>
          }
          {this.state.concepts != null && this.state.concepts.length > 0 && this.state.concepts.map((concept) => (
                <View style={{ width: width, borderTopColor: "#D3D3D3", borderTopWidth: 1 }} key = {"view"+concept.id}>
                  <TouchableHighlight
                    key={"delete" + concept.id}
                    onPress={async () => {
                      const AsyncAlert = async () => new Promise((resolve) => {
                        Alert.alert(
                          'You are about to delete this concept.',
                          'Continue?',
                          [
                            {
                              text: 'Delete',
                              onPress: () => resolve('YES'),
                            },
                            {text: 'Cancel', 
                             onPress: () => resolve('NO')},
                          ],
                          {cancelable: false},
                        );
                      });

                      //only delete if user says yes based on alert popup
                      var res = await AsyncAlert();
                      if (res == "YES"){
                        this.deleteConcept(concept.id);
                        Alert.alert("These changes will be reflected the next time you return to this page.");
                      }
                    }}>
                    <Image
                      style={{width: 50, height: 50}}
                      source={require('../assets/images/trash.png')}
                      accessible={true}
                      accessibilityLabel="Delete this concept."
                    />
                  </TouchableHighlight>
                  <Concept key={concept.id} concept={concept} width={width * 0.95} height={width * 0.9}/>
                </View>
              ))}
          {
            this.state.consentModalVisible && <Modal
                animationType="slide"
                transparent={false}
                visible={true}
                onRequestClose={() => {
                  console.log('Modal is closed'); //onRequestClose is a required parameter of the Modal component
              }}>
              <Text style={styles.title}>Informed Consent</Text>
              <ScrollView
              persistentScrollbar={true}
              style={styles.tcContainer}
              >
                  <Text style={styles.tcP}>This mobile application is part of a research study conducted by Yasmine Kotturi (ykotturi@cmu.edu) at Carnegie Mellon University and is funded by Carnegie Mellon University and Facebook Inc.</Text>
                  <Text style={styles.tcP}>Summary</Text>
                  <Text style={styles.tcL}>{'\u2022'} This study seeks to understand how to build software to optimally structure online discussions among designers. For instance, it provides scaffolding for feedback exchanges between peer groups in order for peers to seek and give effective feedback on early-stage design concepts. You MAY want to participate because: this application is intended to help you get better feedback on your early-stage design concepts (such as ideas, prototypes) from a group of your peers. You MAY NOT want to participate because: there is some risk that someone in your peer group could use your ideas without your permission. This risk is mitigated by you choosing a group of peers that your trust to share your ideas with.</Text>
                  <Text style={styles.tcP}>Purpose</Text>
                  <Text style={styles.tcL}>{'\u2022'} The purpose of the research is to understand how to build software to optimally structure online discussions among designers. It is important to do this research because receiving feedback throughout a design process is essential for success, especially early-on a design process. This is because receiving early-stage feedback is likely to improve the quality of the resulting design. </Text>
                  <Text style={styles.tcP}>Procedures</Text>
                  <Text style={styles.tcL}>{'\u2022'} If you participate in this study, first you can create your account and bio page, adding details about what type of work you do. Then, you can Create a Group, consisting of other creative people that you know (for instance, if you're a member of other online peer groups on Facebook, Instagram, or other social media platform). Once in this group, you'll be able to share images of design concepts (sketches of ideas, prototypes) and give feedback to each other, as well show general encouragement for each other's work. You will be able to take photo, or upload a photo from your camera roll. In order to do this, the application will prompt for your permission to access the camera and camera roll. The only photos that will be stored on our secured servers are the ones that you upload. You will be able to receive immediate feedback from the application, by uploading images to the applications Machine-Delivered feedback section. To receive feedback from peers, you are able to invite them to join your group, securely sharing your group's credentials with those who you would like to include. They will only be allowed to join your group if they consent.  Once your peer joins your group, he or she will be able to invite other people to join your group. Group members can see who is in the group (their bio page) at all times, as well as all of the concepts shared within that group. Therefore do not say or share anything that is both identifiable and private about yourself or others during this study. Groups are limited to 25 users. </Text>
                  <Text style={styles.tcL}>{'\u2022'} We will continue to host the application until August 2023. You can continue to use this application during this one-year time period. You can continue to use this application during this one-year time period, and we will provide a notebook for you to write down your reflections of using the application, if you choose to do so. Do not write down anything which is both identifiable and private in your reflection notebook. We will continue to log and collect your interaction with our application during this time. All data collection will end August 2023. Throughout this year, we may request a follow up interview with you, to understand your longer-term use of this application (if any); which we would conduct remotely via Skype or Zoom. The likelihood of whether we ask you for a follow up interview will depend on your usage of the application: for instance, if you are using our application repeatedly for more than one month, it will be more likely that we request a paid follow up interview with you. </Text>
                  <Text style={styles.tcP}>Participant Requirements </Text>
                  <Text style={styles.tcL}>{'\u2022'} Participation in this study is limited to individuals age 18 and older. You must be also be engaging in a creative discipline, or interested in beginning work in one. </Text>
                  <Text style={styles.tcP}>Risks </Text>
                  <Text style={styles.tcL}>{'\u2022'} The risks and discomfort associated with participation in this study are no greater than those ordinarily encountered in daily life or during other online activities.  There is a potential risk of breach of confidentiality. The research team takes every precaution to prevent this from happening by storing data securely. All of your data (including your username, ideas shared with your group) are stored on a secure server . Your reflection notebook will be stored in a locked file cabinet.  You may not want to participate because there is some risk that someone in your peer group could use your ideas without your permission. This risk is mitigated by you choosing a group of peers that your trust to share your ideas with. The researchers further mitigate this risk as the application captures timestamps when a concept was shared, and by whom. </Text>
                  <Text style={styles.tcL}>{'\u2022'} You can report abuse to and resolve conflicts with the Principal Investigator, Yasmine Kotturi, directly by emailing her: ykotturi@cmu.edu. If you are participating with individuals who are not already known to you, you may potentially feel uncomfortable sharing your work.  You should not share your work if you feel uncomfortable doing so.  You can also stop participating at any time by leaving the study.  There is some risk that you could receive negative feedback on your work and that the other members of the group may see the negative feedback. </Text>
                  <Text style={styles.tcP}>Benefits </Text>
                  <Text style={styles.tcL}>{'\u2022'} There is no direct benefit to participating in this study.  You may receive indirect benefits by receiving effective feedback and having discussions with your peers' on your creative work,  getting inspired by seeing others' early-stage ideas, and ultimately producing higher quality work, and help others to produce higher quality work.</Text>
                  <Text style={styles.tcP}>Compensation & Costs </Text>
                  <Text style={styles.tcL}>{'\u2022'} There is no compensation for participation in this study. There will be no cost to you if you participate in this study.  If we contact you for a one-hour follow-up interview, compensation is $20. </Text> 
                  <Text style={styles.tcP}>Future Use of Information</Text>
                  <Text style={styles.tcL}>{'\u2022'} In the future, once we have removed all identifiable information from your data, we may use the data for our future research studies, or we may distribute the data to other researchers for their research studies.  We would do this without getting additional informed consent from you (or your legally authorized representative).  Sharing of data with other researchers will only be done in such a manner that you will not be identified. </Text>
                  <Text style={styles.tcP}>Confidentiality </Text>
                  <Text style={styles.tcL}>{'\u2022'} By participating in this research, you understand and agree that Carnegie Mellon may be required to disclose your consent form, data and other personally identifiable information as required by law, regulation, subpoena or court order.  Otherwise, your confidentiality will be maintained in the following manner: your data and consent form will be kept separate. Your consent form and reflection notebook will be stored in a secure location on Carnegie Mellon property and will not be disclosed to third parties. Our Facebook collaborators will only have access to de-identified data. By participating, you understand and agree that the data and information gathered during this study may be used by Carnegie Mellon and published and/or disclosed by Carnegie Mellon to others outside of Carnegie Mellon.  However, your name, address, contact information and other direct personal identifiers will not be mentioned in any such publication or dissemination of the research data and/or results by Carnegie Mellon. Note that per regulation all research data must be kept for a minimum of 3 years.  </Text>
                  <Text style={styles.tcL}>{'\u2022'} All identifiable information will be held on a secure server, and will only be accessible to researchers. Access will be protected with public key encryption. All data transfers will be on encrypted channels. There is a risk of breach of confidentiality. The research team takes every precaution to prevent this from happening by storing data securely. Your reflection notebook will be stored in a locked file cabinet. </Text>
                  <Text style={styles.tcL}>{'\u2022'} If you create or join a group on the application, all group members will be able to see the bio (username, profile picture, description of your craft) you created, and any design concepts you have shared (photo and description of your ideas or prototypes).  </Text>
                  <Text style={styles.tcP}>Right to Ask Questions & Contact Information </Text>
                  <Text style={styles.tcL}>{'\u2022'} If you have any questions about this study, you should feel free to ask them by contacting the Principal Investigator now at  Yasmine Kotturi, Postdoctoral Associate, Human-Computer Interaction Institute 5000 Forbes Avenue Pittsburgh PA 15213 412-268-5476. If you have questions later, desire additional information, or wish to withdraw your participation please contact the Principal Investigator by mail, phone or e-mail in accordance with the contact information listed above.  </Text>
                  <Text style={styles.tcL}>{'\u2022'} If you have questions pertaining to your rights as a research participant; or to report concerns to this study, you should contact the Office of Research integrity and Compliance at Carnegie Mellon University.  Email: irb-review@andrew.cmu.edu . Phone: 412-268-1901 or 412-268-5460.</Text>
                  <Text style={styles.tcP}>Voluntary Participation </Text>
                  <Text style={styles.tcL}>{'\u2022'} Your participation in this research is voluntary.  You may discontinue participation at any time during the research activity.  You may print a copy of this consent form for your records.</Text>
              </ScrollView>

              <TouchableHighlight
               style={styles.button}
               onPress={() => this.setState({consentModalVisible: false})}
                accessibilityLabel="Exit button"
              >
              <Text style={styles.buttonLabel}>Exit</Text>
              </TouchableHighlight>
            </Modal>
          }

          {
            this.state.editBioModalVisible && <Modal
                animationType="slide"
                transparent={false}
                visible={true}
                onRequestClose={() => {
                  console.log('Modal is closed'); //onRequestClose is a required parameter of the Modal component
              }}>

              <Text style={styles.title}>Edit your bio</Text>
              {this.state.modalErrorShown &&
              <Text style={{color: 'red', fontWeight: 'bold', paddingLeft: width*0.3}}> {this.state.modalErrorMessage} </Text>
              }
              <View style={{flexDirection: 'row'}}>
                <TextInput
                  style={styles.newBio}
                  onChangeText={(text) => this.setState({newbio: text})}
                  placeholder="Enter a brief bio describing yourself or your work! (required)"
                  returnKeyType="done"
                  ref = {ref => {
                    this._bioinput = ref;
                  }}
                  multiline= {true}
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={false}
                  value={this.state.newbio}
                />
              </View>

              <TouchableHighlight
               style={styles.submitButton}
               accessibilityLabel="Submit button"
               onPress={() => {
                 if (this.state.newbio.trim().length == 0){
                  this.setState({
                    modalErrorMessage: "Your bio can't be empty.",
                    modalErrorShown: true
                  });
                 }
                 else{
                  this.editBio();
                  this.setState({editBioModalVisible:false, modalErrorMessage: '', modalErrorShown: false});
                 }
               }}
              >
                <Text style={{paddingHorizontal: width * 0.10, fontSize: 20, color: "#ffffff"}}>
                  Submit
                </Text>
              </TouchableHighlight>

              <TouchableHighlight
               accessibilityLabel="Exit button"
                onPress={() => {
                  var tempbio = this.state.bio;
                  this.setState({ editBioModalVisible:false, modalErrorMessage: '', newbio: tempbio, modalErrorShown: false});
                }}>
                <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginTop: 10}}>
                  Exit
                </Text>
              </TouchableHighlight>

            </Modal>
          }

          {
            this.state.editGoalModalVisible && <Modal
                animationType="slide"
                transparent={false}
                visible={true}
                style={{justifyContent: "center"}}
                onRequestClose={() => {
                  console.log('Modal is closed'); //onRequestClose is a required parameter of the Modal component
              }}>

              <Text
              style={styles.title}>Edit your goal</Text>

              {this.state.modalErrorShown &&
              <Text style={{color: 'red', fontWeight: 'bold', paddingLeft: width*0.3}}> {this.state.modalErrorMessage} </Text>
              }

              <View style={{flexDirection: 'row'}}>
                <TextInput
                  style={styles.newBio}
                  onChangeText={(text) => this.setState({newgoal: text})}
                  placeholder="Enter your 6 month business goal (required)"
                  returnKeyType="done"
                  ref = {ref => {
                    this._goalinput = ref;
                  }}
                  multiline= {true}
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={false}
                  value={this.state.newgoal}
                />
              </View>

              <TouchableHighlight
               accessibilityLabel="Submit button"
               style={styles.submitButton}
               onPress={() => {
                 if (this.state.newgoal.trim().length == 0) {
                  this.setState({
                    modalErrorMessage: "Your goal can't be empty.",
                    modalErrorShown: true
                  });
                 }
                 else{
                  this.editGoal();
                  this.setState({editGoalModalVisible:false, modalErrorMessage: '', modalErrorShown: false});
                 }
               }}
              >
                <Text style={{paddingHorizontal: width * 0.10, fontSize: 20, color: "#ffffff"}}>
                  Submit
                </Text>
              </TouchableHighlight>

              <TouchableHighlight
                accessibilityLabel="Exit button"
                onPress={() => {
                  var tempgoal = this.state.goal;
                  this.setState({ editGoalModalVisible:false, modalErrorMessage: '', newgoal: tempgoal, modalErrorShown: false});
                }}>
                <Text style={{textAlign: "center", fontSize: 20, color: "#777777", textDecorationLine: "underline", marginTop: 10}}>
                  Exit
                </Text>
              </TouchableHighlight>

            </Modal>
          }
        </ScrollView>
      </View>
    );
  }
}


const styles = StyleSheet.create({
    title: {
        fontSize: 22,
        alignSelf: 'center',
        marginTop: "-10%"
    },
    slideContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    title: {
        fontSize: 22,
        alignSelf: 'center',
        marginTop: "10%"
    },
    tcP: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14
    },
    tcP:{
        marginTop: 10,
        fontSize: 14,
        fontWeight: 'bold'
    },
    tcL:{
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 5,
        fontSize: 14
    },
    tcContainer: {
        marginTop: 20,
        marginBottom: 10,
        height: height * .45,
        marginHorizontal: 10
    },

    button:{
        backgroundColor: '#136AC7',
        borderRadius: 5,
        padding: 10,
        width: "50%",
        height: "6%",
        alignSelf: 'center',
        marginBottom: 10
    },
    buttonLabel:{
        fontSize: 14,
        color: '#FFF',
        alignSelf: 'center'
    },
    newBio: {
      height: 200,
      left: 65,
      flex: 0.65,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 5,
      borderRadius: 5,
      paddingHorizontal: 3,
      marginTop: 10,
      fontSize: 18,
    },
    submitButton: {
      marginTop: 20,
      paddingTop: 10,
      paddingBottom: 10,
      borderWidth:1,
      borderRadius: 9,
      borderColor: "#0076ff",
      backgroundColor: "#0076ff",
      width: width * 0.45,
      elevation: 3,
      left: 110,
    },
});
