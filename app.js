const express = require("express");

const app = express();
const path = require("path");

const { exec } = require("child_process");

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
// colord
// ******************************************
// ******************************************
const wuzzy = require("wuzzy");
const { colord } = require("colord");
app.get("/colord", (req, res) => {
  const str1 = "DWAYNE";
  const str2 = "DUANE";

  const jaroWinkler = wuzzy.jarowinkler(str1, str2);
  const levenshtein = wuzzy.levenshtein(str1, str2);
  const jaccard = wuzzy.jaccard(str1, str2);

  const color = colord("hsl(0, 50%, 50%)").darken(0.25).toHex();

  res.json({
    color,
    jaroWinkler,
    levenshtein,
    jaccard,
  });
});

// ******************************************
// ******************************************
// db
// ******************************************
// ******************************************
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

// Close the database connection when the app terminates
process.on("SIGINT", () => {
  db.close();
  process.exit();
});

// ******************************************
// ******************************************
// Route to insert data into the database
// ******************************************
// ******************************************
app.post("/write", (req, res) => {
  const tracks = req.body.tracks;
  const playlistName = req.body.playlistName;

  let sql =
    "INSERT INTO tracks (playlistName, trackPosition, artist, name, genre, pairedName) VALUES ";

  let keyedSong = "INSERT OR IGNORE INTO keyedSongs (pairedName) VALUES ";

  let trackPosition = 1;
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];

    const pairedName = `${track.Artist} - ${track.Name}`;

    sql += `("${playlistName}", "${trackPosition}", "${track.Artist}", "${track.Name}", "${track.Genre}", "${pairedName}"), `;

    keyedSong += `("${pairedName}"), `;

    trackPosition++;
  }

  sql = sql.slice(0, -2);
  keyedSong = keyedSong.slice(0, -2);

  console.log(playlistName);
  //   console.log(sql);
  //   console.log(keyedSong);

  db.serialize(() => {
    // test if these work
    db.run("DROP TABLE IF EXISTS tracks");
    db.run("DROP TABLE IF EXISTS keyedSongs");

    db.run(
      "CREATE TABLE IF NOT EXISTS tracks (tid INTEGER PRIMARY KEY, playlistName TEXT, trackPosition INTEGER, artist TEXT, name TEXT, genre TEXT, pairedName TEXT)"
    );

    db.run(
      "CREATE TABLE IF NOT EXISTS keyedSongs (ksid INTEGER PRIMARY KEY, pairedName TEXT UNIQUE)"
    );

    db.run(keyedSong, function (err) {});

    db.run(sql, function (err) {
      if (err) {
        return res.status(500).send("Failed to insert tracks");
      }
      res.status(200).send(`Inserted ${this.changes} tracks`);
    });
  });
});

// Route to fetch data from the database
app.get("/keyedname", (req, res) => {
  const pairedName = req.query.pairedName;

  let sql = `SELECT * FROM keyedSongs WHERE pairedName = '${pairedName}'`;
  console.log(sql);
  db.all(sql, [], (err, rows) => {
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

//get track ifo
app.get("/getTrackInfo", (req, res) => {
  let pairedName = req.query.pairedName
    .replace(/&amp;/g, "&")
    .replace(/'/g, "''");
  console.log(pairedName);

  const sql = `SELECT * FROM tracks WHERE pairedName = '${pairedName}' ORDER BY tracks.playlistName DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

//get genresgraph ifo
app.get("/genresgraph", (req, res) => {
  const sql =
    "SELECT playlistName, genre, COUNT(genre) as count FROM tracks  GROUP BY playlistName,genre ";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

//get debug ifo
app.get("/debugdbcall", (req, res) => {
  const sql =
    "SELECT genre, COUNT(genre) as count FROM tracks  GROUP BY genre ";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ******************************************
// ******************************************
// Route to fetch data from the database
// ******************************************
// ******************************************
app.get("/tracks", (req, res) => {
  // console.log(req.query.sort);

  const sortType = req.query.sort;

  //   console.log(sortType);

  let sql = "SELECT * FROM tracks ORDER BY artist ASC,name ASC";
  switch (sortType) {
    case "db":
      sql = "SELECT * FROM tracks ORDER BY tid ASC, artist ASC, name ASC";
      break;

    case "playlist":
      sql = "SELECT * FROM tracks ORDER BY playlistName ASC, trackPosition ASC";
      break;

    case "playlistRecent":
      sql =
        "SELECT * FROM tracks LEFT JOIN keyedSongs ON tracks.pairedName = keyedSongs.pairedName ORDER BY tracks.playlistName DESC, tracks.trackPosition ASC";
      break;
    case "artist":
      sql = "SELECT * FROM tracks ORDER BY artist ASC,name ASC";
      break;

    case "name":
      sql = "SELECT * FROM tracks ORDER BY name ASC, artist ASC";
      break;

    case "genre":
      sql = "SELECT * FROM tracks ORDER BY genre ASC,artist ASC, name ASC";
      break;
  }

  // console.log(sql);

  db.all(sql, [], (err, rows) => {
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

// buffer overrun
const maxBufferSize = 100 * 1024 * 1024; // 100 MB

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
// run script from index.html
// ******************************************
// ******************************************
app.use("/", express.static(__dirname + "/public/")); // Serve files from 'public' folder as root directory

// ******************************************
// ******************************************
// parse the music xml files
// ******************************************
// ******************************************
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
