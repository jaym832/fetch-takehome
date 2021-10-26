const mongoose = require("mongoose");

let payerPoint = new mongoose.Schema({
  payer: {
    type: String,
    requried: true,
  },
  points: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("payerPoint", payerPoint);
