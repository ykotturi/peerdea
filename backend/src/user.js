/* global Buffer */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    hasConsented: {
      type: Boolean,
      required: true
    },
    condition: {
      type: String,
      required: true
    },
    groups: {
      type: [String]
    },
    concepts: {
      type: [String] //a list of concept id's of all concepts they've shared
    },
    bio: {
      type: String
    },
    email: {
      type: String
    },
    goal: {
      type: [String]
    },
    goalDates: {
      type: [String]
    },
    profilePic: {
      type: [
      {data: Buffer,
      contentType: String}]
    },
    pushTokens: {
     type: [String] //for push notifications
   }
  }
);

module.exports = mongoose.model('User', UserSchema, 'users');
