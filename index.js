const express = require("express");
// const https = require("https");
// const fs = require("fs");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// const port = 3333;

//Import Routes
const stationRoute = require("./routes/stations");
const manageStationsRoute = require("./routes/manageStations");
const queryRoute = require("./routes/query");
// const authRoute = require("./routes/auth");
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
const config = {
  origin: [
    "http://localhost:3000",
    "http://161.200.80.206:8082",
    "https://cusense.net",
    "http://161.200.80.206:8092",
  ],
  maxAge: 3600,
};

//Middleware
app.use(express.json());
// app.use(cors(config));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => {
  console.log("Responding to root route");
  res.send("CONNECTED TO API SERVER");
});

app.get("/heartbeat", (req, res) => {
  res.send("The core API service is running.");
});

app.use("/api", (req, res, next) => {
  res.header(
    "We-are-moving!",
    "This API service will be terminated on 12 APR 2020. We are moving to the new URL. Check out https://cusense.net/portal/#!/apis/7663e426-e4e5-4cee-a3e4-26e4e57cee4c/pages/9d46f643-4652-44eb-86f6-434652b4ebb0 for the new API documentation. The new baseURL is https://www.cusense.net:8082 use alongside with the new your own API Key."
  );
  next();
});

//Route Middleware
app.use("/api/v1/stationInfo", stationRoute);
app.use("/api/v1/manageStations", manageStationsRoute);
app.use("/api/v1/sensorData", cors(config), queryRoute);
// app.use("/api/v1/users", authRoute);
app.use("/api/", tempRoute);

//New Route Middleware
app.use("/v1/stationInfo", stationRoute);
app.use("/v1/manageStations", manageStationsRoute);
app.use("/v1/sensorData", cors(config), queryRoute);

localhost: 3333;
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});

//HTTPS Server
// var server = https.createServer(options, app);

// server.listen(port, () => {
//   console.log("server starting on port : " + port);
// });
