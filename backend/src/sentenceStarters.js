const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SentenceStartersSchema = new Schema(
  {
    sentences: {
      type: [String]
    }
  }
);

module.exports = mongoose.model('SentenceStarters', SentenceStartersSchema, 'sentenceStarters');
