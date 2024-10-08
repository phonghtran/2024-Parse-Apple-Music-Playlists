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

const { colord, extend } = require("colord");
const mixPlugin = require("colord/plugins/mix");

extend([mixPlugin]);

app.get("/colord", (req, res) => {
  const genre = req.query.genre;
  // console.log(genre);

  const testBank = [
    { genre: "Pop", color: "#fd7f6f" },
    {
      genre: "K-Pop",
      color: "#fd7f6f",
    },

    { genre: "Hip-Hop", color: "#7eb0d5" },
    { genre: "Rap", color: "#7eb0d5" },
    { genre: "Hip-Hop/Rap", color: "#7eb0d5" },
    { genre: "Urbano latino", color: "#7eb0d5" },
    { genre: "Acid Rap", color: "#7eb0d5" },

    { genre: "Alternative", color: "#b2e061" },
    { genre: "Alt Rock", color: colord("#b2e061").mix("#beb9db").toHex() },
    { genre: "Singer/Songwriter", color: "#b2e061" },

    { genre: "R&B/Soul", color: "#bd7ebe" },
    { genre: "R&B", color: "#bd7ebe" },
    { genre: "Soul", color: "#bd7ebe" },

    { genre: "Electronic", color: "#ffb55a" },
    { genre: "Dance", color: "#ffb55a" },
    { genre: "Garage", color: "#ffb55a" },
    { genre: "Dubstep", color: "#ffb55a" },

    { genre: "Indie", color: "#ffee65" },

    { genre: "Latin", color: "#8bd3c7" },

    { genre: "Rock", color: "#beb9db" },
    { genre: "Metal", color: "#beb9db" },
    { genre: "Punk", color: "#beb9db" },

    { genre: "Jazz", color: "#fdcce5" },
    { genre: "Blues", color: "#fdcce5" },

    { genre: "Country", color: colord("#beb9db").saturate(0.25).toHex() },

    { genre: "Disco", color: "#CC99CC" },

    { genre: "Raggae", color: "#33CC33" },

    { genre: "Mashup", color: "#999966" },

    { genre: "Christian", color: "#00BFFF" },
    { genre: "Gospel", color: "#00BFFF" },
  ];

  let bestScore = {
    score: 0,
    genre: "",
    color: "#FFFFFF",
  };
  let debug = [];

  for (var i = 0; i < testBank.length; i++) {
    if (genre.length > 20) break;

    const score = wuzzy.jarowinkler(genre, testBank[i]["genre"]);

    if (score > bestScore.score && score > 0.6) {
      bestScore = {
        score: score,
        genre: testBank[i]["genre"],
        color: colord(testBank[i]["color"])
          .lighten(1 - score)
          .toHex(),
      };
    }

    if (score === 1) {
      bestScore.color = testBank[i]["color"];
      break;
    }

    debug.push([score, testBank[i]]);
  }

  res.json({
    bestScore,
    debug,
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
