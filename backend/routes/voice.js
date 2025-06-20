import dotenv from 'dotenv';
// const multer = require('multer');
// const fs = require('fs');
// const { createClient } = require('@deepgram/sdk');
import express from 'express';
import multer from 'multer'
import fs from 'fs'
import { createClient } from '@deepgram/sdk'
dotenv.config();
const upload = multer({ dest: 'uploads/' });
const router = express.Router();


const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post('/STT', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    const audio = fs.readFileSync(req.file.path);
    try {
        const response = await deepgram.listen.prerecorded.transcribeFile(
            audio,
            {
                mimetype: req.file.mimetype,
                model: 'nova',
                smart_format: true,
                language: 'en-US'
            }
        );

        // const transcript = response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "No transcript found";
        // const transcript =
        //     response?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript?.trim() ||
        //     response?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ||
        //     "No transcript found";

        // res.json(transcript);


        const transcript =
            response?.result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript?.trim() ||
            response?.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ||
            "No transcript found";

        res.json({transcript});
        // res.json(response)
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

router.get('/TTS',async (req,res)=>{
    // const { text } = req.query||"congrats!, your appointment has been scheduled with doctor" // input the text
const text = "Congrats! Your appointment has been scheduled with the doctor.";

  if (!text) {
    return res.status(400).json({ error: "Text query param is required" });
  }

  try {
    const voiceId = process.env.VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1", 
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("TTS API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

export default router