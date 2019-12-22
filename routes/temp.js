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
    "select mean(pm25) as pm25, mean(temp) as temp, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 2d and \"topic\" = 'PTT/ptt.mainoffice'",
    res
  );
});

// router.post("/byStation/:timeframe/:date", (req, res) => {
//   const timeframe = req.params.timeframe;
//   const date = req.params.date;
//   const topic = req.body.topic;

//   console.log(timeframe, date, topic);

//   if (timeframe == "monthly") {
//     const { error } = monthValidation(date);
//     if (error) return res.status(400).send(error.details[0].message);

//     matchQuery(
//       defaultSQLquery,
//       "select mean(*) from airdata where time >= '" +
//         date +
//         "-01' and time <= '" +
//         date +
//         "-01' + 30d and  \"topic\" = '" +
//         topic +
//         "' group by time(1d)",
//       res
//     );
//   } else if (timeframe == "daily") {
//     const { error } = dateValidation(date);
//     if (error) return res.status(400).send(error.details[0].message);

//     pool.query(byStationSQLQuery(topic), function(err, rows, fields) {
//       influx
//         .query(
//           "select mean(*) from airdata where time >= '2019-12-21' - 7h and time <= '2019-12-21' + 1d - 7h and \"topic\" = 'nansensor/CU-S0040' group by time(1h)"
//         )
//         .then(results => {
//           let final_result = {};
//           let firstTime = true;
//           // console.log(results);
//           for (i = 0; i < rows.length; i++) {
//             for (j = 0; j < results.length; j++) {
//               if (rows[i].topic == topic) {
//                 if (firstTime) {
//                   final_result[rows[i].id] = {};
//                   final_result[rows[i].id].data = [];
//                 }
//                 final_result[rows[i].id].data.push(results[j]);
//                 final_result[rows[i].id].info = rows[i];
//                 firstTime = false;
//               }
//             }
//             firstTime = true;
//           }
//           // console.log(final_result);
//           res.json(final_result);
//         })
//         .catch(console.error);
//     });

//     // matchQuery(
//     //   defaultSQLquery,
//     //   "select mean(*) from airdata where time >= '2019-12-21' and time <= '2019-12-21' + 1d and \"topic\" = 'nansensor/CU-S0040' group by time(1h)",

//     //   // "select mean(*) from airdata where time >= '" +
//     //   //   date +
//     //   //   "' and time <= '" +
//     //   //   date +
//     //   //   "' + 1d and  \"topic\" = '" +
//     //   //   topic +
//     //   //   "' group by time(1h)"
//     //   res
//     // );
//   } else {
//     res.status(400).send("Invalid URL Parameter.");
//   }
// });

function matchQuery(mysqlQuery, influxQuery, res) {
  pool.query(mysqlQuery, function(err, rows, fields) {
    influx
      .query(influxQuery)
      .then(results => {
        let final_result = {};
        let firstTime = true;
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

module.exports = router;
