import { ProjectPlan } from '../types';

/**
 * Templates for common project files
 */
export class Templates {
  /**
   * Generate a README template
   * @param plan Project plan
   * @returns README content
   */
  static generateReadme(plan: ProjectPlan): string {
    return `# ${plan.projectName}

${plan.description}

## Technologies

${plan.technologies.map(tech => `- ${tech}`).join('\n')}

## Architecture

${plan.architecture}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Building

\`\`\`bash
npm run build
\`\`\`

## License

MIT
`;
  }

  /**
   * Generate a package.json template
   * @param plan Project plan
   * @returns package.json content
   */
  static generatePackageJson(plan: ProjectPlan): string {
    return JSON.stringify(
      {
        name: plan.projectName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: plan.description,
        main: 'dist/index.js',
        scripts: {
          start: 'node dist/index.js',
          dev: 'ts-node src/index.ts',
          build: 'tsc',
          test: 'jest',
          lint: 'eslint . --ext .ts'
        },
        keywords: plan.technologies.map(tech => tech.toLowerCase()),
        author: '',
        license: 'MIT',
        dependencies: {},
        devDependencies: {
          '@types/jest': '^29.5.5',
          '@types/node': '^20.8.2',
          '@typescript-eslint/eslint-plugin': '^6.7.4',
          '@typescript-eslint/parser': '^6.7.4',
          'eslint': '^8.50.0',
          'jest': '^29.7.0',
          'ts-jest': '^29.1.1',
          'ts-node': '^10.9.1',
          'typescript': '^5.2.2'
        }
      },
      null,
      2
    );
  }

  /**
   * Generate a tsconfig.json template
   * @returns tsconfig.json content
   */
  static generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: 'dist',
          rootDir: 'src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: true,
          sourceMap: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', '**/*.spec.ts', 'dist']
      },
      null,
      2
    );
  }

  /**
   * Generate a Jest config template
   * @returns jest.config.js content
   */
  static generateJestConfig(): string {
    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
`;
  }

  /**
   * Generate an ESLint config template
   * @returns .eslintrc.js content
   */
  static generateEslintConfig(): string {
    return `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Custom rules
  },
};
`;
  }

  /**
   * Generate a .gitignore template
   * @returns .gitignore content
   */
  static generateGitignore(): string {
    return `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Log files
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
.DS_Store
Thumbs.db

# Test coverage
coverage/
`;
  }
}