const express = require("express");

const app = express();
const path = require("path");

const { exec } = require("child_process");

const { getGenreColors } = require("./handlers/util.handlers.js");
const {
  getTrackInfo,
  getTracks,
  dropTables,
  writeTables,
  debugTables,
} = require("./handlers/db.handlers.js");

// ******************************************
// ******************************************
//body parser
// ******************************************
// ******************************************
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// ******************************************
// ******************************************
// Route to insert data into the database
// ******************************************
// ******************************************

app.post("/write", (req, res) => {
  const params = req.body;
  writeTables(req, res, params);
});

// ******************************************
// ******************************************
// get track ifo
// ******************************************
// ******************************************

app.get("/getTrackInfo", (req, res) => {
  const params = req.query;
  getTrackInfo(req, res, params);
});

// ******************************************
// ******************************************
// debug
// ******************************************
// ******************************************
//get debug ifo
app.get("/debugdbcall", (req, res) => {
  const params = req.query;
  debugTables(req, res, params);
});

// ******************************************
// ******************************************
// db - Route to fetch data from the database
// ******************************************
// ******************************************

app.get("/tracks", (req, res) => {
  const params = req.query;
  getTracks(req, res, params);
});

// ******************************************
// ******************************************
// db drop
// ******************************************
// ******************************************

app.get("/drop", (req, res) => {
  const params = req.query;
  dropTables(req, res, params);
});

// ******************************************
// ******************************************
// colord and wuzzy
// ******************************************
// ******************************************

app.get("/colord", (req, res) => {
  const params = req.query;
  getGenreColors(req, res, params);
});
// ******************************************
// ******************************************
// live refresh
// ******************************************
// ******************************************
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

const liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname + "/");

app.use(connectLiveReload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// ******************************************
// ******************************************
// load html files from public
// ******************************************
// ******************************************
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
// app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/debug", (req, res) => {
  res.render("pages/debugpage");
});

app.get("/parse", (req, res) => {
  res.render("pages/parse");
});

app.get("/streaks", (req, res) => {
  res.render("pages/streaks");
});

app.get("/playlists", (req, res) => {
  res.render("pages/playlists");
});

app.get("/genres", (req, res) => {
  res.render("pages/genres");
});
// app.use("/", express.static(__dirname + "/public/")); // Serve files from 'public' folder as root directory

// ******************************************
// ******************************************
// parse the music xml files
// ******************************************
// ******************************************

const maxBufferSize = 100 * 1024 * 1024; // 100 MB
app.get("/run-script", (req, res) => {
  exec(
    "node scripts/parse.js",
    { maxBuffer: maxBufferSize },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error}`);
        return res.status(500).send("Error executing script");
      }
      res.send(stdout);
    }
  );
});

// ******************************************
// ******************************************
//config
// ******************************************
// ******************************************
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
