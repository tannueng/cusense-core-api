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

defaultSQLquery =
  "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province FROM station WHERE publish = 1";

router.get("/last-day", (req, res) => {
  influx
    .query(
      "select mean(*) from airdata where time > now() - 24h group by topic"
    )
    .then(results => {
      res.json(results);
    })
    .catch(console.error);
});

router.get("/stations/all", (req, res) => {
  pool.query("SELECT * FROM station WHERE publish = 1", function(
    err,
    rows,
    fields
  ) {
    // Connection is automatically released when query resolves
    res.json(rows);
  });
});

router.post("/direct", (req, res) => {
  pool.query(defaultSQLquery, function(err, rows, fields) {
    influx
      .query(req.body.query)
      .then(results => {
        let final_result = {};
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
              final_result[rows[i].id] = results[j];
              final_result[rows[i].id].info = rows[i];
            }
          }
        }
        res.json(final_result);
      })
      .catch(() => {
        res.status(400).json({ error });
      });
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
      .query("select mean(*) from airdata group by topic")
      .then(results => {
        // console.log(results);
        console.log("before loop");
        let final_result = {};
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
              // console.log(
              //   "in loop matches: " + rows[i].topic + " & " + results[j].topic
              // );
              // rows[i].info = results[j];
              final_result[rows[i].id] = results[j];
              final_result[rows[i].id].info = rows[i];
              // console.log("final_result", final_result);
            }
          }
          // console.log("in loop i=" + i);
        }
        console.log("after loop");
        res.json(final_result);
      })
      .catch(console.error);
  });
});

router.get("/day/:type", (req, res) => {
  const { type } = req.params;
  if (type == "pm") {
    matchQuery(
      defaultSQLquery,
      "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10 from airdata where time > now() - 24h group by topic",
      res
    );
  } else if (type == "all") {
    matchQuery(
      defaultSQLquery,
      "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, last(co2) as co2, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 24h group by topic",
      res
    );
  } else {
    res.status(400).send("Invalid URL Parameter.");
  }
});

router.get("/realtime/all", (req, res) => {
  matchQuery(
    defaultSQLquery,
    "select last(pm1) as pm1, last(pm25) as pm25, last(pm10) as pm10, last(temp) as temp, last(co2) as co2, last(humid) as humid, last(temp) as temp from airdata where time > now() - 70m group by topic",
    res
  );
});

function matchQuery(mysqlQuery, influxQuery, res) {
  pool.query(mysqlQuery, function(err, rows, fields) {
    influx
      .query(influxQuery)
      .then(results => {
        let final_result = {};
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
              final_result[rows[i].id] = results[j];
              final_result[rows[i].id].info = rows[i];
            }
          }
        }
        res.json(final_result);
      })
      .catch(console.error);
  });
}

module.exports = router;
