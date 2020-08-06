const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let quote = new Schema(
  {
    name: {
      type: String
    }
  }
);

module.exports = mongoose.model("Quote", quote);