const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const plist = require("plist");

const folderPath = "./musicXML"; // Path to your folder

const pattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}.xml$/; // filename filter
// /^[0-9]{4}-[0-9]{2}-[0-9]{2}.xml$/
// /^2024-[0-9]{2}-[0-9]{2}.xml$/
// /^2024-10-04.xml$/;

// Filter function to exclude files based on their names
function filterFiles(file) {
  try {
    // console.log(pattern.test(file));
    // const fileName = path.basename(file);
    return pattern.test(file); // Return true if file name doesn't match the email pattern
  } catch (err) {
    console.error(err);
    return false; // Default to include in case of error
  }
}

const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject("Unable to scan directory: " + err);
      } else {
        resolve(files);
      }
    });
  });
};

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(folderPath, file);
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        reject("Unable to scan directory: " + err);
      } else {
        resolve(data);
      }
    });
  });
};

const getXMLFiles = async (req, res) => {
  let files = [];
  try {
    files = await readDir(folderPath);
    // console.log(files.length);
    files = files.filter((file) => filterFiles(file));
    // console.log(files.length);
    // console.log(files, "in");

    for (var i = 0; i < files.length; i++) {
      //   console.log(files[i]);
      files[i] = files[i].slice(0, -4);
    }

    res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}; //getXMLFiles

const getFileContents = async (req, res, params) => {
  const file = `${params.file}.xml`;
  try {
    const contents = await readFile(file);

    const jsonObj = plist.parse(contents);

    res.json(jsonObj);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}; //getFileContents

module.exports = { getXMLFiles, getFileContents };
