const express = require("express");

const app = express();
const path = require("path");

const { exec } = require("child_process");

const { getGenreColors } = require("./handlers/util.handlers.js");
const {
  getTrackInfo,
  getTracks,
  dropTables,
  debugTables,
  addToDatabase,
} = require("./handlers/db.handlers.js");
const {
  getXMLFiles,
  getFileContents,
} = require("./handlers/parse.handlers.js");

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

app.get("/query", (req, res) => {
  res.render("pages/query");
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


app.get("/hot", (req, res) => {
  res.render("pages/hot");
});

app.get("/rebuild", (req, res) => {
  res.render("pages/rebuild");
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

app.get("/getXMLFiles", (req, res) => {
  getXMLFiles(req, res);
});

app.get("/getFileContents", (req, res) => {
  const params = req.query;
  getFileContents(req, res, params);
});

app.post("/write2", (req, res) => {
  const params = req.body;
  // console.log(params);
  addToDatabase(req, res, params);
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
//config
// ******************************************
// ******************************************
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
