import _ from "lodash";
import express from "express";
import cors from "cors";
import { YoutubeTranscript } from "youtube-transcript";
import bodyParser from "body-parser";
import { Innertube } from "youtubei.js/web";
const app = express();
const port = 3100;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

const youtube = await Innertube.create({
  lang: "en",
  location: "US",
  retrieve_player: false,
});

app.post("/", async (req, res) => {
  const info = await youtube.getInfo(req.body.id);
  const transcriptData = await info.getTranscript();
  const text =
    await transcriptData.transcript.content.body.initial_segments.map(
      (segment) => segment.snippet.text
    );

  res.send({ text });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
