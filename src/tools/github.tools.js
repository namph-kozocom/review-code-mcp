/**
 * GitHub Tools Schema Definitions
 */
export const githubTools = [
  {
    name: 'github_get_pr',
    description: 'Get pull request details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pr_number: { type: 'number', description: 'Pull request number' },
        include_diff: { type: 'boolean', description: 'Include diff content', default: false }
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
  {
    name: 'github_create_review',
    description: 'Create a review on a pull request with optional line comments',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pr_number: { type: 'number', description: 'Pull request number' },
        body: { type: 'string', description: 'Review summary comment' },
        event: { 
          type: 'string', 
          description: 'Review event type',
          enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'],
          default: 'COMMENT'
        },
        comments: {
          type: 'array',
          description: 'Optional line-by-line comments',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              line: { type: 'number', description: 'Line number in the diff' },
              body: { type: 'string', description: 'Comment text' },
              side: { 
                type: 'string', 
                description: 'Side of diff (LEFT for old, RIGHT for new)',
                enum: ['LEFT', 'RIGHT'],
                default: 'RIGHT'
              },
              start_line: { type: 'number', description: 'Start line for multi-line comments' },
              start_side: {
                type: 'string',
                description: 'Side of diff for start line (LEFT for old, RIGHT for new)',
                enum: ['LEFT', 'RIGHT'],
                default: 'RIGHT'
              }
            },
            required: ['path', 'line', 'body']
          }
        }
      },
      required: ['owner', 'repo', 'pr_number', 'body']
    }
  }
];
