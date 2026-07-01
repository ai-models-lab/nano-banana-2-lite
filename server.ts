/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  const apiKey = process.env.GEMINI_API_KEY;

  // Lazy initialize the client if API Key is present
  const getGeminiClient = () => {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please add your key in the Secrets panel in AI Studio.');
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Image generation endpoint
  app.post('/api/generate', async (req, res) => {
    const { prompt, model, aspectRatio, imageSize } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const ai = getGeminiClient();
      const startTime = Date.now();

      // Configure correct model and settings
      // 'gemini-3.1-flash-lite-image' is the default Nano Banana 2 Lite
      const targetModel = model || 'gemini-3.1-flash-lite-image';
      
      const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
        }
      };

      // Add imageSize only for compatible models
      if (imageSize && (targetModel === 'gemini-3.1-flash-image' || targetModel === 'gemini-3-pro-image')) {
        config.imageConfig.imageSize = imageSize;
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [{ text: prompt }],
        },
        config: config
      });

      const latencyMs = Date.now() - startTime;
      let base64Image = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Image) {
        // Fallback: search if we got text instead of image
        const textParts = response.candidates?.[0]?.content?.parts
          ?.filter(p => p.text)
          ?.map(p => p.text)
          ?.join('\n') || '';
        
        return res.status(500).json({ 
          error: 'Model did not return any image data.',
          details: textParts || 'No content parsed.'
        });
      }

      // Successful generation details
      return res.json({
        imageUrl: `data:image/png;base64,${base64Image}`,
        latencyMs,
        model: targetModel,
        aspectRatio: aspectRatio || '1:1',
        costEstimate: targetModel === 'gemini-3.1-flash-lite-image' ? 0.000034 : 0.003, // cost per image approximate
      });

    } catch (error: any) {
      console.error('Error in /api/generate:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to generate image',
        details: error.toString() 
      });
    }
  });

  // Image editing/variation/inpainting endpoint
  app.post('/api/edit', async (req, res) => {
    const { imageBase64, prompt, model } = req.body;

    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'Image base64 and prompt are required' });
    }

    try {
      const ai = getGeminiClient();
      const startTime = Date.now();

      const targetModel = model || 'gemini-3.1-flash-lite-image';

      // Extract raw base64 and mime type
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      let data = imageBase64;
      let mimeType = 'image/png';
      if (match) {
        mimeType = match[1];
        data = match[2];
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            {
              inlineData: {
                data: data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      const latencyMs = Date.now() - startTime;
      let base64Image = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Image) {
        const textParts = response.candidates?.[0]?.content?.parts
          ?.filter(p => p.text)
          ?.map(p => p.text)
          ?.join('\n') || '';

        return res.status(500).json({ 
          error: 'Model did not return any image data during edit.',
          details: textParts || 'No content parsed.'
        });
      }

      return res.json({
        imageUrl: `data:image/png;base64,${base64Image}`,
        latencyMs,
        model: targetModel,
      });

    } catch (error: any) {
      console.error('Error in /api/edit:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to edit image',
        details: error.toString() 
      });
    }
  });

  // Check backend configuration
  app.get('/api/config-check', (req, res) => {
    res.json({
      hasApiKey: !!apiKey,
    });
  });

  // Setup Vite Dev server or serve built assets
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.log('Starting Vite in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving built production assets...');
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
