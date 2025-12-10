#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';

/**
 * AI Code Review MCP Server
 * Provides GitHub and FileSystem tools for AI agents
 */

class AICodeReviewMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'ai-code-review-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // GitHub client
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    this.octokit = token ? new Octokit({ auth: token }) : null;

    // Workspace path for filesystem operations
    this.workspacePath = process.env.WORKSPACE_PATH || process.cwd();

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // GitHub Tools
        {
          name: 'github_list_repos',
          description: 'List GitHub repositories for authenticated user',
          inputSchema: {
            type: 'object',
            properties: {
              per_page: {
                type: 'number',
                description: 'Number of repos to return (default: 30)',
                default: 30
              }
            }
          }
        },
        {
          name: 'github_get_pr',
          description: 'Get pull request details',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              pr_number: { type: 'number', description: 'Pull request number' }
            },
            required: ['owner', 'repo', 'pr_number']
          }
        },
        {
          name: 'github_get_pr_diff',
          description: 'Get pull request diff for code review',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              pr_number: { type: 'number', description: 'Pull request number' }
            },
            required: ['owner', 'repo', 'pr_number']
          }
        },
        {
          name: 'github_list_prs',
          description: 'List pull requests in a repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              state: { 
                type: 'string', 
                description: 'PR state: open, closed, or all',
                enum: ['open', 'closed', 'all'],
                default: 'open'
              }
            },
            required: ['owner', 'repo']
          }
        },

        // FileSystem Tools
        {
          name: 'fs_read_file',
          description: 'Read file contents from workspace',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path relative to workspace' }
            },
            required: ['path']
          }
        },
        {
          name: 'fs_list_files',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { 
                type: 'string', 
                description: 'Directory path relative to workspace (default: .)',
                default: '.'
              }
            }
          }
        },
        {
          name: 'fs_search_files',
          description: 'Search for files by pattern (e.g., *.js, *.py)',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'Glob pattern (e.g., *.js)' },
              path: { 
                type: 'string', 
                description: 'Directory to search (default: .)',
                default: '.'
              }
            },
            required: ['pattern']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // GitHub Tools
          case 'github_list_repos':
            return await this.githubListRepos(args);
          
          case 'github_get_pr':
            return await this.githubGetPR(args);
          
          case 'github_get_pr_diff':
            return await this.githubGetPRDiff(args);
          
          case 'github_list_prs':
            return await this.githubListPRs(args);

          // FileSystem Tools
          case 'fs_read_file':
            return await this.fsReadFile(args);
          
          case 'fs_list_files':
            return await this.fsListFiles(args);
          
          case 'fs_search_files':
            return await this.fsSearchFiles(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  // GitHub Methods
  async githubListRepos(args) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: args.per_page || 30,
      sort: 'updated'
    });

    const repoList = data.map(repo => 
      `📦 ${repo.full_name} ${repo.private ? '🔒' : '🌍'}\n` +
      `   ${repo.description || 'No description'}\n` +
      `   ⭐ ${repo.stargazers_count} | Language: ${repo.language || 'N/A'}\n` +
      `   ${repo.html_url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${data.length} repositories:\n\n${repoList}`
        }
      ]
    };
  }

  async githubGetPR(args) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const { data: pr } = await this.octokit.pulls.get({
      owner: args.owner,
      repo: args.repo,
      pull_number: args.pr_number
    });

    const info = 
      `🔀 Pull Request #${pr.number}: ${pr.title}\n\n` +
      `Author: @${pr.user.login}\n` +
      `State: ${pr.state}\n` +
      `Created: ${pr.created_at}\n` +
      `Updated: ${pr.updated_at}\n` +
      `Mergeable: ${pr.mergeable}\n` +
      `Comments: ${pr.comments}\n` +
      `Commits: ${pr.commits}\n` +
      `Changed Files: ${pr.changed_files}\n` +
      `Additions: +${pr.additions} | Deletions: -${pr.deletions}\n\n` +
      `Description:\n${pr.body || 'No description'}\n\n` +
      `URL: ${pr.html_url}`;

    return {
      content: [{ type: 'text', text: info }]
    };
  }

  async githubGetPRDiff(args) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const { data: diff } = await this.octokit.pulls.get({
      owner: args.owner,
      repo: args.repo,
      pull_number: args.pr_number,
      mediaType: {
        format: 'diff'
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Pull Request #${args.pr_number} Diff:\n\n${diff}`
        }
      ]
    };
  }

  async githubListPRs(args) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const { data: prs } = await this.octokit.pulls.list({
      owner: args.owner,
      repo: args.repo,
      state: args.state || 'open',
      per_page: 30
    });

    const prList = prs.map(pr => 
      `#${pr.number}: ${pr.title}\n` +
      `   by @${pr.user.login} | ${pr.state}\n` +
      `   ${pr.html_url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${prs.length} pull requests:\n\n${prList || 'No pull requests found'}`
        }
      ]
    };
  }

  // FileSystem Methods
  validatePath(filePath) {
    const fullPath = path.resolve(this.workspacePath, filePath);
    if (!fullPath.startsWith(this.workspacePath)) {
      throw new Error('Access denied: path outside workspace');
    }
    return fullPath;
  }

  async fsReadFile(args) {
    const fullPath = this.validatePath(args.path);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `File: ${args.path}\n\n${content}`
        }
      ]
    };
  }

  async fsListFiles(args) {
    const fullPath = this.validatePath(args.path || '.');
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    
    const fileList = files.map(file => 
      `${file.isDirectory() ? '📁' : '📄'} ${file.name}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Files in ${args.path || '.'}:\n\n${fileList}`
        }
      ]
    };
  }

  async fsSearchFiles(args) {
    const fullPath = this.validatePath(args.path || '.');
    const pattern = args.pattern;
    
    // Simple pattern matching (e.g., *.js)
    const regex = new RegExp(pattern.replace('*', '.*'));
    const files = await fs.readdir(fullPath, { recursive: true, withFileTypes: true });
    
    const matches = files
      .filter(file => !file.isDirectory() && regex.test(file.name))
      .map(file => `📄 ${path.join(file.path, file.name).replace(this.workspacePath, '')}`);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${matches.length} files matching "${pattern}":\n\n${matches.join('\n') || 'No files found'}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Code Review MCP Server running on stdio');
  }
}

// Start server
const server = new AICodeReviewMCP();
server.run().catch(console.error);
