# AI Code Review MCP Server

Simple MCP server for GitHub and FileSystem integration with AI agents (Copilot, Claude, etc.)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Test MCP Server
```bash
node src/index.js
```

### 3. Use with Copilot

1. **Restart VS Code** (close and reopen)
2. **Open Copilot Chat** and ask:
   - "List my GitHub repositories"
   - "Show pull requests in owner/repo"
   - "Read README.md file"
   - "List files in current directory"

## 🛠️ Available Tools

### GitHub Tools
- `github_list_repos` - List your repositories
- `github_list_prs` - List pull requests
- `github_get_pr` - Get PR details
- `github_get_pr_diff` - Get PR diff for review

### FileSystem Tools
- `fs_read_file` - Read file contents
- `fs_list_files` - List directory contents
- `fs_search_files` - Search files by pattern

## ⚙️ Configuration

Edit `.mcp/config.json`:
```json
{
  "mcpServers": {
    "ai-code-review": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here",
        "WORKSPACE_PATH": "/path/to/workspace"
      }
    }
  }
}
```

## 📝 Usage Examples

### With Copilot Chat:
- "List my GitHub repositories"
- "Show me PR #123 in owner/repo"
- "Read the package.json file"

### With Other Agents:
The MCP server implements Model Context Protocol, compatible with:
- GitHub Copilot
- Claude Desktop
- Any MCP-compatible AI agent

## 🔒 Security

- GitHub token stored in config (add `.mcp/` to `.gitignore`)
- FileSystem access restricted to workspace path
- Path traversal protection built-in
