import { ProjectStructure, ProjectFile, ProjectPlan, Documentation } from '../../types';
import { logger } from '../../utils/logger';

export abstract class BaseLLMService {
  constructor(protected apiKey: string) {
    if (!apiKey && this.constructor.name !== 'OllamaService') {
      throw new Error(`API key is required for ${this.constructor.name}`);
    }
  }

  abstract generateProjectPlan(requirements: string): Promise<ProjectPlan>;
  
  abstract generateProjectStructure(plan: ProjectPlan): Promise<ProjectStructure>;
  
  abstract fixCompilationErrors(
    errors: string[],
    projectStructure: ProjectStructure
  ): Promise<ProjectFile[]>;
  
  abstract generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation>;
  
  abstract generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string>;
  
  abstract scanProject(projectPath: string): Promise<{
    issues: string[];
    suggestions: string[];
  }>;
  
  protected parseJsonFromText(text: string): any {
    try {
      // First remove any non-JSON prefix if present
      let cleanedText = text.trim();
      // Find the first { or [ character to start valid JSON
      const firstBracePos = cleanedText.indexOf('{');
      const firstBracketPos = cleanedText.indexOf('[');
      
      let startPos = -1;
      if (firstBracePos >= 0 && firstBracketPos >= 0) {
        startPos = Math.min(firstBracePos, firstBracketPos);
      } else if (firstBracePos >= 0) {
        startPos = firstBracePos;
      } else if (firstBracketPos >= 0) {
        startPos = firstBracketPos;
      }
      
      if (startPos > 0) {
        cleanedText = cleanedText.substring(startPos);
      }
      
      logger.debug(`Attempting to parse JSON (first 100 chars): ${cleanedText.substring(0, 100)}`);
      
      // First try to parse directly
      try {
        return JSON.parse(cleanedText);
      } catch (directParseError) {
        logger.debug('Direct JSON parsing failed, trying extraction methods');
      }

      // Extract JSON from code blocks
      const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const match = cleanedText.match(jsonCodeBlockRegex);
      
      if (match && match[1]) {
        try {
          logger.debug(`Found code block, attempting to parse (first 100 chars): ${match[1].substring(0, 100)}`);
          return JSON.parse(match[1]);
        } catch (codeBlockError) {
          logger.debug('Code block parsing failed, attempting to fix JSON');
          try {
            const fixedJson = this.attemptToFixJson(match[1]);
            return JSON.parse(fixedJson);
          } catch (fixError) {
            logger.debug('Fixed JSON parsing still failed, continuing with other methods');
          }
        }
      }
      
      // Try to fix the entire text
      try {
        const fixedFullText = this.attemptToFixJson(cleanedText);
        return JSON.parse(fixedFullText);
      } catch (fullFixError) {
        logger.debug('Full text fixing failed, trying to extract JSON objects/arrays');
      }
      
      // Fallback: Try to find and extract valid JSON objects
      try {
        // Find the outermost complete JSON object
        let braceCount = 0;
        let startIndex = cleanedText.indexOf('{');
        
        if (startIndex >= 0) {
          for (let i = startIndex; i < cleanedText.length; i++) {
            if (cleanedText[i] === '{') braceCount++;
            else if (cleanedText[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                // Extract the complete JSON object
                const jsonObject = cleanedText.substring(startIndex, i + 1);
                try {
                  return JSON.parse(jsonObject);
                } catch (e) {
                  // If parsing fails, try fixing this extracted object
                  try {
                    const fixedObject = this.attemptToFixJson(jsonObject);
                    return JSON.parse(fixedObject);
                  } catch (fixError) {
                    // Continue to next method if this fails
                  }
                }
                break;
              }
            }
          }
        }
      } catch (extractionError) {
        logger.debug('JSON object extraction failed');
      }
    } catch (e) {
      logger.error('All JSON parsing methods failed:', e);
    }
    
    // If all parsing attempts fail, return appropriate default structure
    logger.warn('JSON parsing completely failed, returning default structure');
    
    // Determine what type of structure to return based on context
    if (text.includes('projectName') || text.includes('description')) {
      return this.getDefaultProjectPlan();
    } else if (text.includes('directories') || text.includes('files')) {
      return this.getDefaultProjectStructure();
    } else if (text.includes('readme')) {
      return this.getDefaultDocumentation();
    } else if (text.includes('issues') || text.includes('suggestions')) {
      return {
        issues: [],
        suggestions: []
      };
    } else {
      // Default to project structure if we can't determine type
      return this.getDefaultProjectStructure();
    }
  }
  
  private getDefaultProjectPlan(): ProjectPlan {
    return {
      projectName: "Generated Project",
      description: "A project generated with AI assistance",
      technologies: ["JavaScript", "React", "HTML", "CSS"],
      architecture: "Client-Side Application",
      components: [
        {
          name: "App",
          description: "Main application component",
          responsibilities: ["Manage application state", "Render UI components"]
        }
      ],
      dataModels: [
        {
          name: "Item",
          fields: [
            {
              name: "id",
              type: "string",
              description: "Unique identifier"
            },
            {
              name: "title",
              type: "string",
              description: "Item title"
            }
          ]
        }
      ]
    };
  }
  
  private getDefaultProjectStructure(): ProjectStructure {
    return {
      directories: ["src", "public", "src/components"],
      files: [
        {
          path: "README.md",
          content: "# Generated Project\n\nThis project was generated with AI assistance."
        },
        {
          path: "package.json",
          content: JSON.stringify({
            name: "generated-project",
            version: "0.1.0",
            private: true,
            dependencies: {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1"
            },
            scripts: {
              "start": "react-scripts start",
              "build": "react-scripts build",
              "test": "react-scripts test",
              "eject": "react-scripts eject"
            },
            eslintConfig: {
              "extends": ["react-app"]
            },
            browserslist: {
              "production": [">0.2%", "not dead", "not op_mini all"],
              "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
            }
          }, null, 2)
        },
        {
          path: "public/index.html",
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated Project</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
        },
        {
          path: "src/index.js",
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
        },
        {
          path: "src/App.js",
          content: `import React, { useState } from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Generated Project</h1>
      </header>
    </div>
  );
}

export default App;`
        }
      ],
      dependencies: {
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1"
        },
        devDependencies: {}
      }
    };
  }
  
  private getDefaultDocumentation(): Documentation {
    return {
      readme: `# Generated Project

## Overview
This project was generated with AI assistance.

## Installation
\`\`\`
npm install
\`\`\`

## Usage
\`\`\`
npm start
\`\`\``,
      additional: []
    };
  }
  
  private attemptToFixJson(text: string): string {
    try {
      // Remove any leading/trailing non-JSON text
      let fixed = text.replace(/^[^{[\r\n]*/, '').replace(/[^}\]]*$/, '');
      
      // Fix common JSON syntax issues
      
      // Replace single quotes with double quotes
      fixed = fixed.replace(/(\w+)'(\w+)/g, '$1\\"$2'); // Preserve contractions
      fixed = fixed.replace(/'/g, '"');
      
      // Fix unescaped quotes in strings
      fixed = fixed.replace(/(?<!\\)"(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, '\\"');
      
      // Fix missing commas
      fixed = fixed.replace(/}(\s*){/g, '},\n$1{');
      fixed = fixed.replace(/](\s*)\[/g, '],\n$1[');
      
      // Fix trailing commas
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Add missing quotes around property names
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');
      
      // Check balanced braces and brackets
      let braceCount = 0;
      let bracketCount = 0;
      
      for (const char of fixed) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
      }
      
      // Close any unclosed braces or brackets
      while (braceCount > 0) {
        fixed += '}';
        braceCount--;
      }
      
      while (bracketCount > 0) {
        fixed += ']';
        bracketCount--;
      }
      
      // Remove any extra closing braces or brackets
      while (braceCount < 0 && fixed.endsWith('}')) {
        fixed = fixed.substring(0, fixed.length - 1);
        braceCount++;
      }
      
      while (bracketCount < 0 && fixed.endsWith(']')) {
        fixed = fixed.substring(0, fixed.length - 1);
        bracketCount++;
      }
      
      return fixed;
    } catch (e) {
      logger.error('Error while fixing JSON:', e);
      throw e;
    }
  }
  
  /**
   * Enhances LLM prompts based on the operation type
   * @param prompt Original prompt
   * @param operationType Type of operation (add, update, fix, etc.)
   * @returns Enhanced prompt
   */
  protected enhancePrompt(prompt: string, operationType: string): string {
    const promptPrefix = {
      add: "Add new functionality while preserving existing code:",
      update: "Update the following components while preserving the rest:",
      fix: "Fix issues in the following components:",
      enhance: "Enhance the following components:"
    }[operationType] || "Modify the following:";
    
    return `${promptPrefix}\n\n${prompt}\n\nIMPORTANT: Focus only on the required changes. Maintain compatibility with existing code.`;
  }
}