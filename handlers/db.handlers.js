const express = require("express");
const router = express.Router();

// ******************************************
// ******************************************
// db setup
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
// get track info
// ******************************************
// ******************************************
const getTrackInfo = (req, res, params) => {
  const { pairedName } = params;

  const sql = `SELECT * FROM tracks WHERE pairedName = '${pairedName}' ORDER BY tracks.playlistName DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
}; // getTrackInfo

// ******************************************
// ******************************************
// get tables
// ******************************************
// ******************************************
const getTracks = async (req, res, params) => {
  // console.log(req.query.sort);

  //   const sortType = req.query.sort;

  const { sort } = params;

  // console.log(sortType);

  let sql = "SELECT * FROM tracks ORDER BY artist ASC,name ASC";
  switch (sort) {
    case "db":
      sql = "SELECT * FROM tracks ORDER BY tid ASC, artist ASC, name ASC";
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

    case "pairedName":
      sql = "SELECT * FROM tracks ORDER BY pairedName ASC, playlistName DESC";
      break;

    case "genresgraph":
      sql =
        "SELECT playlistName, genre, COUNT(genre) as count FROM tracks  GROUP BY playlistName,genre ";
      break;

    case "playlistOnly":
      sql = "SELECT playlistName FROM tracks GROUP BY playlistName";
      break;

    case "fullGenreList":
      sql = "SELECT DISTINCT genre FROM tracks ";
      break;

    case "hot":
      const { prioritizeTracks } = params;

      let where = '';


      console.log(params, req.query)
      if (params.genre) {
        const items = Object.values(req.query.genre);

        const placeholders = items.map((item) => `"${item}"`).join(", ");
        where = `WHERE genre IN (${placeholders})`
      }

      const orderItems = [
        'COUNT(DISTINCT name) DESC',
        'MAX( playcount) DESC',
        'MAX(playlistName) DESC'
      ]
      let orderBy = ''
      if (prioritizeTracks === '0') {
        orderBy = `ORDER BY ${orderItems[0]}, ${orderItems[1]}, ${orderItems[2]}`
      } else if (prioritizeTracks === '1') {
        orderBy = `ORDER BY ${orderItems[1]}, ${orderItems[0]}, ${orderItems[2]}`
      } else {
        orderBy = `ORDER BY ${orderItems[2]}, ${orderItems[0]}, ${orderItems[1]}`
      }

      sql = `SELECT artist, COUNT(DISTINCT name) AS 'unique tracks', MAX( playcount) AS 'total plays', MAX(playlistName) as 'latest entry' FROM tracks ${where} GROUP BY artist ${orderBy}`;


      break;

    default:
    case "playlist":
      sql = "SELECT * FROM tracks ORDER BY playlistName ASC, trackPosition ASC";
      break;
  }

  console.log(sql);

  db.all(sql, [], (err, rows) => {
    // console.log(rows, err);
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (rows.length > 0) {
      res.json(rows);
    } else {
      return res.json({ error: "no rows" });
    }
  });
}; //gettracks

// ******************************************
// ******************************************
// drop tables
// ******************************************
// ******************************************
const dropTables = (req, res, params) => {
  db.serialize(() => {
    // test if these work

    db.run("DROP TABLE IF EXISTS tracks");
    db.run("DROP TABLE IF EXISTS keyedSongs");

    db.run(
      "CREATE TABLE IF NOT EXISTS tracks (tid INTEGER PRIMARY KEY, playlistName TEXT, trackPosition INTEGER, artist TEXT, name TEXT, genre TEXT, rating INTEGER, playcount INTEGER, pairedName TEXT)"
    );

    db.run(
      "CREATE TABLE IF NOT EXISTS keyedSongs (ksid INTEGER PRIMARY KEY, pairedName TEXT UNIQUE)"
    );
  });
}; //dropTables

// ******************************************
// ******************************************
// debug
// ******************************************
// ******************************************
const debugTables = (req, res, params) => {
  const sql =
    "SELECT playlistName, COUNT(playlistName) as count FROM tracks GROUP BY playlistName";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
}; //debugTables

// ******************************************
// ******************************************
// write tables
// ******************************************
// ******************************************
const addToDatabase = (req, res, params) => {
  const { tracks, playlistName } = params;

  let sql =
    "INSERT INTO tracks (playlistName, trackPosition, artist, name, genre,  rating, playcount, pairedName) VALUES ";

  let keyedSong = "INSERT OR IGNORE INTO keyedSongs (pairedName) VALUES ";

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];

    // if (i < 1)
    console.log(track);

    let artist = track.Artist ? track.Artist : "";
    let name = track.Name ? track.Name : "";

    artist = artist.replace(/"/g, '""');
    name = name.replace(/"/g, '""');

    let pairedName = `${track.Artist} - ${track.Name}`;
    pairedName = pairedName
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const playcount = track["Play Count"] ? track["Play Count"] : 0;
    const rating = track.Rating ? track.Rating : 0;

    sql += `("${playlistName}", "${i}", "${artist}", "${name}", "${track.Genre}",  ${rating}, ${playcount}, "${pairedName}"), `;

    keyedSong += `("${pairedName}"), `;
  }

  sql = sql.slice(0, -2);
  keyedSong = keyedSong.slice(0, -2);

  sql = sql.replace(/'/g, "''");
  keyedSong = keyedSong.replace(/'/g, "''");

  // console.log(playlistName);
  console.log(sql);
  // console.log(keyedSong);

  db.serialize(() => {
    db.run(keyedSong, function (err) {
      if (err) {
        return res.status(500).send("Failed to insert keyedsongs");
      }
    });

    db.run(sql, function (err) {
      if (err) {
        return res.status(500).send("Failed to insert tracks");
      }
      res.status(200).send(`Inserted ${this.changes} tracks`);
    });
  });
}; //addToDatabase

module.exports = {
  getTrackInfo,
  getTracks,
  dropTables,
  debugTables,
  addToDatabase,
};
