import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FolderIcon, CodeBracketIcon, MagnifyingGlassIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import type { ProjectType, ProjectForm, EnvSettings } from '../types';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentProject, setCurrentProject] = useState<ProjectForm>({
    type: 'generate',
    requirements: '',
    outputDir: './generated-project',
    model: 'gemini'
  });
  const [envSettings, setEnvSettings] = useState<EnvSettings>({
    GEMINI_API_KEY: '',
    AZURE_OPENAI_API_KEY: '',
    AZURE_OPENAI_ENDPOINT: '',
    AZURE_OPENAI_DEPLOYMENT_ID: '',
    GROQ_API_KEY: '',
    OLLAMA_API_URL: 'http://localhost:11434',
    DEFAULT_LLM_PROVIDER: 'gemini',
    DEBUG: 'false'
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
    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting project processing...');

    try {
      // First update environment settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envSettings)
      });

      // Then process the project
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
      
      // Update progress and status
      setProgress(100);
      setStatus('Project processed successfully!');
      setIsProcessing(false);
      setIsOpen(true);
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error processing project');
      setIsProcessing(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envSettings)
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Project Generator</h1>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Settings
          </button>
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

                {isProcessing && (
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                            {status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                        <div
                          style={{ width: `${progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Process Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg rounded bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Environment Settings</Dialog.Title>
            <div className="space-y-4">
              {Object.entries(envSettings).map(([key, value]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                    {key}
                  </label>
                  <input
                    type={key.includes('KEY') ? 'password' : 'text'}
                    id={key}
                    name={key}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={value}
                    onChange={(e) => setEnvSettings({ ...envSettings, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  onClick={handleSettingsSave}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Success Dialog */}
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