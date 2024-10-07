const express = require("express");

const app = express();
const path = require("path");

const { exec } = require("child_process");

//body parser
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

//db
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

// Create a table
db.serialize(() => {
  db.run("DROP TABLE IF EXISTS tracks");

  db.run(
    "CREATE TABLE IF NOT EXISTS tracks (id INTEGER PRIMARY KEY, playlistName TEXT, trackPosition INTEGER, artist TEXT, name TEXT, genre TEXT)"
  );

  //   const stmt = db.prepare("INSERT INTO users (name, age) VALUES (?,?)");
  //   stmt.run("John Doe", "24");
  //   stmt.finalize();
});

// Close the database connection when the app terminates
process.on("SIGINT", () => {
  db.close();
  process.exit();
});

function escapeQuotes(str) {
  return str;
  // prettier-ignore
  return str.replace(/(['"])/g, "\\$1");
}

// Route to insert data into the database
app.post("/write", (req, res) => {
  db.run(
    "CREATE TABLE IF NOT EXISTS tracks (id INTEGER PRIMARY KEY, playlistName TEXT, trackPosition INTEGER, artist TEXT, name TEXT, genre TEXT)"
  );

  const tracks = req.body.tracks;
  const playlistName = req.body.playlistName;

  let sql =
    "INSERT INTO tracks (playlistName, trackPosition, artist, name, genre) VALUES ";

  for (const i in tracks) {
    const track = tracks[i];

    sql += `("${playlistName}", "${parseInt(track["Track ID"])}", "${
      track.Artist
    }", "${track.Name}", "${track.Genre}"), `;
  }

  sql = sql.slice(0, -2);

  //   console.log(sql);

  db.run(sql, function (err) {
    if (err) {
      return res.status(500).send("Failed to insert tracks");
    }
    res.status(200).send(`Inserted ${this.changes} tracks`);
  });
});

// Route to fetch data from the database
app.get("/tracks", (req, res) => {
  db.all("SELECT * FROM tracks", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (rows.length > 0) {
      res.json(rows);
    } else {
      return res.status(500).json({ error: "no rows" });
    }
  });
});

// drop table
app.get("/drop", (req, res) => {
  db.run("DROP TABLE tracks", function (err) {
    if (err) {
      return res.status(500).send("Failed to drop table");
    }
    res.status(200).send(`dropped table`);
  });
});

// buffer overrun
const maxBufferSize = 100 * 1024 * 1024; // 100 MB

// live refresh
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

// run script from index.html

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

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

//config
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
