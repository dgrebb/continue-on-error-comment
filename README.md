# continue-on-error Comment Action

This action allows you to use continue-on-error with you existing GitHub Actions, but without any faiures getting hidden behind a green tick ✅ When a test that is marked as `continue-on-failure: true` actually fails, this action will add a comment to the PR to tell you that it failed.

Here is what an example comment looks like: 

![example-screenshot](https://user-images.githubusercontent.com/594890/198069222-9096eb74-4e0d-489d-935f-d353ba58f59a.png)

This action is useful because GitHub doesn't allow you to effectively mark a job as "allow failure" without hiding the status of that job. For more information about the problem you can follow [this GitHub Issue discussion](https://github.com/actions/toolkit/issues/399)

## Usage

Considering you have the following `.github/workflow` file: 

```yml
name: CI

on:
  # NOTE: continue-on-error-comment only makes sense to run on a Pull Request
  # see below for more information
  pull_request: {}

jobs:
  test: 
    runs-on: ubuntu-latest

    strategy:
      matrix:
        code: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    steps:
      - run: sleep $((RANDOM % 30)) && exit ${{ matrix.code }}
        continue-on-error: true
```

If you want to use this action then you need to make sure the step that has the `continue-on-error: true` has a valid ID: 


```yml
    steps:
      - id: build
        run: sleep $((RANDOM % 30)) && exit ${{ matrix.code }}
        continue-on-error: true
```

and then you add a step after that one that uses this action making sure that you refer to the ID of the previous step when passing the `outcome` input: 

```yml
    steps:
      - id: build
        run: sleep $((RANDOM % 30)) && exit ${{ matrix.code }}
        continue-on-error: true
      - uses: mainmatter/continue-on-error-comment@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          outcome: ${{ steps.build.outcome }}
          test-id: Error code ${{ matrix.code }}
```

Test-id is used to identify which test failed, so make sure that you pass the relevant `matrix` variables so that you can identify it later.

### Pull Request Context

`continue-on-error-comment` is designed to be used in the context of a Pull Request. It doesn't make much sense to run this on a commit on a branch.

If you do end up adding this action in a non-PR context then it is designed to just do nothing and continue without error. If you find that isn't true please open a bug report with reproduction instructions and we will fix the problem.

### Permissions

As this action needs to be able to comment back to your PR it might be necessary to add an explicit permission to the job: 

```
permissions:
  pull-requests: write
```

## Inputs

### `repo-token`

**Required** Used to comment back on the Pull Request which tests are failing

### `outcome`

**Required** You must pass in the outcome of a previous step. If the outcome is `failure` then it will comment on the PR with that test-id


### `test-id`

**Required** Used to identify the test that has failed. Make sure that you are specific enough, which means that you probably should pass a matrix variable to this ID

### `bot-user`

**Optional** This is only used if you have a custom bot user whos name is different from the default `github-actions[bot]`. This is an advanced feature and should be ignored by most users
