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
export default router