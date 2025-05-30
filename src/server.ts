import express from 'express';
import type { Request, Response } from 'express';
import type { ProjectForm } from './types';

const app = express();
app.use(express.json());

app.post('/api/project', async (req: Request<{}, {}, ProjectForm>, res: Response) => {
  try {
    const projectData = req.body;
    
    // Log the received project data
    console.log('Received project request:', projectData);
    
    // Mock successful response for now
    // In a real implementation, this would integrate with the existing service files
    res.json({
      success: true,
      message: 'Project request received',
      data: projectData
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