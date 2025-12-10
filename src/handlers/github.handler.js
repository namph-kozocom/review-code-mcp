/**
 * GitHub Handler
 * Handles all GitHub-related operations
 */
export class GitHubHandler {
  constructor(octokit) {
    this.octokit = octokit;
  }

  async listRepos(args) {
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

  async getPR(args) {
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

  async getPRDiff(args) {
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

  async listPRs(args) {
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
}
