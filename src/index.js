#!/usr/bin/env node

import { AICodeReviewMCP } from './server.js';

/**
 * Entry point for AI Code Review MCP Server
 */
const server = new AICodeReviewMCP();
server.run().catch(console.error);
