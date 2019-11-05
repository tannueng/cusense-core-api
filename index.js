const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log("Responding to root route");
  res.send("Hello from ROOT");
});

// localhost:3333
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});
