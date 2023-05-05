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
  Modal,
  ActivityIndicator,
} from "react-native";
import { Tooltip, CheckBox } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Buffer } from "buffer";
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
    userID: "",
    condition: Math.random() < 0.5 ? "experimental" : "control",
    existingUser: null,
    bio: "",
    email: "",
    goal: "",
    images: [], //contain uri of the profile images to use as key and image source
    imagesBase64: [], //contains the actual pixel value arrays of the profile images
    hasCameraPermission: null,
    hasCameraRollPermission: null,
    modalVisible: false,
    eighteen: false,
    understandRisks: false,
    wishToContinue: false,
    AcceptedConsent: false,
    clickable: false,
    profilePic: [],
    notConsented: false,
    loading: false,
  };

  askCameraPermissionsAsync = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission hasn't been granted. Please change your app settings.")
    }
    //if return is state = given permissions, then update state

    // probably need to do something to verify that permissions
    // were actually granted
  };

  askCameraRollPermissionsAsync = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Media library permission hasn't been granted. Please change your app settings.")
    }
    //if return is state = given permissions, then update state

    // probably need to do something to verify that permissions
    // were actually granted
  };

  async makeClickable() {
    if (!this.state.clickable) {
      this.setState({ clickable: true });
    } else {
      this.setState({ clickable: false });
    }
  }

  async notScrolledThrough() {
    Alert.alert("You must read through all the terms first!");
  }

  //wait until you have a result from your awaits before your eturn the function
  async existingUser(username) {
    var query = `query{user(username: "${username}"){id username}}`;
    //TODO have this be an async function,  function, check if user exists check if the username exists first
    try {
      let response = await fetch(
        `http://${DOCKER_URL}/graphql?query=` + query,
        { method: "GET" }
      );
      const checkResJson = await response.json();

      if (checkResJson.data.user === null) {
        this.setState({ existingUser: false });
        return false;
      } else {
        //if the user exists already
        this.setState({ existingUser: true });
        return true;
      }
    } catch (err) {
      console.log(
        "There has been a problem with your fetch operation: " + err.message
      );
      throw err;
    }
  }

  CleanJSONQuotesOnKeys(json) {
    return json.replace(/"(\w+)"\s*:/g, "$1:");
  }

  async checkInputs() {
    console.log("checking inputs! ");
    var temp = [];
    const regexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    for (i = 0; i < this.state.imagesBase64.length; i++) {
      var buff = Buffer.from(this.state.imagesBase64[i], "base64");
      buff = JSON.stringify(buff);
      buff = JSON.parse(buff);
      const elem = {
        data: buff.data,
        contentType: "image/png"
      };
      temp.push(elem);
    }

    var profilePic = JSON.stringify(temp);
    profilePic = this.CleanJSONQuotesOnKeys(profilePic); //get rid of quotes around keys
    this.setState({ profilePic: profilePic });

    var query = `query{user(username: "${this.state.username}"){id}}`;
    let checkRes = await fetch(
      `http://${DOCKER_URL}/graphql?query=` + query,
      { method: "GET" }
    );
    let checkResJson = await checkRes.json();
    if (this.state.existingUser) {
      console.log("inside existing user");

      Alert.alert(
        "Username " + this.state.username + " already exists",
        "Please try again with a different username",
        [{ text: "OK", onPress: () => console.log("OK Pressed") }],
        { cancelable: false }
      );
      return;
    } else if (this.state.username == "") {
      Alert.alert("You did not enter a username!");
      return;
    } else if (this.state.password == null || this.state.password == "") {
      Alert.alert("You did not enter a password!");
      return;
    } else if (this.state.imagesBase64.length == 0) {
      Alert.alert("You did not upload a profile image!");
      return;
    } else if (this.state.bio.length == 0) {
      Alert.alert("You did not enter a bio!");
      return;
    } else if (this.state.email.length == 0) {
      Alert.alert("You did not enter an email!");
      return;
    } else if (!regexp.test(this.state.email)) {
      Alert.alert("Please enter a valid email!");
      return;
    } else if (this.state.goal.length == 0) {
      Alert.alert("You did not enter a goal!");
      return;
    } else {
      console.log("inputs all good!");
      this.setState({ modalVisible: true });
      return;
    }
  }

  /////////////
  async onCreate() {
    this.setState({loading: true});
    console.log("loading true")
    var username = this.state.username;
    var unhashed = this.state.password;
    var password = Sha256.hash(unhashed);
    var condition = this.state.condition;
    var bio = this.state.bio;
    bio = bio.trim();
    var email = this.state.email;
    email = email.trim();
    var goal = this.state.goal;
    goal = goal.trim();
    var goallist = [String(goal)];
    var profilePic = this.state.profilePic;

    //check if the username exists first

    try {
      /*
          console.log("username in createuser is " + username);
          console.log("password in createuser is " + password);
          console.log("condition in createuser is " + condition);
          console.log("bio in createuser is " + bio);
          try {
            await AsyncStorage.multiSet([
              ["username", username],
              ["password", password],
              ["condition", condition],
              ["bio", bio],
              ["profilePic", profilePic]
            ]);
            this.props.navigation.navigate('Consent');
          }
          catch (error) {
            Alert.alert("Error saving data to storage!");
          }
          */

      var mutation = `
          mutation{
            addUser(username:"${username}", password:"${password}",
            hasConsented: true, condition: "${condition}",
            bio: """${bio.trim()}""", email: "${email.trim()}", goal: ${JSON.stringify(goallist)}, profilePic: ${profilePic})
            {
              username
              password
              hasConsented
              condition
              bio
              email
              goal
              profilePic{
                data
                contentType
              }
            }
          }`;
      var body = {
        query: mutation
      };
      let data = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body)
      };

      fetch(`http://${DOCKER_URL}/graphql`, data)
        .then(response => {
          return response.json();
        })
        .then(async json => {
          if (json.errors) {
            console.log("error locations: " + json.errors.locations)
            throw new Error(json.errors.message);
          }
          console.log("success");

          var query = `query{user(username: "${username}"){id username}}`;
          try {
            fetch(`http://${DOCKER_URL}/graphql?query=` + query, {
              method: "GET"
            })
              .then(response => {
                return response.json();
              })
              .then(async json => {
                console.log("response values are " + JSON.stringify(json));
                console.log("id? ", json.data.user.id);
                await AsyncStorage.multiSet([
                  ["userID", json.data.user.id],
                  ["username", username],
                  ["loggedin", "true"]
                ]);
                this.setState({loading: false})
                console.log("loading false")
              });
            //const getIDResJson = await getIDRes.json();

            //console.log("getIDRes is  " + JSON.stringify(getIDRes));
            //console.log("getIDResJson is " + JSON.stringify(getIDResJson));
            //console.log("getIDResJson.data is " + getIDResJson.data.user);

            //this.setState({userID: getIDResJson.data.user.id});

            Alert.alert("Thanks for creating a new profile with us!", "", [
              {
                text: "OK",
                onPress: () => {
                  this.setState({ modalVisible: false });
                  this.props.navigation.navigate('Main', { screen: 'First' });
                }
              }
            ]);
            //await this.setState({modalVisible:false}, () => this.props.navigation.navigate('HomeHome'));
            return;
          } catch (err) {
            console.log(
              "There has been a problem with your fetch operation: " +
                err.message
            );
            Alert.alert("Oops! There was an error. Please try again.");
            throw err;
            return false;
          }
        })
        .catch(function(error) {
          console.log(
            "There has been a problem with your fetch operation: " +
              error.message
          );
          Alert.alert("Oops something went wrong, please try again.");
          throw error;
          return false;
        });
    } catch (err) {
      console.log(err.message);
      throw err;
      return false;
    }
  }

  //underscore before function name to distinguish internal methods from the lifecycle methods of react
  _pickImage = async () => {
    await this.askCameraRollPermissionsAsync();
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true
    });

    // probably need some express api post call to add "result" variable to database

    if (!result.canceled) {
      var temp = this.state.images;
      if (temp.length == 0) {
        temp.push(result.assets[0].uri);
      } else {
        temp[0] = result.assets[0].uri;
      }
      var temp2 = this.state.imagesBase64;
      if (temp2.length == 0) {
        temp2.push(result.assets[0].base64);
      } else {
        temp2[0] = result.assets[0].base64;
      }
      this.setState({ images: temp, imagesBase64: temp2 });
    }
  };

  _takePicture = async () => {
    await this.askCameraPermissionsAsync();
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true
    });

    if (!result.canceled) {
      var temp = this.state.images;
      if (temp.length == 0) {
        temp.push(result.assets[0].uri);
      } else {
        temp[0] = result.assets[0].uri;
      }
      var temp2 = this.state.imagesBase64;
      if (temp2.length == 0) {
        temp2.push(result.assets[0].base64);
      } else {
        temp2[0] = result.assets[0].base64;
      }
      this.setState({ images: temp, imagesBase64: temp2 });
    }
  };

  render() {
    return (
      <View style={{ flex: 1, paddingBottom: 30 }} pointerEvents={this.state.loading ? 'none' : 'auto'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
          style={{ width: "100%", backgroundColor: "#fff" }}
        >
          <KeyboardAvoidingView enabled>
            <KeyboardAwareScrollView resetScrollToCoords={{ x: 0, y: 0 }}>
              <View style={styles.container}>
                <Image
                  style={{ width: 300, height: 51, marginBottom: 10 }}
                  source={require("../assets/images/peerdea-logo-draft.png")}
                  accessible={true}
                  accessibilityLabel="Peerdea app logo"
                />
                <Text style={{ textAlign: "center" }}>
                  Upload or take a profile picture
                </Text>

                {this.state.images.length == 0 && ( //no image placeholder image
                  <View
                    key={this.state.images[0]}
                    style={[{ padding: 0 }, styles.slideContainer]}
                  >
                    <Image
                      style={{
                        width: width * 0.85,
                        height: width * 0.85,
                        borderRadius: 30,
                        opacity: 0.6
                      }}
                      source={{
                        uri:
                          "https://t3.ftcdn.net/jpg/02/68/55/60/240_F_268556012_c1WBaKFN5rjRxR2eyV33znK4qnYeKZjm.jpg"
                      }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                {this.state.images.length == 1 && ( //just 1 uploaded image
                  <View
                    key={this.state.images[0]}
                    style={styles.slideContainer}
                  >
                    <Image
                      style={{
                        width: width * 0.85,
                        height: width * 0.85,
                        borderRadius: 30
                      }}
                      source={{ uri: this.state.images[0] }}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    width: "95%",
                    marginBottom: 10
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

                {this.state.existingUser && (
                  <Text style={{ color: "red" }}>
                    {" "}
                    The user {this.state.username} already exists.{" "}
                  </Text>
                )}

                <TextInput
                  style={styles.hintTextMedium}
                  onChangeText={async text => {
                    await this.existingUser(text.trim());
                    this.setState({ username: text.trim() });
                  }}
                  placeholder="Enter a username (required)" placeholderTextColor="grey"
                  //workaround to prevent autofill
                  textContentType="oneTimeCode"
                  ref={ref => {
                    this._usernameinput = ref;
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    this._passwordinput && this._passwordinput.focus()
                  }
                  blurOnSubmit={false}
                />

                <TextInput
                  style={styles.hintTextMedium}
                  onChangeText={text => this.setState({ password: text })}
                  placeholder="Enter a password (required)" placeholderTextColor="grey"
                  //workaround to prevent autofill
                  textContentType="oneTimeCode"
                  secureTextEntry={true}
                  ref={ref => {
                    this._passwordinput = ref;
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    this._emailinput && this._emailinput.focus()
                  }
                  blurOnSubmit={false}
                />

                <TextInput
                  style={styles.hintTextMedium}
                  onChangeText={text => this.setState({ email: text })}
                  placeholder="Enter your email (required)" placeholderTextColor="grey"
                  keyboardType="email-address"
                  ref={ref => {
                    this._emailinput = ref;
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    this._bioinput && this._bioinput.focus()
                  }
                  blurOnSubmit={false}
                />

                <TextInput
                  style={styles.hintTextMedium}
                  onChangeText={text => this.setState({ bio: text })}
                  placeholder="Enter a brief bio describing yourself or your work! (required)" placeholderTextColor="grey"
                  returnKeyType="next"
                  ref={ref => {
                    this._bioinput = ref;
                  }}
                  multiline={true}
                  onSubmitEditing={() =>
                    this._goalinput && this._goalinput.focus()
                  }
                  blurOnSubmit={false}
                />

                <TextInput
                  style={styles.hintTextMedium}
                  onChangeText={text => this.setState({ goal: text })}
                  placeholder="Enter a 6 month goal for your business! (required)" placeholderTextColor="grey"
                  returnKeyType="done"
                  ref={ref => {
                    this._goalinput = ref;
                  }}
                  multiline={true}
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={false}
                />

                <TouchableHighlight
                  style={styles.buttonMedium}
                  onPress={() => this.checkInputs()}
                >
                  <Text style={styles.buttonText}>Sign up</Text>
                </TouchableHighlight>
              </View>
            </KeyboardAwareScrollView>
          </KeyboardAvoidingView>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            console.log("Modal is closed"); //onRequestClose is a required parameter of the Modal component
          }}
        >
          <View style={styles.consentContainer}>
            <Text style={styles.title}>Informed Consent</Text>
            <ScrollView persistentScrollbar={true} style={styles.tcContainer}>
              <Text style={{ color: "red", fontSize: 16, fontWeight: "bold" }}>
                You must read all of this information before you are able to
                proceed:
              </Text>
              <Text style={styles.tcP}>
                This mobile application is part of a research study conducted by 
                Yasmine Kotturi (ykotturi@cmu.edu) at Carnegie Mellon University 
                and is funded by Carnegie Mellon University and Facebook Inc.
              </Text>
              <Text style={styles.tcP}>Summary</Text>
              <Text style={styles.tcL}>
                {"\u2022"} This study seeks to understand how to build software
                to optimally structure online discussions among designers. For
                instance, it provides scaffolding for feedback exchanges between
                peer groups in order for peers to seek and give effective
                feedback on early-stage design concepts. You MAY want to
                participate because: this application is intended to help you
                get better feedback on your early-stage design concepts (such as
                ideas, prototypes) from a group of your peers. You MAY NOT want
                to participate because: there is some risk that someone in your
                peer group could use your ideas without your permission. This
                risk is mitigated by you choosing a group of peers that your
                trust to share your ideas with.
              </Text>
              <Text style={styles.tcP}>Purpose</Text>
              <Text style={styles.tcL}>
                {"\u2022"} The purpose of the research is to understand how to 
                build software to optimally structure online discussions among 
                designers. It is important to do this research because receiving 
                feedback throughout a design process is essential for success, 
                especially early-on a design process. This is because receiving 
                early-stage feedback is likely to improve the quality of the 
                resulting design.
              </Text>
              <Text style={styles.tcP}>Procedures</Text>
              <Text style={styles.tcL}>
                {"\u2022"} If you participate in this study, first you can 
                create your account and bio page, adding details about what 
                type of work you do. Then, you can Create a Group, consisting 
                of other creative people that you know (for instance, if you're 
                a member of other online peer groups on Facebook, Instagram, or 
                other social media platform). Once in this group, you'll be 
                able to share images of design concepts (sketches of ideas, 
                prototypes) and give feedback to each other, as well show 
                general encouragement for each other's work. You will be able 
                to take photo, or upload a photo from your camera roll. In 
                order to do this, the application will prompt for your 
                permission to access the camera and camera roll. The only 
                photos that will be stored on our secured servers are the ones 
                that you upload. You will be able to receive immediate feedback 
                from the application, by uploading images to the applications 
                Machine-Delivered feedback section. To receive feedback from 
                peers, you are able to invite them to join your group, securely 
                sharing your group's credentials with those who you would like 
                to include. They will only be allowed to join your group if 
                they consent.  Once your peer joins your group, he or she will 
                be able to invite other people to join your group. Group 
                members can see who is in the group (their bio page) at all 
                times, as well as all of the concepts shared within that group. 
                Therefore do not say or share anything that is both identifiable 
                and private about yourself or others during this study. 
                Groups are limited to 25 users.
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} We will continue to host the application until August 
                2023. You can continue to use this application during this one-
                year time period. You can continue to use this application 
                during this one-year time period, and we will provide a notebook 
                for you to write down your reflections of using the application, 
                if you choose to do so. Do not write down anything which is 
                both identifiable and private in your reflection notebook. We 
                will continue to log and collect your interaction with our 
                application during this time. All data collection will end 
                August 2023. Throughout this year, we may request a follow up 
                interview with you, to understand your longer-term use of this 
                application (if any); which we would conduct remotely via Skype 
                or Zoom. The likelihood of whether we ask you for a follow up 
                interview will depend on your usage of the application: for 
                instance, if you are using our application repeatedly for more 
                than one month, it will be more likely that we request a paid 
                follow up interview with you.
              </Text>
              <Text style={styles.tcP}>Participant Requirements </Text>
              <Text style={styles.tcL}>
                {"\u2022"} Participation in this study is limited to 
                individuals age 18 and older. You must be also be engaging in a 
                creative discipline, or interested in beginning work in one.
              </Text>
              <Text style={styles.tcP}>Risks </Text>
              <Text style={styles.tcL}>
                {"\u2022"} The risks and discomfort associated with 
                participation in this study are no greater than those 
                ordinarily encountered in daily life or during other online 
                activities.  There is a potential risk of breach of 
                confidentiality. The research team takes every precaution to 
                prevent this from happening by storing data securely. All of 
                your data (including your username, ideas shared with your 
                group) are stored on a secure server . Your reflection notebook 
                will be stored in a locked file cabinet.  You may not want to 
                participate because there is some risk that someone in your peer 
                group could use your ideas without your permission. This risk is 
                mitigated by you choosing a group of peers that your trust to 
                share your ideas with. The researchers further mitigate this 
                risk as the application captures timestamps when a concept was 
                shared, and by whom. 
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} You can report abuse to and resolve conflicts with the 
                Principal Investigator, Yasmine Kotturi, directly by emailing 
                her: ykotturi@cmu.edu. If you are participating with individuals 
                who are not already known to you, you may potentially feel 
                uncomfortable sharing your work.  You should not share your work 
                if you feel uncomfortable doing so.  You can also stop 
                participating at any time by leaving the study.  There is some 
                risk that you could receive negative feedback on your work and 
                that the other members of the group may see the negative 
                feedback.
              </Text>
              <Text style={styles.tcP}>Benefits </Text>
              <Text style={styles.tcL}>
                {"\u2022"} There is no direct benefit to participating in this 
                study.  You may receive indirect benefits by receiving 
                effective feedback and having discussions with your peers' on 
                your creative work,  getting inspired by seeing others' 
                early-stage ideas, and ultimately producing higher quality work, 
                and help others to produce higher quality work.
              </Text>
              <Text style={styles.tcP}>Compensation and Costs </Text>
              <Text style={styles.tcL}>
                {"\u2022"} There is no compensation for participation in this 
                study. There will be no cost to you if you participate in this 
                study.  If we contact you for a one-hour follow-up interview, 
                compensation is $20.
              </Text>
              <Text style={styles.tcP}>Future Use of Information</Text>
              <Text style={styles.tcL}>
                {"\u2022"} In the future, once we have removed all identifiable 
                information from your data, we may use the data for our future 
                research studies, or we may distribute the data to other 
                researchers for their research studies.  We would do this 
                without getting additional informed consent from you (or your 
                legally authorized representative).  Sharing of data with other 
                researchers will only be done in such a manner that you will 
                not be identified.
              </Text>
              <Text style={styles.tcP}>Confidentiality </Text>
              <Text style={styles.tcL}>
                {"\u2022"} By participating in this research, you understand and 
                agree that Carnegie Mellon may be required to disclose your 
                consent form, data and other personally identifiable information 
                as required by law, regulation, subpoena or court order. 
                Otherwise, your confidentiality will be maintained in the 
                following manner: your data and consent form will be kept 
                separate. Your consent form and reflection notebook will be 
                stored in a secure location on Carnegie Mellon property and will 
                not be disclosed to third parties. Our Facebook collaborators 
                will only have access to de-identified data. By participating, 
                you understand and agree that the data and information gathered 
                during this study may be used by Carnegie Mellon and published 
                and/or disclosed by Carnegie Mellon to others outside of 
                Carnegie Mellon.  However, your name, address, contact 
                information and other direct personal identifiers will not be 
                mentioned in any such publication or dissemination of the 
                research data and/or results by Carnegie Mellon. Note that per 
                regulation all research data must be kept for a minimum of 3 
                years. 
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} All identifiable information will be held on a secure 
                server, and will only be accessible to researchers. Access will 
                be protected with public key encryption. All data transfers will 
                be on encrypted channels. There is a risk of breach of 
                confidentiality. The research team takes every precaution to 
                prevent this from happening by storing data securely. Your 
                reflection notebook will be stored in a locked file cabinet.
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} If you create or join a group on the application, all 
                group members will be able to see the bio (username, profile 
                picture, description of your craft) you created, and any design 
                concepts you have shared (photo and description of your ideas or 
                prototypes).
              </Text>
              <Text style={styles.tcP}>
                Right to Ask Questions and Contact Information
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} If you have any questions about this study, 
                you should feel free to ask them by contacting the Principal 
                Investigator now at  Yasmine Kotturi, Postdoctoral Associate, 
                Human-Computer Interaction Institute 5000 Forbes Avenue 
                Pittsburgh PA 15213 412-268-5476. If you have questions later, 
                desire additional information, or wish to withdraw your 
                participation please contact the Principal Investigator by mail, 
                phone or e-mail in accordance with the contact information 
                listed above.  
              </Text>
              <Text style={styles.tcL}>
                {"\u2022"} If you have questions pertaining to your rights as a 
                research participant; or to report concerns to this study, you 
                should contact the Office of Research integrity and Compliance 
                at Carnegie Mellon University.  Email: 
                irb-review@andrew.cmu.edu . Phone: 412-268-1901 or 412-268-5460.
              </Text>
              <Text style={styles.tcP}>Voluntary Participation </Text>
              <Text style={styles.tcL}>
                {"\u2022"} Your participation in this research is voluntary. 
                You may discontinue participation at any time during the 
                research activity.  You may print a copy of this consent form 
                for your records.
              </Text>

              <CheckBox
                title="I have read this information and am ready to give my consent"
                checked={this.state.clickable}
                onPress={() => {
                  this.makeClickable();
                }}
              />
            </ScrollView>
            <View style={{ justifyContent: "flex-end" }}>
              <CheckBox
                title="I am 18 or older"
                checked={this.state.eighteen}
                textStyle={!this.state.clickable ? { color: "#bdc3c7" } : {}}
                onPress={() => {
                  if (this.state.clickable) {
                    this.setState({ eighteen: !this.state.eighteen });
                  } else {
                    this.notScrolledThrough();
                  }
                }}
              />
              <CheckBox
                title="I have read and understand the information above"
                checked={this.state.understandRisks}
                textStyle={!this.state.clickable ? { color: "#bdc3c7" } : {}}
                style={
                  this.state.clickable
                    ? styles.disabledCheckBox
                    : { color: "blue" }
                }
                onPress={() => {
                  if (this.state.clickable) {
                    this.setState({
                      understandRisks: !this.state.understandRisks
                    });
                  } else {
                    this.notScrolledThrough();
                  }
                }}
              />
              <CheckBox
                title="I want to participate in this research and continue with the application"
                checked={this.state.wishToContinue}
                textStyle={!this.state.clickable ? { color: "#bdc3c7" } : {}}
                onPress={() => {
                  if (this.state.clickable) {
                    this.setState({
                      wishToContinue: !this.state.wishToContinue
                    });
                  } else {
                    this.notScrolledThrough();
                  }
                }}
              />

              <TouchableHighlight
                style={styles.button}
                onPress={async () => {
                  //await this.onCreate();
                  var allChecked =
                    this.state.eighteen &&
                    this.state.understandRisks &&
                    this.state.wishToContinue &&
                    this.state.clickable;

                  if (!allChecked) {
                    //this.props.navigation.navigate("Home");
                    Alert.alert(
                      "You cannot use Peerdea (this app) if you do not consent to the research study terms.",
                      "",
                      [
                        {
                          text: "OK"
                        }
                      ]
                    );
                  } else {
                    //this.setState({modalVisible: false});
                    this.onCreate();
                  }
                }}
              >
                <Text style={styles.buttonLabel}>Submit</Text>
              </TouchableHighlight>

              <TouchableHighlight
                style={styles.button}
                onPress={() => {
                  this.setState({ modalVisible: false });
                  //this.props.navigation.navigate("Home");
                }}
              >
                <Text style={styles.buttonLabel}>Close</Text>
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
        </Modal>
        {this.state.loading &&
            <View style={styles.loading}>
              <ActivityIndicator animating={true} size='large' 
              style={{ transform: [{ scaleX: 3 }, { scaleY: 3 }] }}
              color="#0076ff"
              />
            </View>
          }
      </View>
    );
  }
}
