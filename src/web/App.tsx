import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FolderIcon, CodeBracketIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';

type ProjectType = 'generate' | 'update' | 'analyze' | 'enhance';

interface ProjectForm {
  type: ProjectType;
  requirements: string;
  outputDir: string;
  model: string;
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectForm>({
    type: 'generate',
    requirements: '',
    outputDir: './generated-project',
    model: 'gemini'
  });

  const models = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'azure', name: 'Azure OpenAI' },
    { id: 'groq', name: 'Groq' },
    { id: 'ollama', name: 'Ollama' }
  ];

  const projectTypes = [
    { id: 'generate', name: 'Generate Project', icon: CodeBracketIcon },
    { id: 'update', name: 'Update Project', icon: FolderIcon },
    { id: 'analyze', name: 'Analyze Project', icon: MagnifyingGlassIcon },
    { id: 'enhance', name: 'Enhance Project', icon: SparklesIcon }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentProject)
      });
      
      if (!response.ok) {
        throw new Error('Failed to process request');
      }
      
      const result = await response.json();
      console.log('Project processed:', result);
      setIsOpen(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Generator</h1>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCurrentProject({ ...currentProject, type: type.id as ProjectType })}
                    className={`relative rounded-lg p-4 flex flex-col items-center text-center hover:bg-gray-50 focus:outline-none ${
                      currentProject.type === type.id ? 'ring-2 ring-indigo-500' : 'border'
                    }`}
                  >
                    <type.icon className="h-10 w-10 text-gray-600" />
                    <span className="mt-2 text-sm font-medium text-gray-900">{type.name}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                    Project Requirements
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentProject.requirements}
                    onChange={(e) => setCurrentProject({ ...currentProject, requirements: e.target.value })}
                    placeholder="Describe your project requirements..."
                  />
                </div>

                <div>
                  <label htmlFor="outputDir" className="block text-sm font-medium text-gray-700">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    id="outputDir"
                    name="outputDir"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentProject.outputDir}
                    onChange={(e) => setCurrentProject({ ...currentProject, outputDir: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    AI Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentProject.model}
                    onChange={(e) => setCurrentProject({ ...currentProject, model: e.target.value })}
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Process Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">Project Processed</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Your project has been processed successfully. Check the output directory for the generated files.
            </Dialog.Description>
            <button
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}