const router = require("express").Router();
const Influx = require("influx");
const verify = require("./verifyToken");
const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config();

const influx = new Influx.InfluxDB({
  //Should put in .env
  host: "localhost",
  database: process.env.INFLUX_DB,
  // username: "username",
  // password: "password",
  port: 8086
});

const con = mysql.createConnection({
  host: "localhost",
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB
});

con.connect(err => {
  if (err) {
    console.log("Error connecting to mysql.");
    return;
  }
  console.log("Connection to mysql established");
});

router.get("/last-day", (req, res) => {
  influx
    .query("select mean(*) from ss2 where time > now() - 24h group by sensorid")
    .then(results => {
      res.json(results);
    })
    .catch(console.error);
});

router.get("/station", (req, res) => {
  con.query("SELECT * FROM station WHERE publish = 1", (err, rows) => {
    if (err) throw err;

    console.log("Station data received from SQL");
    // rows[0].stationid

    res.json(rows);
  });
});

router.get("/active", (req, res) => {
  con.query("SELECT * FROM station WHERE publish = 1", (err, rows) => {
    if (err) throw err;
    let final_result = {};
    console.log("Station data received from SQL");
    // rows[0].stationid
    influx
      .query("select mean(*) from ss2 group by sensorid")
      .then(results => {
        console.log(results);
        console.log("before loop");
        for (i = 0; i < rows.length; i++) {
          // console.log("rows[i].stationid", rows[i].stationid);
          for (j = 0; j < results.length; j++) {
            // console.log("results[j].sensorid", results[j].sensorid);
            if (rows[i].stationid == results[j].sensorid) {
              console.log("in loop matches");
              // rows[i].info = results[j];
              final_result += rows[i];
              console.log("final_result", final_result);
            }
          }
        }
        res.json(final_result);
      })
      .catch(console.error);
  });
});

module.exports = router;
