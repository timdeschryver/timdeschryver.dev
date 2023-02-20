---
title: Invoke the Azure DevOps API from within your Azure DevOps pipeline
slug: invoke-the-azure-devops-api-from-within-your-azure-devops-pipeline
description: Using the Azure DevOps API to automatically add reviewers to an Azure DevOp Pull Request from within the CI pipeline.
date: 2023-02-20
tags: Azure DevOps
---

Our team is migrating existing codebases that's living in multiple repositories, to a single repository, a monorepository.
This has been great and it improves our daily flow.
From the start after migrating our first two repositories it added some benefits:

- it became easier to navigate through the code;
- making changes to the codebase can now be done in a single go;
- and it also simplified the overall setup and release management;

> To keep our builds fast we're [only building what's affected by the commits](../how-to-make-your-azure-devops-ci-cd-pipeline-faster/index.md)

But after migrating more reposities it became harder to keep track of the open pull requests.
Multiple teams are now using the same repository, resulting that more pull requests are created.
This means that knowing which pull requests are important to you and your team becomes a skill.

As a work around, we ping our team members to review our code, write a custom query to find open pull request, or we can manually assign a team as a reviewer.
With the latter, the pull request is also added to your dashboard view in Azure DevOps.
Your Azure DevOps dashboard shows your own pull requests, and the pull requests where you (or the team that you're in) are added as a reviewer.
While adding reviewers manually can help, some pull requests can still remain open for a longer time because we forgot to assign a reviewer, and thus isn't visible to anyone.
This is counter-productive because pull requests remain open, and because it takes up (recurring) time during the daily stand-ups when we ask for a status update.

As a solution to this problem we came up using our Azure DevOps pipeline combined with the Azure DevOps Api to automatically assign the corresponding team as a reviewer.
Yes, Azure DevOps has a couple of default settings to automatically add reviewers to pull requests, but none of them did what we needed for our case.
Our case might be slightly different than most (mono)repositories because a team is allowed to touch all the files that it needs within our repository.

To know which team that needs to be assigned, we agreed to prefix our branchnames with the team name, e.g. `team-one/feature-a`, or `team-two/fix-bug`.
Using this branch group also has the befenift that the branches are now grouped within the branches overview page, which makes it easier to know what the teams are working on.

We wrote the powershell script below to add automatically detect the reviewer's team based on the branchname.
Then it uses of the [Azure DevOps API](https://learn.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-7.1) to add the team as a reviewer to the pull request.
You can also see that the script uses environment variables that are passed to the script from the pipeline, for example an access token to invoke the rest request.

```ps1:.azure-pipelines/scripts/add-reviewers.ps1
$reviewerId = ""
if ($env:SOURCE_BRANCH -match "team-one") {
    $reviewerId = "team-one-id"
}
if ($env:SOURCE_BRANCH -match "team-two") {
    $reviewerId = "team-two-id"
}

if ($reviewerId -ne "") {
    $url = "$($env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI)$env:SYSTEM_TEAMPROJECTID/_apis/git/repositories/$($env:REPOSITORY)/pullRequests/$($env:PR_ID)/reviewers/$($reviewerId)?api-version=7.0"
    $body = @{
        id = $reviewerId
        isRequired = "true"
    } | ConvertTo-Json
    $headers = @{
        Authorization = "Bearer $env:SYSTEM_ACCESSTOKEN"
    }

    $pipeline = Invoke-RestMethod -Uri $url -Method 'Put' -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "$($pipeline | ConvertTo-Json -Depth 100)"
}
```

To only notify te team about this pull request when the build passes, we've choosen to add this stage as the last step in the pipeline.
The template looks like this:

```yaml{12-17}:./.azure-pipelines/pullrequest.yaml
#  config comes here

stages:
  #  other stages come here

  - stage: Reviewers
*    jobs:
      - job: AddReviewers
        displayName: 🧑‍🤝‍🧑 Add Reviewers
        timeoutInMinutes: 2
        steps:
          - powershell: ./.azure-pipelines/scripts/add-reviewers.ps1
            env:
              SYSTEM_ACCESSTOKEN: $(System.AccessToken)
              SOURCE_BRANCH: $(System.PullRequest.SourceBranch)
              PR_ID: $(System.PullRequest.PullRequestId)
              REPOSITORY: $(Build.Repository.Name)
```

So far this is a simple solution, but if it's needed it can be extended further.
For example, some things that can be added:

- also include reviewers based on files that were touched in the pull request;
- add comments to the pull request based on different criteria;
- notify the team with a Teams message;
