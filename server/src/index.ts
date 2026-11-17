import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
  res.send("Hello! This is MotoTrack Developer!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
