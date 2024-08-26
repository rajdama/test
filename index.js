import he from "he";
import axios from "axios";
import _ from "lodash";
import striptags from "striptags";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
const app = express();
const port = 3100;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

const fetchData =
  typeof fetch === "function"
    ? async function fetchData(url) {
        const response = await fetch(url);
        return await response.text();
      }
    : async function fetchData(url) {
        const { data } = await axios.get(url);
        return data;
      };

app.post("/", async (req, res) => {
  let videoID = req.body.id;
  let lang = "en";
  const data = await fetchData(`https://youtube.com/watch?v=${videoID}`);

  // * ensure we have access to captions data
  if (!data.includes("captionTracks")) {
    res.send(data);
  } else {
    const regex = /"captionTracks":(\[.*?\])/;
    const [match] = regex.exec(data);

    const { captionTracks } = JSON.parse(`{${match}}`);
    const subtitle =
      _.find(captionTracks, {
        vssId: `.${lang}`,
      }) ||
      _.find(captionTracks, {
        vssId: `a.${lang}`,
      }) ||
      _.find(captionTracks, ({ vssId }) => vssId && vssId.match(`.${lang}`));

    // * ensure we have found the correct subtitle lang
    if (!subtitle || (subtitle && !subtitle.baseUrl))
      throw new Error(`Could not find ${lang} captions for ${videoID}`);

    const transcript = await fetchData(subtitle.baseUrl);
    const lines = transcript
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
      .replace("</transcript>", "")
      .split("</text>")
      .filter((line) => line && line.trim())
      .map((line) => {
        const startRegex = /start="([\d.]+)"/;
        const durRegex = /dur="([\d.]+)"/;

        const [, start] = startRegex.exec(line);
        const [, dur] = durRegex.exec(line);

        const htmlText = line
          .replace(/<text.+>/, "")
          .replace(/&amp;/gi, "&")
          .replace(/<\/?[^>]+(>|$)/g, "");

        const decodedText = he.decode(htmlText);
        const text = striptags(decodedText);

        return {
          start,
          dur,
          text,
        };
      });

    let text = "";

    for (let i = 0; i < lines.length; i++) {
      text += lines[i].text + " ";
    }

    // Remove /n from the text

    res.send({ subtitles: text.replace(/\n/g, "") });
  }
  //   return lines;
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
