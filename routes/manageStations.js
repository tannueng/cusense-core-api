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
  "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province,country FROM station WHERE publish = 1";


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
    var availFieldDump = "";
    var availInput = [];
  
    // Add all the fields in the request to the INSERT query
    for (var fff in field) {
      if (field[fff]) {
        availField += fff + ",";
        availFieldDump += "?,";
        availInput.push(field[fff]);
      }
    }
  
    // console.log(availField.replace(/,\s*$/, ""));
    // console.log(availFieldDump.replace(/,\s*$/, ""));
    // console.log(availInput);
  
    connection.execute(
      "INSERT INTO station (" +
        availField.replace(/,\s*$/, "") +
        ") VALUES (" +
        availFieldDump.replace(/,\s*$/, "") +
        ")",
      availInput,
      function(err, results, fields) {
        console.log(results); // results contains rows returned by server
        console.log(fields); // fields contains extra meta data about results, if available
        res.json(results);
  
        // If you execute same statement again, it will be picked from a LRU cache
        // which will save query preparation time and give better performance
      }
    );
  });

module.exports = router;
