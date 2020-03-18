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

const connection = mysql.createConnection({
  host: "localhost",
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB
});

defaultSQLquery =
  "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province,country FROM station WHERE publish = 1";

router.get("/all", (req, res) => {
  pool.query(defaultSQLquery, function(err, rows, fields) {
    // Connection is automatically released when query resolves
    let final_result = {};
    for (i = 0; i < rows.length; i++) {
      final_result[rows[i].id] = rows[i];
    }
    res.json(final_result);
  });
});

router.post("/byProject", (req, res) => {
  const project = req.body.project;

  pool.query(defaultSQLquery + " AND project IN ('" + project + "')", function(
    err,
    rows,
    fields
  ) {
    // Connection is automatically released when query resolves
    if (rows.length == 0) {
      res.status(404).send("Invalid project name.");
    } else {
      let final_result = {};
      for (i = 0; i < rows.length; i++) {
        final_result[rows[i].id] = rows[i];
      }
      res.json(final_result);
    }
  });
});

router.get("/active", (req, res) => {
  pool.query(defaultSQLquery, function(err, rows, fields) {
    // Connection is automatically released when query resolves
    influx
      .query(
        "select last(*) from airdata where time > now() - 70m group by topic"
      )
      .then(results => {
        let final_result = {};
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
              final_result[rows[i].id] = rows[i];
            }
          }
        }
        res.json(final_result);
      })
      .catch(console.error);
  });
});

router.post("/add", (req, res) => {
  const stationid = req.body.sensorid;
  const id = req.body.id;
  const topic = req.body.sensorid;
  const isoutdoor = req.body.isoutdoor;
  const lat = req.body.lat;
  const lon = req.body.lon;
  const country = req.body.country;

  const project = req.body.project;
  const name = req.body.name;
  const abstract = req.body.abstract;
  const sta_addr = req.body.sta_addr;
  const tambol = req.body.tambol;
  const amphoe = req.body.amphoe;
  const province = req.body.province;

  const remark = req.body.remark;

  const org = req.body.org;
  const org_per = req.body.org_per;
  const org_email = req.body.org_email;
  const org_tel = req.body.org_tel;
  const org_addr = req.body.org_addr;

  if (!stationid || !id || !topic || !isoutdoor || !lat || !lon || !country)
    res.status(400).json("Some field is missing");
  // pool.query("INSERT INTO `station`(`stationid`, `id`, `topic`, `project`, `name`, `abstract`, `lat`, `lon`, `sta_addr`, `tambol`, `amphoe`, `province`, `country`, `remark`, `org`, `org_per`, `org_email`, `org_tel`, `org_addr`, `publish`, `date_create`, `date_update`) VALUES ([value-1],[value-2],[value-3],[value-4],[value-5],[value-6],[value-7],[value-8],[value-9],[value-10],[value-11],[value-12],[value-13],[value-14],[value-15],[value-16],[value-17],[value-18],[value-19],[value-20],[value-21],[value-22])", function(err, rows, fields) {
  // pool.query(
  //   "INSERT INTO station (`stationid`, `id`,`topic`,`isoutdoor`,`lat`,`lon`,`country`) VALUES ('test/testid','testid','test','1','10','14','thailand');",
  //   function(err, rows, fields) {
  //     // Connection is automatically released when query resolves
  //     res.json(rows);
  //   }
  // );
  // connection.execute(
  //     "INSERT INTO station (stationid, id, topic,isoutdoor, lat, lon, country,project, name, abstract, sta_addr, tambol,  amphoe, province, remark, org, org_per, org_email, org_tel, org_addr ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  //     [
  //       stationid,
  //       id,
  //       topic,
  //       isoutdoor,
  //       lat,
  //       lon,
  //       country,
  //       project,
  //       name,
  //       abstract,
  //       sta_addr,
  //       tambol,
  //       amphoe,
  //       province,
  //       remark,
  //       org,
  //       org_per,
  //       org_email,
  //       org_tel,
  //       org_addr
  //     ],
  //     function(err, results, fields) {
  //       console.log(results); // results contains rows returned by server
  //       console.log(fields); // fields contains extra meta data about results, if available
  //       res.json("Sucessfully Added");

  //       // If you execute same statement again, it will be picked from a LRU cache
  //       // which will save query preparation time and give better performance
  //     }
  //   );
  const field = {
    stationid: stationid,
    id: id,
    topic: topic,
    isoutdoor: isoutdoor,
    lat: lat,
    lon: lon,
    country: country,
    project: project,
    name: name,
    abstract: abstract,
    sta_addr: sta_addr,
    tambol: tambol,
    amphoe: amphoe,
    province: province,

    remark: remark,

    org: org,
    org_per: org_per,
    org_email: org_email,
    org_tel: org_tel,
    org_addr: org_addr
  };

  var availField = "";
  var availInput = [];

  for (var fff in field) {
    if (field[fff]) {
      availField += fff + ",";
      availInput.push(field[fff]);
    }
  }
  // console.log(availField.replace(/,\s*$/, ""));
  // console.log(availInput);

  connection.execute(
    "INSERT INTO station (",
    availField,
    ") VALUES (",
    field,
    ")",
    availInput,
    function(err, results, fields) {
      console.log(results); // results contains rows returned by server
      console.log(fields); // fields contains extra meta data about results, if available
      res.json("Sucessfully Added");

      // If you execute same statement again, it will be picked from a LRU cache
      // which will save query preparation time and give better performance
    }
  );

  // connection.execute(
  //   "INSERT INTO station (stationid, id, topic,isoutdoor, lat, lon, country,project, name, abstract, sta_addr, tambol,  amphoe, province, remark, org, org_per, org_email, org_tel, org_addr ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  //   [
  //     stationid,
  //     id,
  //     topic,
  //     isoutdoor,
  //     lat,
  //     lon,
  //     country,
  //     project,
  //     name,
  //     abstract,
  //     sta_addr,
  //     tambol,
  //     amphoe,
  //     province,
  //     remark,
  //     org,
  //     org_per,
  //     org_email,
  //     org_tel,
  //     org_addr
  //   ],
  //   function(err, results, fields) {
  //     console.log(results); // results contains rows returned by server
  //     console.log(fields); // fields contains extra meta data about results, if available
  //     res.json("Sucessfully Added");

  //     // If you execute same statement again, it will be picked from a LRU cache
  //     // which will save query preparation time and give better performance
  //   }
  // );
});

module.exports = router;
