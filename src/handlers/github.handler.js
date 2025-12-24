/**
 * GitHub Handler
 * Handles all GitHub-related operations
 */
export class GitHubHandler {
  constructor(octokit) {
    this.octokit = octokit;
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

    let diffText = '';

    if (args.include_diff) {
      const { data: diff } = await this.octokit.pulls.get({
        owner: args.owner,
        repo: args.repo,
        pull_number: args.pr_number,
        mediaType: {
          format: 'diff'
        }
      });
      diffText = `${diff}`;
    }

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
      `URL: ${pr.html_url}\n\n` +
      `Diff: \n${diffText}`;

    return {
      content: [{ type: 'text', text: info }]
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

  async createReview(args) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const { owner, repo, pr_number, body, event, comments } = args;

    // Create review with optional comments
    const reviewData = {
      owner,
      repo,
      pull_number: pr_number,
      body,
      event: event || 'COMMENT', // APPROVE, REQUEST_CHANGES, or COMMENT
    };

    if (comments && comments.length > 0) {
      reviewData.comments = comments.map(comment => ({
        path: comment.path,
        line: comment.line,
        body: comment.body,
        side: comment.side || 'RIGHT',
        ...(comment.start_line && {
          start_line: comment.start_line,
          start_side: comment.start_side || 'RIGHT'
        })
      }));
    }

    const { data: review } = await this.octokit.pulls.createReview(reviewData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Review created successfully!\n\n` +
                `Event: ${review.state}\n` +
                `Review ID: ${review.id}\n` +
                `URL: ${review.html_url}`
        }
      ]
    };
  }
}
