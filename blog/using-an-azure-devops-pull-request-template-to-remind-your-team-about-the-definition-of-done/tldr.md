Create an Azure DevOps Pull Request template to make the team aware of the Definition of Done each time a Pull Request is created.

![The template is shown when a Pull Request is created within Azure Devops](./images/template.png)

To create your own template, create a new folder `.azuredevops` within the root of your project, and also create a `pull_request_template.md` file.

```md:.azuredevops/pull_request_template.md
**A reminder of our Definition of Done**:

- [ ] Tests are added and are passing
- [ ] The Product Owner accepts the changes
- [ ] The documentation is updated
- [x] Code is reviewed
```

The `[ ]` syntax displays a checkbox that the developer can check off if it's done.

![The template is shown when a Pull Request is being reviewed within Azure Devops](./images/template-2.png)
