import _ from "lodash";
import express from "express";
import cors from "cors";
import { YoutubeTranscript } from "youtube-transcript";
import bodyParser from "body-parser";
const app = express();
const port = 3100;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

app.post("/", async (req, res) => {
  let lines = await YoutubeTranscript.fetchTranscript(req.body.id);
  let text = "";

  for (let i = 0; i < lines.length; i++) {
    text += lines[i].text + " ";
  }

  // Remove /n from the text

  res.send({ subtitles: text.replace(/\n/g, "") });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
