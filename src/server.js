import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { GitHubHandler } from './handlers/github.handler.js';
import { FileSystemHandler } from './handlers/filesystem.handler.js';
import { githubTools } from './tools/github.tools.js';
import { filesystemTools } from './tools/filesystem.tools.js';

/**
 * AI Code Review MCP Server
 * Provides GitHub and FileSystem tools for AI agents
 */
export class AICodeReviewMCP {
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

    // Initialize GitHub client
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const octokit = token ? new Octokit({ auth: token }) : null;

    // Initialize handlers
    const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
    this.githubHandler = new GitHubHandler(octokit);
    this.filesystemHandler = new FileSystemHandler(workspacePath);

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...githubTools, ...filesystemTools]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await this.handleToolCall(name, args);
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

  async handleToolCall(name, args) {
    switch (name) {
      // GitHub Tools
      case 'github_list_repos':
        return await this.githubHandler.listRepos(args);
      
      case 'github_get_pr':
        return await this.githubHandler.getPR(args);
      
      case 'github_get_pr_diff':
        return await this.githubHandler.getPRDiff(args);
      
      case 'github_list_prs':
        return await this.githubHandler.listPRs(args);

      // FileSystem Tools
      case 'fs_read_file':
        return await this.filesystemHandler.readFile(args);
      
      case 'fs_list_files':
        return await this.filesystemHandler.listFiles(args);
      
      case 'fs_search_files':
        return await this.filesystemHandler.searchFiles(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Code Review MCP Server running on stdio');
  }
}
