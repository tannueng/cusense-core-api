const router = require("express").Router();
const Influx = require("influx");
const verify = require("./verifyToken");
const {
  directQueryValidation,
  dateValidation,
  monthValidation
} = require("../validation");
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

router.get("/getpttdata", (req, res) => {
  matchQuery(
    byStationSQLQuery("PTT/ptt.mainoffice"),
    "select mean(pm25) as pm25, mean(temp) as temp, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 1h and \"topic\" = 'PTT/ptt.mainoffice'",
    res
  );
});

function matchQuery(mysqlQuery, influxQuery, res) {
  pool.query(mysqlQuery, function(err, rows, fields) {
    influx
      .query(influxQuery)
      .then(results => {
        let final_result = {};
        let firstTime = true;
        console.log(rows);
        console.log(results);

        if (results == "") {
          res.send("No data for PTT/ptt.mainoffice for the last 1 hour.");
        }

        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == "PTT/ptt.mainoffice") {
              if (firstTime) {
                final_result[rows[i].id] = {};
                final_result[rows[i].id].data = [];
              }
              final_result[rows[i].id].data.push(results[j]);
              final_result[rows[i].id].info = rows[i];
              firstTime = false;
            }
          }
          firstTime = true;
        }

        res.json(final_result);
      })
      .catch(console.error);
  });
}

function byStationSQLQuery(topic) {
  return (
    "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province FROM station WHERE publish = 1 AND topic = '" +
    topic +
    "'"
  );
}

module.exports = router;
