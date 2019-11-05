const router = require("express").Router();
const verify = require("./verifyToken");
const Influx = require("influx");

const influx = new Influx.InfluxDB({
  //Should put in .env
  host: "localhost",
  database: "testdb",
  // username: "username",
  // password: "password",
  port: 8086
});

router.get("/all", (req, res) => {
  influx
    .query("select * from cpu")
    .then(results => {
      res.json(results);
    })
    .catch(console.error);
});

module.exports = router;
