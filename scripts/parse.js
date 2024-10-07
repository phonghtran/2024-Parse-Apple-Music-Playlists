const fs = require("fs");
const path = require("path");
// const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const plist = require("plist");
const axios = require("axios");

const folderPath = "./musicXML"; // Path to your folder

const pattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}.xml$/; // filename filter

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

// Read the directory
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error("Failed to read directory:", err);
    return;
  }

  // Filter XML files
  // const xmlFiles = files.filter((file) => path.extname(file) === ".xml");
  const xmlFiles = files.filter((file) => filterFiles(file));
  // console.log(xmlFiles);

  let i = 0;
  // Read and parse each XML file

  try {
    xmlFiles.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
          console.error("Failed to read file:", filePath, err);
          return;
        }

        let jsonObj = plist.parse(data);

        const playlist = {
          playlistName: file.slice(0, -4),
          tracks: jsonObj["Tracks"],
        };

        axios
          .post("http://localhost:3000/write", playlist)
          .then((response) => {
            console.log("Success:", response.data);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }); // read file

      i++;

      if (i > 0) {
        throw new Error("Break");
      }
    }); // for each
  } catch (error) {
    if (error.message !== "Break") throw error;
  }
});
