const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

//ROUTES needed
// add to points (POST)-----
//spend points (PUT)
//return all payer point balances (GET)

let payerPoints = require("./payerPoints.js");

calculateRemainingPoints = function (arr, points) {
  let payersTakenFrom = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].points <= 0) {
      console.log("payer points less then or == 0");
    } else {
      if (arr[i].points <= points) {
        points -= arr[i].points;
        arr[i].points = 0;
        payersTakenFrom.push(arr[i]);
      }
      if (arr[i].points > points) {
        arr[i].points -= points;
        points = 0;
        payersTakenFrom.push(arr[i]);
      }
      if (points <= 0) {
        // console.log(points);
        break;
      }
    }
  }

  return payersTakenFrom;
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

//posting to the rewards
app.post("/points", (req, res, next) => {
  payerPoints.create(req.body, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

//removing my rewards and then updating
app.put("/points", (req, res, next) => {
  let points = req.body.points;
  payerPoints
    .find({})
    .sort({ timestamp: 1 })
    .exec((err, data) => {
      if (err) {
        return err;
      } else {
        let arr = res.json(data);
        let payerChanges = calculateRemainingPoints(data, points);

        for (let i = 0; i < payerChanges.length; i++) {
          payerPoints.findByIdAndUpdate(
            payerChanges[i]._id,
            {
              points: payerChanges[i].points,
            },
            (error, data) => {
              if (error) {
                return next(error);
              } else {
                console.log("payerPoints successfully updated!", data);
              }
            }
          );
        }
      }
    });
});
//get all rewards
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

app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});
