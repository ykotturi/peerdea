/* global Buffer */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConceptSchema = new Schema (
  {
    group_id: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    concept_type: {
      type: String,
      required: true
    },
    media: {
      type: [
      {data: Buffer,
      contentType: String}]
    },
    description: {
      type: String,
      required: true
    },
    yes: {
      type: Number,
      min: 0
    },
    yesand: {
      type: [String]
    },
    timestamp: {
      type: String
    },
    sentence_starter: {
      type: String
    },
    poll_options: {
      type: [String]
    },
    poll_votes: {
      type: [Number]
    },
    voter_list: {
      type: [String]
    },
    s3:{
      type:[String]
    }
  }
);

module.exports = mongoose.model('Concept', ConceptSchema, 'concepts');
