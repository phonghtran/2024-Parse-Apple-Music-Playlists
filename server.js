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
// middleware for development-only routes
// ******************************************
// ******************************************
const requireDevelopment = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Page not found');
  }
  next();
};

// ******************************************
// ******************************************
//body parser
// ******************************************
// ******************************************
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ******************************************
// ******************************************
// get track info
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
//get debug info (development only)
app.get("/debugdbcall", requireDevelopment, (req, res) => {
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

// Make environment available to templates
app.locals.NODE_ENV = process.env.NODE_ENV || 'development';

app.get("/", (req, res) => {
  res.render("pages/index");
});

// Development-only routes (hidden in production)
app.get("/debug", requireDevelopment, (req, res) => {
  res.render("pages/debugpage");
});

app.get("/query", requireDevelopment, (req, res) => {
  res.render("pages/query");
});

app.get("/rebuild", requireDevelopment, (req, res) => {
  res.render("pages/rebuild");
});

// Public routes
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
  addToDatabase(req, res, params);
});

// ******************************************
// ******************************************
// live refresh (development only)
// ******************************************
// ******************************************
if (process.env.NODE_ENV !== 'production') {
  try {
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
  } catch (err) {
    console.log("Live reload not available in production");
  }
}

// ******************************************
// ******************************************
//config
// ******************************************
// ******************************************
const PORT = process.env.PORT || 8080;

// For Firebase App Hosting, export the app instead of listening
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;