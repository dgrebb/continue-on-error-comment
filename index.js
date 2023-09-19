import { getInput, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";

import getPullRequest from "./lib/get-pull-request.js";

import { signiture } from "./lib/constants.js";

if (context.eventName !== "pull_request") {
  console.log(
    `continue-on-error-comment is designed to be used with pull request and does not work with a [${context.eventName}] event. We are ignoring this event.`
  );
} else {
  try {
    const myToken = getInput("repo-token", { required: true });
    const outcome = getInput("outcome", { required: true });
    const testId = getInput("test-id", { required: true });
    const botUser = getInput("bot-user", { required: true });

    if (outcome === "failure") {
      const octokit = getOctokit(myToken);
      const pullRequest = await getPullRequest(context, octokit);

      const { data: comments } = await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequest.number,
      });

      const existingComment = comments.find(
        (comment) =>
          comment.user.login === botUser &&
          comment.body.endsWith(signiture) &&
          comment.body.includes(`sha: ${context.sha}`)
      );

      if (existingComment) {
        let body = existingComment.body.split("\n");

        body.splice(body.length - 3, 0, `- ${testId}`);

        await octokit.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existingComment.id,
          body: body.join("\n"),
        });
      } else {
        const body = `Passing failures: 
    
  - ${testId}

  <!-- sha: ${context.sha} -->
  ${signiture}`;
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: pullRequest.number,
          body,
        });
      }
    }
  } catch (error) {
    setFailed(error.message);
  }
}
