import fs from 'fs/promises';
import path from 'path';

/**
 * FileSystem Handler
 * Handles all filesystem-related operations
 */
export class FileSystemHandler {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
  }

  validatePath(filePath) {
    const fullPath = path.resolve(this.workspacePath, filePath);
    if (!fullPath.startsWith(this.workspacePath)) {
      throw new Error('Access denied: path outside workspace');
    }
    return fullPath;
  }

  async readFile(args) {
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

  async listFiles(args) {
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

  async searchFiles(args) {
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
}
