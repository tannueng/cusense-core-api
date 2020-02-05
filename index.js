const express = require("express");
// const https = require("https");
// const fs = require("fs");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors')

// const port = 3333;

//Import Routes
const stationRoute = require("./routes/stations");
const manageStationsRoute = require("./routes/manageStations");
const queryRoute = require("./routes/query");
const authRoute = require("./routes/auth");
const tempRoute = require("./routes/temp");

//HTTPS
// var key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
// var cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
// var options = {
//   key: key,
//   cert: cert
// };

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
app.use("/api/v1/manageStations", manageStationsRoute);
app.use("/api/v1/sensorData", cors(), queryRoute);
app.use("/api/v1/users", authRoute);

app.use("/api/", tempRoute);

localhost: 3333;
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});

//HTTPS Server
// var server = https.createServer(options, app);

// server.listen(port, () => {
//   console.log("server starting on port : " + port);
// });
