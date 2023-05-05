/*
  to get personal VM working:
  1. add VM IP to whitelist on mongoDb
  2. make sure your vm is the active running one with > eval "$(docker-machine env peerdea)"
  3. be in the root project directory (peerdea) and run:
      > docker-compose build
      > docker-compose up -d --remove-orphans
  4. need to repeat steps (2-3) any time the code base is changed so the
  docker VM is up to date

  If you run out of memory on your VM (IP address can't connect even if your
machine is up and running):
    > docker system prune
*/

require('dotenv').config();

// const { ApolloServer } = require('apollo-server-express');
const mongoose = require("mongoose");
const express = require("express");
// const expressPlayground = require('graphql-playground-middleware-express').default
var cors = require("cors");
// const bodyParser = require("body-parser");
const graphqlHTTP = require("express-graphql"); //to integrate graphQL
const logger = require("morgan");

//all the models we need to have
const Group = require("./src/group");
const Concept = require("./src/concept");
var Buffer = require("buffer").Buffer;
// const User = require("./src/user");

//graphQL schema
const schema = require("./schema/schema");
var AWS = require("aws-sdk");

const API_PORT = 80; //change for local testing
// const API_PORT = 8000; 

const app = express();
app.use(cors());
const router = express.Router();

// this is our MongoDB database
const dbRoute = process.env.DB_ROUTE;

// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true });

//this represents our connection to the database
let db = mongoose.connection;

//if the connection (db) is successful, let the user know
db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is invalid
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(logger("dev"));

// this is our get method
// this method fetches all available data in our database

router.get("/getGroup", (req, res) => {
  Group.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.get("/getGroupByName", (req, res) => {
  var name = req.query.name;
  Group.find({ name: name }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/updateGroup", (req, res) => {
  const { id, update } = req.body;
  Group.findOneAndUpdate({ _id: id }, update, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete("/deleteGroup", (req, res) => {
  const { id } = req.body;
  Group.findOneAndDelete({ id: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create methid
// this method adds new data in our database
router.post("/putGroup", (req, res) => {
  console.log("put body " + req.body);
  let group = new Group(req.body);
  group.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our get method
// this method fetches all available data in our database

router.get("/getConcepts", (req, res) => {
  Concept.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.get("/getConceptsByGroup", (req, res) => {
  var groupID = req.body.groupID;
  Concept.find({ group_id: groupID }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

//for testing yes and yesand backend
router.get("/getConceptByID", (req, res) => {
  var id = req.body.id;
  Concept.find({ id: id }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/updateConcept", (req, res) => {
  const { id, update } = req.body;
  Concept.findOneAndUpdate({ id: id }, update, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this method increments the number of yeses on a concept by one
// mongoDB creates write locks automatically, each transaction is atomic
router.post("/yes", (req, res) => {
  const id = req.body._id;
  console.log("id ", id);
  Concept.findOneAndUpdate({ _id: id }, { $inc: { yes: 1 } }, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json(id);
  });
});

// this method increments the number of yeses by one and also
// pushes the comment onto the end of the list of comments
//it seemed to overide the first push if I did in one command
router.post("/yesand", (req, res) => {
  const id = req.body._id;
  const text1 = req.body.text1;
  const text2 = req.body.text2;
  Concept.findOneAndUpdate(
    { _id: id },
    { $inc: { yes: 1 }, $push: { yesand: { $each: [text1, text2] } } },
    (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json(id);
    }
  );
});

// this method increments the number of yeses by one and also
// pushes the open-ended comment onto the end of the list of comments
router.post("/yesandunstructured", (req, res) => {
  const id = req.body._id;
  const text = req.body.text;
  Concept.findOneAndUpdate(
    { _id: id },
    { $inc: { yes: 1 }, $push: { yesand: text } },
    err => {
      if (err) return res.json({ success: false, error: err });
      return res.json(id);
    }
  );
});

router.post("/submitvote", (req, res) => {
  const id = req.body._id;
  const voter = String(req.body.voter);
  const vote = req.body.vote;
  Concept.findOne({_id: id}, function(err, concept) {
    if (err) return res.json({ success: false, error: err });
    var tempvoter_list = concept.voter_list;
    var temppoll_votes = concept.poll_votes;
    var sumvotes = temppoll_votes.map(function (num, idx) {
      return num + vote[idx];
    });
    if(tempvoter_list.includes(voter)){
      return res.json({ success: false, error: "already voted" });
    }
    else{
      Concept.findOneAndUpdate(
        { _id: id },
        { $set: { poll_votes: sumvotes }, $push: { voter_list: voter } },
        err => {
          if (err) return res.json({ success: false, error: err });
          return res.json(id);
        }
      );
    }
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete("/deleteConcept", (req, res) => {
  const { id } = req.body;
  console.log(req.body);
  Concept.findOneAndDelete({ id: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create methid
// this method adds new data in our database

router.post("/putConcept", (req, res) => {
  let concept = new Concept(req.body);
  concept.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

//gets url of existing image in s3
router.get("/s3Url", (req, res) => {
  var s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEYID,
    secretAccessKey: process.env.S3_ACCESS_KEY,
    region: "us-east-2",
  });
  console.log("query", req.query);
  const url = s3.getSignedUrl("getObject", {
    Bucket: "peerdea/images",
    Key: req.query.imageName,
    Expires: 900,
  });
  return res.json({ success: true, data: url });
});

//uploads given image to s3
router.post("/s3Upload", async (req, res) => {
  var s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEYID,
    secretAccessKey: process.env.S3_ACCESS_KEY,
    region: "us-east-2",
  });
  var params = req.body;
  params.Body = Buffer.from(JSON.parse(params.Body));
  await s3.upload(params, async (err, data) => {
    if (err) {
      console.log("error", err);
      throw err;
    }
    return res.json({ success: true, data: data });
  });
});

router.get("/status", (req, res) => {
  console.log("req", req);
  //up or down to indicate peerdea maintenance status. "down" means under maintenance
  return res.json({ success: true, status: "up" });
});

// append /api for our http requests
app.use("/api", router);

//pass in access token to graphql end point
app.use(
  "/graphql",
  graphqlHTTP({
    //directing express-graphql to use this schema to map out the graph
    schema,
    //directing express-graphql to use graphiql when adding '/graphql' to address in the browser
    //which provides an interface to make GraphQl queries
    graphiql: true,
  })
);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
