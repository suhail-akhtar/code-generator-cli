import { BaseLLMService } from './base';
import { GeminiService } from './gemini';
import { AzureService } from './azure';
import { GroqService } from './groq';
import { OllamaService } from './ollama';
import { logger } from '../../utils/logger';

export class LLMServiceFactory {
  static createService(modelName: string): BaseLLMService {
    const apiKeys: Record<string, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      azure: process.env.AZURE_OPENAI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      ollama: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    };

    const apiKey = apiKeys[modelName];
    
    if (!apiKey && modelName !== 'ollama') {
      throw new Error(`API key for ${modelName} not found in environment variables`);
    }
    
    switch (modelName) {
      case 'gemini':
        logger.info('Using Google Gemini model');
        return new GeminiService(apiKey!);
      case 'azure':
        logger.info('Using Azure OpenAI model');
        return new AzureService(apiKey!);
      case 'groq':
        logger.info('Using Groq model');
        return new GroqService(apiKey!);
      case 'ollama':
        logger.info('Using Ollama model');
        return new OllamaService(apiKey || 'http://localhost:11434');
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }
}