const router = require("express").Router();
const Influx = require("influx");
const verify = require("./verifyToken");

const influx = new Influx.InfluxDB({
  //Should put in .env
  host: "localhost",
  database: "testdb",
  // username: "username",
  // password: "password",
  port: 8086
});

router.get("/all", verify, (req, res) => {
  influx
    .query("select * from cpu")
    .then(results => {
      res.json(results);
    })
    .catch(console.error);
});

module.exports = router;
