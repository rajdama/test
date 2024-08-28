import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Innertube } from "youtubei.js/web";

const app = express();
const port = 5000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

let youtube;

(async () => {
  try {
    youtube = await Innertube.create({
      lang: "en",
      location: "US",
      retrieve_player: false,
    });
  } catch (error) {
    console.error("Failed to initialize YouTube API:", error);
    process.exit(1); // Exit the process if initialization fails
  }
})();

app.post("/", async (req, res) => {
  try {
    const videoUrl = req.body.url;
    if (!videoUrl) {
      return res.status(400).send({ error: "Video URL is required." });
    }

    // Extract the video ID from the URL
    const videoId = new URL(videoUrl).searchParams.get("v");
    if (!videoId) {
      return res.status(400).send({ error: "Invalid Video URL." });
    }
    const titleInfo = await youtube.getBasicInfo(videoId);
    let title = titleInfo.basic_info.title;
    const info = await youtube.getInfo(videoId);
    console.log("info",info.primary_info)
    console.log("info2",info.primary_info.title.text)
    console.log("info3",info["primary_info"]["title"]["text"])
    
    const transcriptData = await info.getTranscript();

    // Fallback if transcript data is not available
    if (
      !transcriptData ||
      !transcriptData.transcript ||
      !transcriptData.transcript.content ||
      !transcriptData.transcript.content.body ||
      !transcriptData.transcript.content.body.initial_segments
    ) {
      return res
        .status(404)
        .send({ error: "Transcript not found or incomplete." });
    }

    const lines = transcriptData.transcript.content.body.initial_segments.map(
      (segment) => segment.snippet.text
    );

    const text = lines.join(" ");

    // Send the title and transcript text in the response
    res.send({ title, text });
  } catch (error) {
    console.error("Error fetching transcript:", error);

    // Handle specific error related to ClientSideToggleMenuItem
    if (error.message.includes("ClientSideToggleMenuItem")) {
      return res.status(500).send({
        error:
          "A known issue occurred with the YouTube parser. Please try again later.",
      });
    }

    // General error handling
    res
      .status(500)
      .send({ error: "Failed to fetch transcript. Please try again later." });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
