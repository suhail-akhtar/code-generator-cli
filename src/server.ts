import express from 'express';
import type { Request, Response } from 'express';
import type { ProjectForm, EnvSettings } from './types';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(express.json());

let envSettings: EnvSettings = {};

app.post('/api/settings', async (req: Request<{}, {}, EnvSettings>, res: Response) => {
  try {
    envSettings = req.body;
    
    // Write settings to .env file
    const envContent = Object.entries(envSettings)
      .filter(([_, value]) => value) // Only include non-empty values
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await fs.writeFile('.env', envContent);
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

app.post('/api/project', async (req: Request<{}, {}, ProjectForm>, res: Response) => {
  try {
    const projectData = req.body;
    console.log('Received project request:', projectData);
    
    // Simulate progress updates
    const steps = ['Analyzing requirements', 'Generating files', 'Installing dependencies', 'Running tests'];
    let progress = 0;
    
    for (const step of steps) {
      // Update progress
      progress += 25;
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send progress update
      res.write(`data: ${JSON.stringify({ progress, status: step })}\n\n`);
    }
    
    res.json({
      success: true,
      message: 'Project processed successfully',
      data: projectData,
      progress: 100,
      status: 'Complete'
    });
  } catch (error) {
    console.error('Error processing project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process project request'
    });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});