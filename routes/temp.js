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

function chkDigitPid(p_iPID) {
  var total = 0;
  var iPID;
  var chk;
  var Validchk;
  iPID = p_iPID.replace(/-/g, "");
  Validchk = iPID.substr(12, 1);
  var j = 0;
  var pidcut;
  for (var n = 0; n < 12; n++) {
    pidcut = parseInt(iPID.substr(j, 1));
    total = total + pidcut * (13 - n);
    j++;
  }

  chk = 11 - (total % 11);

  if (chk == 10) {
    chk = 0;
  } else if (chk == 11) {
    chk = 1;
  }
  if (chk == Validchk) {
    // alert("ระบุหมายเลขประจำตัวประชาชนถูกต้อง");
    return true;
  } else {
    // alert("ระบุหมายเลขประจำตัวประชาชนไม่ถูกต้อง");
    return false;
  }
}

router.get("/covid/check/:id", function (req, res) {
  let id = req.params.id;

  let final_result = {};
  let results = [];
  let foundcovid = false;
  let validID = true;

  console.log("INPUT ID: " + id);

  if (chkDigitPid(id)) {
    validID = true;
    // console.log("Valid ID");

    fs.createReadStream("/home/api/files/traveller_list_06u.csv")
      .pipe(
        csv([
          "no",
          "initial",
          "name",
          "surname",
          "id",
          "phone",
          "work_id",
          "work_moo",
          "work_tambol",
          "work_amphoe",
          "home_id",
          "home_moo",
          "home_tambol",
          "home_amphoe",
          "home_province",
          "vehicle",
          "veh_id",
        ])
      )
      .on("data", (data) => results.push(data))
      .on("end", () => {
        for (j = 0; j < results.length; j++) {
          if (results[j].id == id) {
            // ***** Valid ID and IN Database *****
            foundcovid = true;
            final_result.status = "เป็นผู้เดินทางจาก จ.ภูเก็ต";
            final_result.info = results[j];
            console.log("ID Matches: ", final_result);
            res.status(222).json(final_result);
            break;
          }
        }

        // ***** Valid ID but Not in Database *****
        if (foundcovid == false && validID) {
          console.log("ID Not Found");
          res.status(200).json({
            status: "ไม่อยู่ในกลุ่มเสี่ยงที่เดินทางจาก จ.ภูเก็ต",
            หมายเลขบัตรประชาชน: id,
          });
        }
      });
  } else {
    //***** Invalid ID Input *****
    validID = false;
    res
      .status(400)
      .json({ status: "หมายเลขบัตรประชาชนไม่ถูกต้อง", หมายเลขบัตรประชาชน: id });
  }
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
