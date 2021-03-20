# REACT DEVELOPMENT AND WORKFLOW

### About the component.

This is an example component and the main one that I used to generate the registration form seen in the video. To do this, I used React Hooks under a responsive design and the concept of mobile-first. The component shows how to make requests to the API, validations, error handling, variable parsing, etc. All the code was created using the Airbnb linter and following clean code rules.

### About the workflow.

The way I worked was creating issues on the GitLab board. For each issue a branch was created from develop and when the issue gets completed it was merged to develop. 

![image](https://user-images.githubusercontent.com/33135078/111860555-c316af00-891e-11eb-861b-be901b1a835d.png)

At the end of each sprint (milestones in gitlab) the develop branch is merged to master. From master, a GitLab Release was created with the current application code and a docker image with the current date.

![image](https://user-images.githubusercontent.com/33135078/111860614-230d5580-891f-11eb-9c5d-255be4156c24.png)
