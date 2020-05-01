// const router = require("express").Router();
// const mysql = require("mysql2");
// const dotenv = require("dotenv");

// const fs = require("fs");
// const csv = require("csv-parser");

// let results = [];

// fs.createReadStream("/home/api/files/traveller_list_01.csv")
//   .pipe(
//     csv({
//       headers: false,
//     })
//   )
//   .on("data", (data) => results.push(data))
//   .on("end", () => {
//     console.log(results);
//   });

// dotenv.config();

// router.get("/user/:id", function (req, res) {
//   res.send("user" + req.params.id);
// });
