const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    users: {
      type: [String]
    },
    groupOwner: {
      type: String,
    }
  }
);

module.exports = mongoose.model('Group', GroupSchema, 'groups');
