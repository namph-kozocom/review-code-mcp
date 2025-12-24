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

    if (!token) {
      console.error('[MCP Server] Warning: GITHUB_PERSONAL_ACCESS_TOKEN not set. GitHub tools will not work.');
    }

    // Initialize handlers
    const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
    console.error(`[MCP Server] Workspace path: ${workspacePath}`);

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
        console.error(`[MCP Server] Calling tool: ${name}`, JSON.stringify(args, null, 2));
        const result = await this.handleToolCall(name, args);
        console.error(`[MCP Server] Tool ${name} completed successfully`);
        return result;
      } catch (error) {
        console.error(`[MCP Server] Error in tool ${name}:`, error.message);
        console.error(error.stack);
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
      case 'github_get_pr':
        return await this.githubHandler.getPR(args);

      case 'github_list_prs':
        return await this.githubHandler.listPRs(args);
      
      case 'github_create_review':
        return await this.githubHandler.createReview(args);

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
