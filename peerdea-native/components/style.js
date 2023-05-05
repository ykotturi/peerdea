import { StyleSheet, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 30,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedText: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 20,
    textAlign: "center",
  },
  contentContainer: {
    paddingTop: 20,
    backgroundColor: "#fff",
  },
  buttonMedium: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    height: 50,
    borderWidth: 1,
    borderRadius: 9,
    width: "55%",
    elevation: 3,
  },
  buttonSmall: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    height: 50,
    borderWidth: 1,
    borderRadius: 9,
    width: "47%",
    elevation: 3,
  },
  hintText: {
    height: 40,
    width: "100%",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
    paddingHorizontal: 3,
  },
  hintTextMedium: {
    height: 40,
    width: "80%",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
    paddingHorizontal: 3,
  },
  buttonSmallLeft: {
    justifyContent: "center",
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    height: 50,
    borderWidth: 1,
    borderRadius: 9,
    width: "45%",
    elevation: 3,
  },
  buttonLargeLeft: {
    justifyContent: "center",
    borderColor: "#0076ff",
    backgroundColor: "#0076ff",
    height: 50,
    borderWidth: 1,
    borderRadius: 9,
    width: "90%",
    elevation: 3,
  },
  buttonText: {
    paddingHorizontal: "8%",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
    color: "#ffffff",
  },
  noneYetText: {
    margin: 10,
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 30,
    textAlign: "center",
  },
  noneYetHeader: {
    margin: 10,
    fontSize: 25,
    color: "rgba(96,100,109, 1)",
    lineHeight: 40,
    textAlign: "center",
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  // slideContainer: {
  //   flex: 1,
  //   alignItems: "center",
  //   justifyContent: "center"
  // },
  noConceptsHeader: {
    fontSize: width * 0.05,
    paddingVertical: 5,
  },
  title: {
    marginTop: 30,
    fontSize: 22,
    alignSelf: "center",
  },
  tcP: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
  tcL: {
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
    fontSize: 14,
  },
  tcContainer: {
    flexGrow: 1,
    marginTop: 20,
    marginBottom: 2,
  },
  button: {
    backgroundColor: "#136AC7",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
  },

  buttonDisabled: {
    backgroundColor: "#999",
    borderRadius: 5,
    padding: 10,
  },

  buttonLabel: {
    fontSize: 14,
    color: "#FFF",
    alignSelf: "center",
  },

  consentContainer: {
    height: "96%",
    margin: 10,
  },
  loading: {
    position: 'absolute',
    backgroundColor: 'black',
    opacity: 0.7,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxDisabled: {
    color: "red",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderColor: "black",
    borderWidth: 2,
  },
  modalHeader: {
    fontWeight: "500",
    fontSize: 18
  },
  buttonRow: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    justifyContent: "space-between"
  },
  modalButton: {
    backgroundColor: "#0076ff",
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
  },
  feedbackSectionText: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "#D3D3D3",
    borderTopColor: "#D3D3D3", 
    borderTopWidth: 1,
    padding: 5,
    alignSelf: "stretch",
  }
});