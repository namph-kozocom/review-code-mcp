/**
 * FileSystem Tools Schema Definitions
 */
export const filesystemTools = [
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
];
