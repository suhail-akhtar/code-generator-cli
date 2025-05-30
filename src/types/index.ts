export type ProjectType = 'generate' | 'update' | 'analyze' | 'enhance';

export interface ProjectForm {
  type: ProjectType;
  requirements: string;
  outputDir: string;
  model: string;
}