const router = require("express").Router();
const Influx = require("influx");
const verify = require("./verifyToken");
const mysql = require("mysql2");
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

const pool = mysql.createPool({
  host: "localhost",
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
  pool.query("SELECT * FROM station WHERE publish = 1", function(
    err,
    rows,
    fields
  ) {
    // Connection is automatically released when query resolves
    res.json(rows);
  });
});

router.get("/active", (req, res) => {
  pool.query("SELECT * FROM station WHERE publish = 1", function(
    err,
    rows,
    fields
  ) {
    // Connection is automatically released when query resolves
    console.log("Station data received from SQL");
    influx
      .query("select mean(*) from ss2 group by sensorid")
      .then(results => {
        console.log(results);
        console.log("before loop");
        let final_result = {}
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].stationid == results[j].sensorid) {
              console.log("in loop matches");
              // rows[i].info = results[j];
              final_result[rows[i].stationid] = rows[i];
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
