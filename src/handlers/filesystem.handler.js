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
    // Resolve to absolute path first
    const fullPath = path.resolve(this.workspacePath, filePath);

    // Normalize to handle .., ., etc
    const normalizedPath = path.normalize(fullPath);

    // Check if the normalized path is still within workspace
    if (!normalizedPath.startsWith(path.normalize(this.workspacePath))) {
      throw new Error('Access denied: path outside workspace');
    }

    return normalizedPath;
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
    
    // Convert glob pattern to regex (support **, *, ?)
    const regexPattern = pattern
      .replace(/\*\*/g, '§§') // Temporary replace **
      .replace(/\*/g, '[^/]*') // * matches anything except /
      .replace(/§§/g, '.*')    // ** matches everything including /
      .replace(/\?/g, '.');    // ? matches single char

    const regex = new RegExp(`^${regexPattern}$`);
    const files = await fs.readdir(fullPath, { recursive: true, withFileTypes: true });
    
    const matches = files
      .filter(file => !file.isDirectory())
      .map(file => {
        const relativePath = path.join(file.path, file.name).replace(this.workspacePath + path.sep, '');
        return { matched: regex.test(relativePath), path: relativePath };
      })
      .filter(item => item.matched)
      .map(item => `📄 ${item.path}`);

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
