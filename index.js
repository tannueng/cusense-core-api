const express = require("express");
const app = express();


//Import Routes
const authRoute = require("./routes/query");

app.get("/", (req, res) => {
  console.log("Responding to root route");
  res.send("Hello from ROOT");
});

//Route Middleware
app.use("/api/v1/check", queryRoute);

// localhost:3333
app.listen(3333, () => {
  console.log("Server is up and listening on 3333...");
});
