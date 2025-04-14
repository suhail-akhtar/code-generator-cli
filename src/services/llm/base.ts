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
      // First try to parse directly if it's already valid JSON
      try {
        return JSON.parse(text);
      } catch (directParseError) {
        // If direct parsing fails, try to extract JSON from the response
      }

      // Check for JSON code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) || 
                        text.match(/{[\s\S]*?}/);
                        
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
          // First try to parse it directly
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            // If that fails, attempt to fix common JSON issues
            const fixedJson = this.attemptToFixJson(jsonStr);
            return JSON.parse(fixedJson);
          }
        } catch (innerError) {
          logger.error('Failed to parse extracted JSON', innerError);
          throw new Error(`Failed to parse JSON from LLM response: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
        }
      }
      
      // If no JSON block found, try to fix and parse the entire text
      const fixedJson = this.attemptToFixJson(text);
      return JSON.parse(fixedJson);
    } catch (e) {
      logger.error('JSON parsing error:', e instanceof Error ? e.message : 'Unknown error');
      logger.debug('Problematic text (first 200 chars):', text.substring(0, 200));
      
      // As a last resort, try to extract any valid JSON object or array
      try {
        const matches = text.match(/{[^{}]*}|\\[[^\\[\\]]*\\]/g);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            try {
              return JSON.parse(match);
            } catch {
              // Continue to next match
            }
          }
        }
      } catch {
        // Ignore extraction errors
      }
      
      throw new Error(`Failed to parse JSON from LLM response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  private attemptToFixJson(text: string): string {
    // Remove any non-JSON text before the first { or [
    let fixed = text.replace(/^[^{\\[]*/, '');
    
    // Remove any non-JSON text after the last } or ]
    fixed = fixed.replace(/[^}\\]]*$/, '');
    
    // Fix unescaped quotes in JSON strings
    fixed = fixed.replace(/(?<!\\)"(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, '\\"');
    
    // Fix trailing commas in arrays and objects
    fixed = fixed.replace(/,\s*([}\\]])/g, '$1');
    
    // Fix missing commas between array elements
    fixed = fixed.replace(/]\s*\[/g, '], [');
    
    // Add missing quotes around property names
    fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
    
    return fixed;
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