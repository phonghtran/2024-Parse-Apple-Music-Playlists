const fs = require("fs");
const path = require("path");
// const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const plist = require("plist");
const axios = require("axios");

const folderPath = "./musicXML"; // Path to your folder

const pattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}.xml$/; // filename filter
// /^[0-9]{4}-[0-9]{2}-[0-9]{2}.xml$/
// /^2024-[0-9]{2}-[0-9]{2}.xml$/
// /^2024-10-04.xml$/;

// Filter function to exclude files based on their names
function filterFiles(file) {
  try {
    const fileName = path.basename(file);
    return pattern.test(fileName); // Return true if file name doesn't match the email pattern
  } catch (err) {
    console.error(err);
    return false; // Default to include in case of error
  }
}

// Function to fetch data
const fetchData = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/tracks?sort=playlistOnly"
    ); // Replace with your API endpoint
    const data = await response.json(); // Extract JSON data from the response
    // console.log("inside fetch", data); // Log the data to see the structure

    // Assign data to a variable
    // let myData = data;

    // Do something with myData
    // console.log("Fetched Data:", myData);

    return data;
  } catch (error) {
    console.error("Error fetching data:", error); // Handle any errors
  }
};

let existingPlaylists = {};

const checkPlaylistIsNew = (name) => {
  // console.log("inside check", existingPlaylists);
  let isNew = true;
  for (pl in existingPlaylists) {
    // console.log(existingPlaylists[pl]["playlistName"], name);
    if (name === existingPlaylists[pl]["playlistName"]) {
      isNew = false;
      break;
    }
  }

  return isNew;
};

async function addToPlaylists(currentPlaylist, orderedJSON) {
  // console.log(orderedJSON, "add");
  sendToDbPlaylists[currentPlaylist] = await {
    tracks: orderedJSON,
  };

  // console.log("add to", sendToDbPlaylists[currentPlaylist]);
} //addToPlaylists

function writeToDB() {
  console.log("write", sendToDbPlaylists);

  // axios
  //   .post("http://localhost:3000/write", sendToDbPlaylists)
  //   .then((response) => {
  //     console.log("Success:", response.data);
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //   });
} //writeToDB

const getExistingPlaylists = async () => {
  existingPlaylists = await fetchData();
  // console.log("found it waitied", existingPlaylists);

  inspectMusicFolder(existingPlaylists);
};

const inspectMusicFolder = async (existingPlaylists) => {
  // console.log("inspect", existingPlaylists);
  let xmlFiles = {};

  // Read the directory
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      return;
    }

    // Filter XML files
    // const xmlFiles = files.filter((file) => path.extname(file) === ".xml");
    xmlFiles = files.filter((file) => filterFiles(file));
    // console.log("inside", xmlFiles);

    // Read and parse each XML file

    xmlFiles.forEach((file) => {
      const currentPlaylist = file.slice(0, -4);

      // console.log("inside folders", existingPlaylists);

      const isNew = checkPlaylistIsNew(currentPlaylist);

      // if (isNew) {
      // console.log("parsing file", currentPlaylist, isNew);
      const filePath = path.join(folderPath, file);
      fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
          console.error("Failed to read file:", filePath, err);
          return;
        }

        let jsonObj = plist.parse(data);

        // console.log(jsonObj);

        // console.log(jsonObj["Tracks"]);

        let orderedJSON = [];
        for (elem in jsonObj["Playlists"][0]["Playlist Items"]) {
          const id =
            jsonObj["Playlists"][0]["Playlist Items"][elem]["Track ID"];

          // console.log(id);
          orderedJSON.push(jsonObj["Tracks"][id]);
        }

        sendToDbPlaylists.fires = {
          tracks: "bye",
        };
        // addToPlaylists(currentPlaylist, orderedJSON);

        // console.log(orderedJSON);
        // console.log("sending playlist to write");
      }); // read file
      // } //isnew
    }); // for each

    console.log("finished file loop", sendToDbPlaylists);
    // writeToDB();
  }); // read dir
}; // inspectMusicFolder

getExistingPlaylists();
