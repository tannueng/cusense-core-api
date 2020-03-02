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

router.post("/direct", (req, res) => {
  const { error } = directQueryValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  pool.query(defaultSQLquery, function(err, rows, fields) {
    influx
      .query(req.body.query)
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
      .catch(error => {
        res.status(400).send(error.message);
        console.log(error.message);
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
    // console.log("Station data received from SQL");
    influx
      .query("select mean(*) from airdata group by topic")
      .then(results => {
        // console.log(results);
        // console.log("before loop");
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
        // console.log("after loop");
        res.json(final_result);
      })
      .catch(console.error);
  });
});

router.get("/day/:type", (req, res) => {
  const type = req.params.type;
  if (type == "pm") {
    matchQuery(
      defaultSQLquery,
      "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10 from airdata where time > now() - 24h group by topic",
      res
    );
  } else if (type == "all") {
    matchQuery(
      defaultSQLquery,
      "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(co2) as co2, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 24h group by topic",
      res
    );
  } else {
    res.status(400).send("Invalid URL Parameter.");
  }
});

router.post("/day/:type", (req, res) => {
  const type = req.params.type;
  const topic = req.body.topic;
  const project = req.body.project;

  if (project && !topic) {
    //By Project
    if (type == "pm") {
      matchQuery(
        byProjectSQLQuery(project),
        'select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10 from airdata where time > now() - 24h and "group" = \'' +
          project +
          "' group by topic",
        res
      );
    } else if (type == "all") {
      matchQuery(
        byProjectSQLQuery(project),
        'select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(co2) as co2, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 24h and "group" = \'' +
          project +
          "' group by topic",
        res
      );
    } else {
      res.status(400).send("Invalid URL Parameter. Either pm or all");
    }
  } else if (!project && topic) {
    //By topic
    if (type == "pm") {
      matchSpecificQuery(
        byStationSQLQuery(topic),
        'select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10 from airdata where time > now() - 24h and "topic" = \'' +
          topic +
          "'",
        topic,
        res
      );
    } else if (type == "all") {
      matchSpecificQuery(
        byStationSQLQuery(topic),
        'select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(co2) as co2, mean(humid) as humid, mean(temp) as temp from airdata where time > now() - 24h and "topic" = \'' +
          topic +
          "'",
        topic,
        res
      );
    } else {
      res.status(400).send("Invalid URL Parameter. Either pm or all");
    }
  } else {
    res.status(400).send("Invalid POST parameter. Either 'topic' or 'project'");
  }
});

router.get("/realtime/:type", (req, res) => {
  const type = req.params.type;
  if (type == "pm") {
    matchQuery(
      defaultSQLquery,
      "select pm1, pm25, pm10 from airdata where time > now() - 3h group by topic order by time desc limit 1",
      res
    );
  } else if (type == "all") {
    matchQuery(
      defaultSQLquery,
      // "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(co2) as co2, mean(humid) as humid from airdata where time > now() - 3h group by time(1h), topic order by time desc limit 1",
      "select mean(pm1) as pm1, mean(pm25) as pm25, mean(pm10) as pm10, mean(temp) as temp, mean(co2) as co2, mean(humid) as humid from airdata where time > now() - 3h group by time(1h), topic fill(none) order by time desc limit 1",
      res
    );
  } else {
    res.status(400).send("Invalid URL Parameter. Either pm or all");
  }
});

// POST /realtime
router.post("/realtime/:type", (req, res) => {
  const type = req.params.type;
  const topic = req.body.topic;
  const project = req.body.project;

  //Search by Topic
  if (topic && !project) {
    if (type == "pm") {
      matchSpecificQuery(
        byStationSQLQuery(topic),
        'select pm1, pm25, pm10 from airdata where time > now() - 3h and "topic" = \'' +
          topic +
          "' order by time desc limit 1",
        topic,
        res
      );
    } else if (type == "all") {
      matchSpecificQuery(
        byStationSQLQuery(topic),
        'select pm1, pm25, pm10, temp, co2, humid from airdata where time > now() - 3h and "topic" = \'' +
          topic +
          "' order by time desc limit 1",
        topic,
        res
      );
    } else {
      res.status(400).send("Invalid URL Parameter. Either pm or all");
    }

    //Search by Project
  } else if (!topic && project) {
    if (type == "pm") {
      matchQuery(
        byProjectSQLQuery(project),
        'select pm1, pm25, pm10 from airdata where time > now() - 3h and "group" = \'' +
          project +
          "' order by time desc limit 1 group by topic ",
        res
      );
    } else if (type == "all") {
      matchQuery(
        byProjectSQLQuery(project),
        'select pm1, pm25, pm10, temp, co2, humid from airdata where time > now() - 3h and "group" = \'' +
          project +
          "' order by time desc limit 1 group by topic",
        res
      );
    } else {
      res.status(400).send("Invalid URL Parameter. Either pm or all");
    }
  } else {
    res.status(400).send("Invalid POST parameter. Either 'topic' or 'project'");
  }
});

router.post("/byStation/:timeframe/:date", (req, res) => {
  const timeframe = req.params.timeframe;
  const date = req.params.date;
  const topic = req.body.topic;

  // console.log(timeframe, date, topic);

  if (timeframe == "monthly") {
    const { error } = monthValidation(date);
    if (error) return res.status(400).send(error.details[0].message);

    matchSpecificQuery(
      byStationSQLQuery(topic),
      //TODO change mean(*)
      "select mean(*) from airdata where time >= '" +
        date +
        "-01' - 7h and time <= '" +
        date +
        "-01' + 30d - 7h and  \"topic\" = '" +
        topic +
        "' group by time(1d)",
      topic,
      res
    );
  } else if (timeframe == "daily") {
    const { error } = dateValidation(date);
    if (error) return res.status(400).send(error.details[0].message);

    matchSpecificQuery(
      byStationSQLQuery(topic),
      "select mean(*) from airdata where time >= '" +
        date +
        "' - 7h and time <= '" +
        date +
        "' + 1d - 7h and \"topic\" = '" +
        topic +
        "' group by time(1h)",
      topic,
      res
    );
  } else {
    res.status(400).send("Invalid URL Parameter.");
  }
});

//********************************************** */

function matchQuery(mysqlQuery, influxQuery, res) {
  pool.query(mysqlQuery, function(err, rows, fields) {
    influx
      .query(influxQuery)
      .then(results => {
        // console.log(rows);
        // console.log(results);
        if (rows.length == 0) {
          res.status(404).send("Invalid 'project' input.");
        } else {
          let final_result = {};
          let firstTime = true;
          for (i = 0; i < rows.length; i++) {
            for (j = 0; j < results.length; j++) {
              if (rows[i].topic == results[j].topic) {
                // console.log("match : ", rows[i].topic, results[j].topic);
                //Match Corresponding Topic
                if (firstTime) {
                  final_result[rows[i].id] = {};
                  final_result[rows[i].id].data = [];
                }

                if (results[j].pm1 != null)
                  results[j].pm1 = parseInt(results[j].pm1, 10);
                if (results[j].pm25 != null)
                  results[j].pm25 = parseInt(results[j].pm25, 10);
                if (results[j].pm10 != null)
                  results[j].pm10 = parseInt(results[j].pm10, 10);
                if (results[j].humid != null)
                  results[j].humid = parseInt(results[j].humid, 10);

                if (results[j].temp != null)
                  results[j].temp = Number(
                    parseFloat(results[j].temp).toFixed(1)
                  );

                final_result[rows[i].id].data.push(results[j]);
                final_result[rows[i].id].info = rows[i];
                firstTime = false;
              }
            }
            firstTime = true;
          }
          res.json(final_result);
        }
      })
      .catch(console.error);
  });
}

function matchSpecificQuery(mysqlQuery, influxQuery, topic, res) {
  pool.query(mysqlQuery, function(err, rows, fields) {
    influx
      .query(influxQuery)
      .then(results => {
        if (rows.length == 0) {
          res.status(404).send("Invalid 'topic' input.");
        } else {
          let final_result = {};
          let firstTime = true;
          for (i = 0; i < rows.length; i++) {
            for (j = 0; j < results.length; j++) {
              if (rows[i].topic == topic) {
                //Match Specific Topic
                if (firstTime) {
                  final_result[rows[i].id] = {};
                  final_result[rows[i].id].data = [];
                }

                if (results[j].pm1 != null)
                  results[j].pm1 = parseInt(results[j].pm1, 10);
                if (results[j].pm25 != null)
                  results[j].pm25 = parseInt(results[j].pm25, 10);
                if (results[j].pm10 != null)
                  results[j].pm10 = parseInt(results[j].pm10, 10);
                if (results[j].humid != null)
                  results[j].humid = parseInt(results[j].humid, 10);

                if (results[j].temp != null)
                  results[j].temp = Number(
                    parseFloat(results[j].temp).toFixed(1)
                  );

                final_result[rows[i].id].data.push(results[j]);
                final_result[rows[i].id].info = rows[i];
                firstTime = false;
              }
            }
            firstTime = true;
          }
          res.json(final_result);
        }
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

function byProjectSQLQuery(project) {
  return (
    "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province FROM station WHERE publish = 1 AND project = '" +
    project +
    "'"
  );
}

module.exports = router;
