const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
//importing payerPoints
let payerPoints = require("./payerPoints.js");

calculateRemainingPoints = function (arr, spentPoints) {
  //is going to store all the payers taken from
  let payersTakenFrom = [];
  //is going to store the difference in all the payers taken from
  let payersDiffArr = [];

  //itertating through arr
  for (let i = 0; i < arr.length; i++) {
    //if payer points is less than or ==0 then just console.log
    if (arr[i].points <= 0) {
      console.log("payer points less then or == 0");
    } else {
      //if payer points is less than or equal to rewards spent
      if (arr[i].points <= spentPoints) {
        let pointDiff = arr[i].points;

        spentPoints -= arr[i].points;

        arr[i].points = 0;

        payersTakenFrom.push(arr[i]);

        payersDiffArr.push({
          payer: arr[i].payer,
          points: -pointDiff,
        });
      }

      //if payer points is more than points spent
      if (arr[i].points > spentPoints) {
        let pointDiff = spentPoints;

        arr[i].points -= spentPoints;

        spentPoints = 0;

        payersTakenFrom.push(arr[i]);

        payersDiffArr.push({
          payer: arr[i].payer,
          points: -pointDiff,
        });
      }

      //if point spent is 0, break from interation
      if (spentPoints == 0) {
        break;
      }
    }
  }

  // second interation is going to iterate through array that stored payers where points were taken from and update mongoDB database
  for (let i = 0; i < payersTakenFrom.length; i++) {
    payerPoints.findByIdAndUpdate(
      payersTakenFrom[i]._id,
      {
        points: payersTakenFrom[i].points,
      },
      (error, data) => {
        if (error) {
          return next(error);
        } else {
          console.log("payerPoint successfully updated!", data);
        }
      }
    );
  }

  //returns the array that contains the amount that was taken from each payer
  return payersDiffArr;
};

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database connection Success!");
  })
  .catch((err) => {
    console.error("Mongo Connection Error", err);
  });

app.use(express.json());
app.use(morgan("dev"));

//posting to the payer points
app.post("/points", (req, res, next) => {
  payerPoints.create(req.body, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

//removing payer points and then updating database
app.put("/points", (req, res, next) => {
  let points = req.body.points;
  payerPoints
    .find({})
    .sort({ timestamp: 1 })
    .exec((err, data) => {
      if (err) {
        return err;
      } else {
        let payerDifference = calculateRemainingPoints(data, points);
        res.json(payerDifference);
      }
    });
});
//get all payer points
app.get("/points", (req, res, next) => {
  payerPoints.find((error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});
