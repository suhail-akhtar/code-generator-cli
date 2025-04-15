# Project-Gen

An AI-powered CLI tool for generating production-ready projects with various LLM backends.

## Overview

Project-Gen is a powerful command-line tool that leverages various Large Language Models (LLMs) to generate, analyze, update, and enhance software projects. It provides a seamless interface for creating production-ready project structures based on natural language requirements.

## Features

- **Multi-LLM Support**: Works with multiple AI providers including Google Gemini, Azure OpenAI, Groq, and Ollama.
- **Project Generation**: Creates complete project structures with all necessary files, dependencies, and configurations.
- **Interactive Mode**: Guides you through project creation and modification with an interactive command-line interface.
- **Project Analysis**: Scans existing projects to identify issues, suggest improvements, and analyze code quality.
- **Compilation Verification**: Automatically checks and fixes compilation errors in generated TypeScript projects.
- **Documentation Generation**: Creates comprehensive documentation including README files and additional documentation.
- **Enhancement Suggestions**: Provides detailed recommendations for features, performance, security, and UI/UX improvements.
- **Incremental Updates**: Allows for modifying existing projects by adding features, fixing bugs, or enhancing specific aspects.

## Installation

```bash
# Install globally
npm install -g project-gen

# Or install locally
npm install project-gen
```

## Configuration

Create a `.env` file in your project directory with your API keys:

```
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro-preview-03-25

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT_ID=your_azure_deployment_id
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Groq
GROQ_API_KEY=your_groq_api_key

# Ollama (local API)
OLLAMA_API_URL=http://localhost:11434

# Default LLM to use
DEFAULT_LLM_PROVIDER=gemini

# Debug mode (set to true for verbose logging)
DEBUG=true
```

## Usage

### Generate a new project

```bash
# Interactive mode
project-gen generate -i

# Using command-line options
project-gen generate -r "Create a Node.js REST API with Express, TypeScript, and MongoDB" -o ./my-api-project
```

### Update an existing project

```bash
# Update an existing project interactively
project-gen update -p ./my-project

# Specify a different LLM
project-gen update -p ./my-project -m azure
```

### Analyze a project

```bash
# Analyze the current directory
project-gen analyze

# Analyze a specific project
project-gen analyze -p ./my-project -m groq
```

### Get enhancement suggestions

```bash
# Generate enhancement suggestions for a project
project-gen enhance -p ./my-project
```

## Interactive Mode

The interactive mode guides you through:

1. Describing your project requirements
2. Selecting an output directory
3. Choosing an LLM provider
4. Making additional changes (adding features, fixing bugs, etc.)
5. Getting enhancement suggestions

## LLM Providers

Project-Gen supports the following LLM providers:

- **Google Gemini**: State-of-the-art model from Google.
- **Azure OpenAI**: Microsoft's Azure-based OpenAI service.
- **Groq**: High-performance LLM with fast inference.
- **Ollama**: Run LLMs locally with Ollama.

## Project Structure

The tool creates a complete project structure with:

- Directory structure based on best practices
- Properly configured package.json with dependencies
- TypeScript configuration
- Source code files with implementation
- Test setup with Jest
- Linting configuration with ESLint
- Documentation files
- Git configuration

## Project Update Capabilities

You can update existing projects by:

- Adding new features
- Fixing bugs
- Enhancing UI/UX
- Improving performance
- Adding security measures

## Output

The tool provides detailed output during execution, including:

- Task progress with Listr
- Color-coded logging with Chalk
- Compilation results
- Analysis reports with issues and suggestions
- Enhancement recommendations in markdown format

## Development

### Build from source

```bash
# Clone the repository
git clone https://github.com/your-username/project-gen.git
cd project-gen

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the compiled code
- `npm run dev`: Run with ts-node for development
- `npm run lint`: Run ESLint
- `npm test`: Run tests with Jest

## Future Enhancements

1. **Additional LLM Support**: Integration with more LLM providers like Anthropic Claude, Mistral, and Cohere.
2. **Template System**: Custom project templates that can be extended with AI.
3. **Plugins Architecture**: Support for plugins to extend functionality.
4. **Web Interface**: A complementary web interface for visual project generation.
5. **Team Collaboration**: Features for collaborative project development.
6. **Version Control Integration**: Better Git integration for project history.
7. **Continuous Updates**: Ability to keep projects updated with latest dependencies and patterns.
8. **Deployment Automation**: Generate deployment configurations for various platforms.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# Project-Gen

An AI-powered CLI tool for generating production-ready projects with various LLM backends.

## Overview

Project-Gen is a powerful command-line tool that leverages various Large Language Models (LLMs) to generate, analyze, update, and enhance software projects. It provides a seamless interface for creating production-ready project structures based on natural language requirements.

## Features

- **Multi-LLM Support**: Works with multiple AI providers including Google Gemini, Azure OpenAI, Groq, and Ollama.
- **Project Generation**: Creates complete project structures with all necessary files, dependencies, and configurations.
- **Interactive Mode**: Guides you through project creation and modification with an interactive command-line interface.
- **Project Analysis**: Scans existing projects to identify issues, suggest improvements, and analyze code quality.
- **Compilation Verification**: Automatically checks and fixes compilation errors in generated TypeScript projects.
- **Documentation Generation**: Creates comprehensive documentation including README files and additional documentation.
- **Enhancement Suggestions**: Provides detailed recommendations for features, performance, security, and UI/UX improvements.
- **Incremental Updates**: Allows for modifying existing projects by adding features, fixing bugs, or enhancing specific aspects.

## Installation

```bash
# Install globally
npm install -g project-gen

# Or install locally
npm install project-gen
```

## Configuration

Create a `.env` file in your project directory with your API keys:

```
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro-preview-03-25

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT_ID=your_azure_deployment_id
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Groq
GROQ_API_KEY=your_groq_api_key

# Ollama (local API)
OLLAMA_API_URL=http://localhost:11434

# Default LLM to use
DEFAULT_LLM_PROVIDER=gemini

# Debug mode (set to true for verbose logging)
DEBUG=true
```

## Usage

### Generate a new project

```bash
# Interactive mode
project-gen generate -i

# Using command-line options
project-gen generate -r "Create a Node.js REST API with Express, TypeScript, and MongoDB" -o ./my-api-project
```

### Update an existing project

```bash
# Update an existing project interactively
project-gen update -p ./my-project

# Specify a different LLM
project-gen update -p ./my-project -m azure
```

### Analyze a project

```bash
# Analyze the current directory
project-gen analyze

# Analyze a specific project
project-gen analyze -p ./my-project -m groq
```

### Get enhancement suggestions

```bash
# Generate enhancement suggestions for a project
project-gen enhance -p ./my-project
```

## Interactive Mode

The interactive mode guides you through:

1. Describing your project requirements
2. Selecting an output directory
3. Choosing an LLM provider
4. Making additional changes (adding features, fixing bugs, etc.)
5. Getting enhancement suggestions

## LLM Providers

Project-Gen supports the following LLM providers:

- **Google Gemini**: State-of-the-art model from Google.
- **Azure OpenAI**: Microsoft's Azure-based OpenAI service.
- **Groq**: High-performance LLM with fast inference.
- **Ollama**: Run LLMs locally with Ollama.

## Project Structure

The tool creates a complete project structure with:

- Directory structure based on best practices
- Properly configured package.json with dependencies
- TypeScript configuration
- Source code files with implementation
- Test setup with Jest
- Linting configuration with ESLint
- Documentation files
- Git configuration

## Project Update Capabilities

You can update existing projects by:

- Adding new features
- Fixing bugs
- Enhancing UI/UX
- Improving performance
- Adding security measures

## Output

The tool provides detailed output during execution, including:

- Task progress with Listr
- Color-coded logging with Chalk
- Compilation results
- Analysis reports with issues and suggestions
- Enhancement recommendations in markdown format

## Development

### Build from source

```bash
# Clone the repository
git clone https://github.com/your-username/project-gen.git
cd project-gen

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the compiled code
- `npm run dev`: Run with ts-node for development
- `npm run lint`: Run ESLint
- `npm test`: Run tests with Jest

## Future Enhancements

1. **Additional LLM Support**: Integration with more LLM providers like Anthropic Claude, Mistral, and Cohere.
2. **Template System**: Custom project templates that can be extended with AI.
3. **Plugins Architecture**: Support for plugins to extend functionality.
4. **Web Interface**: A complementary web interface for visual project generation.
5. **Team Collaboration**: Features for collaborative project development.
6. **Version Control Integration**: Better Git integration for project history.
7. **Continuous Updates**: Ability to keep projects updated with latest dependencies and patterns.
8. **Deployment Automation**: Generate deployment configurations for various platforms.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
