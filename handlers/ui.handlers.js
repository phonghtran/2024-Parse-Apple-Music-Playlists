const express = require("express");
const router = express.Router();

// ******************************************
// ******************************************
// colord and wuzzy
// ******************************************
// ******************************************
const wuzzy = require("wuzzy");

const { colord, extend } = require("colord");
const mixPlugin = require("colord/plugins/mix");

extend([mixPlugin]);

const getGenreColors = (req, res, params) => {
  // const genre = req.query.genre;
  const { genre } = params;
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
}; //getGenreColors

module.exports = { getGenreColors };
