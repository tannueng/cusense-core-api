const router = require("express").Router();
const Influx = require("influx");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const influx = new Influx.InfluxDB({
  //Should put in .env
  host: "localhost",
  database: process.env.INFLUX_DB,
  // username: "username",
  // password: "password",
  port: 8086,
});

const pool = mysql.createPool({
  host: "localhost",
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//**************COVID************ */
const fs = require("fs");
const csv = require("csv-parser");

router.get("/covid/user/:id", function (req, res) {
  let id = req.params.id;

  let final_result = {};
  let results = [];
  fs.createReadStream("/home/api/files/traveller_list_01.csv")
    .pipe(
      // csv({
      //   headers: false,
      // })

      csv([
        "ลำดับ",
        "คำนำหน้า",
        "ชื่อ",
        "สกุล",
        "id",
        "หมายเลขโทรศัพท์",
        "บ้านเลขที่",
        "หมู่ที่",
        "ตำบล",
        "อำเภอ",
        "บ้านเลขที่",
        "หมู่ที่",
        "ตำบล",
        "อำเภอ",
        "จังหวัด",
      ])
    )
    .on("data", (data) => results.push(data))
    .on("end", () => {
      // console.log(results);
      console.log("INPUT ID: " + id);
      for (j = 0; j < results.length; j++) {
        console.log("looping " + j);
        if (results[j].id == id) {
          console.log("found!! " + j);
          // final_result.push(results[j]);
          console.log(results[j]);
          final_result.result = results[j];
          res.json(final_result);
          break;
        }
      }
      if (!final_result) {
        errors.email = "User not found";
        res.status(404).json({ errors });
        // stop further execution in this callback
        return;
      }
    });

  // console.log(final_result);
});

// *********** COVID *****************
defaultSQLquery =
  "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province FROM station WHERE publish = 1";

router.get("/getpttdata", (req, res) => {
  matchQuery(
    byStationSQLQuery("PTT/ptt.mainoffice"),
    "select mean(pm25) as pm25, mean(temp) as temp, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 1h and \"topic\" = 'PTT/ptt.mainoffice'",
    "PTT/ptt.mainoffice",
    res
  );
});

router.get("/getcudata", (req, res) => {
  matchMultipleQuery(
    byGroupSQLQuery("cusensor2"),
    "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 1h and \"group\" = 'cusensor2' group by topic",
    "cusensor2",
    res
  );
});

function matchQuery(mysqlQuery, influxQuery, distinct, res) {
  pool.query(mysqlQuery, function (err, rows, fields) {
    influx
      .query(influxQuery)
      .then((results) => {
        let final_result = {};
        let firstTime = true;
        // console.log(rows);
        // console.log(results);

        if (results == "") {
          res.send("No data for " + distinct + " for the last 1 hour.");
        }

        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == distinct) {
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

function matchMultipleQuery(mysqlQuery, influxQuery, distinct, res) {
  pool.query(mysqlQuery, function (err, rows, fields) {
    influx
      .query(influxQuery)
      .then((results) => {
        let final_result = {};
        let firstTime = true;
        // console.log(rows);
        // console.log(results);

        if (results == "") {
          res.send("No data for " + distinct + " for the last 1 hour.");
        }

        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
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

function byGroupSQLQuery(project) {
  return (
    "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province FROM station WHERE publish = 1 AND project = '" +
    project +
    "'"
  );
}

module.exports = router;
