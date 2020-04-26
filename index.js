const express = require("express");
// const https = require("https");
const fs = require("fs");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
var path = require("path");

// const port = 3333;

//Import Routes
const stationRoute = require("./routes/stations");
const manageStationsRoute = require("./routes/manageStations");
const queryRoute = require("./routes/query");
// const tempRoute = require("./routes/temp");

//HTTPS
// var key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
// var cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
// var options = {
//   key: key,
//   cert: cert
// };

dotenv.config();

if (process.env.ENVVAR_AVAIL != "true") {
  console.log(
    "Environment Variable is not found!\nMay have trouble connecting with mySQL and InfluxDB."
  );
  console.log("");
  console.log("*************************");
  console.log("       TERMINATING       ");
  console.log("*************************");
  process.exit(1);
}

accessLogStream = fs.createWriteStream(path.join(__dirname, "old_access.log"), {
  flags: "a",
});

//Middleware
app.use(express.json());

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

app.use(
  "/api/getpttdata",
  morgan("combined", { stream: accessLogStream }),
  (req, res, next) => {
    morgan(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'
    );
    res.header(
      "We-moved!",
      "This API service terminated on 25 APR 2020. We moved to the new URL. Checkout https://cusense.net/portal/#!/apis/7663e426-e4e5-4cee-a3e4-26e4e57cee4c/pages/9d46f643-4652-44eb-86f6-434652b4ebb0 for the new API documentation. The new baseURL is https://www.cusense.net:8082 use alongside with the new your own API Key."
    );

    res.status(404).sendFile(path.join(__dirname, "/html/api-ptt-moved.html"));
  }
);

app.use(
  "/api",
  morgan("combined", { stream: accessLogStream }),
  (req, res, next) => {
    morgan(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'
    );
    res.header(
      "We-moved!",
      "This API service terminated on 25 APR 2020. We moved to the new URL. Checkout https://cusense.net/portal/#!/apis/7663e426-e4e5-4cee-a3e4-26e4e57cee4c/pages/9d46f643-4652-44eb-86f6-434652b4ebb0 for the new API documentation. The new baseURL is https://www.cusense.net:8082 use alongside with the new your own API Key."
    );

    res.status(404).sendFile(path.join(__dirname, "/html/api-moved.html"));
  }
);

//Original Route Middleware
// app.use("/api/v1/stationInfo", stationRoute);
// app.use("/api/v1/manageStations", manageStationsRoute);
// app.use("/api/v1/sensorData", cors(config), queryRoute);
// app.use("/api/v1/users", authRoute);
// app.use("/api/", tempRoute);

//New Route Middleware
app.use("/v1/stationInfo", stationRoute);
app.use("/v1/manageStations", manageStationsRoute);
app.use("/v1/sensorData", queryRoute);

localhost: 3333;
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});

//HTTPS Server
// var server = https.createServer(options, app);

// server.listen(port, () => {
//   console.log("server starting on port : " + port);
// });
