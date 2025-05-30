export type ProjectType = 'generate' | 'update' | 'analyze' | 'enhance';

export interface ProjectForm {
  type: ProjectType;
  requirements: string;
  outputDir: string;
  model: string;
}

export interface EnvSettings {
  GEMINI_API_KEY?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_DEPLOYMENT_ID?: string;
  GROQ_API_KEY?: string;
  OLLAMA_API_URL?: string;
  DEFAULT_LLM_PROVIDER?: string;
  DEBUG?: string;
}

export interface ProjectResponse {
  success: boolean;
  message: string;
  data?: any;
  progress?: number;
  status?: string;
}