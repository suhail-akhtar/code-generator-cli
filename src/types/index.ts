/**
 * Project plan generated from requirements
 */
export interface ProjectPlan {
    projectName: string;
    description: string;
    technologies: string[];
    architecture: string;
    components: {
      name: string;
      description: string;
      responsibilities: string[];
    }[];
    dataModels: {
      name: string;
      fields: {
        name: string;
        type: string;
        description: string;
      }[];
    }[];
  }
  
  /**
   * Project file with path and content
   */
  export interface ProjectFile {
    path: string;
    content: string;
  }
  
  /**
   * Project structure with directories, files, and dependencies
   */
  export interface ProjectStructure {
    directories: string[];
    files: ProjectFile[];
    dependencies: {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
  }
  
  /**
   * Documentation generated for a project
   */
  export interface Documentation {
    readme: string;
    additional: ProjectFile[];
  }
  
  /**
   * Project analysis results
   */
  export interface ProjectAnalysis {
    issues: string[];
    suggestions: string[];
  }
  
  /**
   * Compilation results
   */
  export interface CompilationResult {
    success: boolean;
    errors?: string[];
    output?: string;
  }
  
  /**
   * LLM provider types
   */
  export type LLMProvider = 'gemini' | 'azure' | 'groq' | 'ollama';
  
  /**
   * Project generator options
   */
  export interface ProjectGeneratorOptions {
    requirements: string;
    outputDir: string;
    modelName: string;
    isUpdate?: boolean;
  }