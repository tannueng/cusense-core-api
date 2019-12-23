const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");

//Import Routes
const stationRoute = require("./routes/stations");
const queryRoute = require("./routes/query");
const authRoute = require("./routes/auth");
const tempRoute = require("./routes/temp")

dotenv.config();

// Connect to DB
mongoose.connect(
  process.env.MONGODB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to DB")
);

//Middleware
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Responding to root route");
  res.send("CONNECTED TO API SERVER");
});

//Route Middleware
app.use("/api/v1/stationInfo", stationRoute);
app.use("/api/v1/sensorData", queryRoute);
app.use("/api/v1/users", authRoute);

app.use("/api/", tempRoute);

// localhost:3333
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});
