# Github Collaborators CLI 🤖

<span class="badge-ci"><img src="https://github.com/fernando-mf/github-collaborators-cli/workflows/Github%20Collaborators%20CLI%20-%20CI/badge.svg" alt="github-collaborators-ci" /></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/github-collaborators" title="View this project on NPM"><img src="https://img.shields.io/npm/v/github-collaborators.svg" alt="NPM version" /></a></span>

> A simple CLI made to easily manage your repository collaborators

## Installation

```sh
yarn global add github-collaborators

npm install -g github-collaborators
```

## Set up

In order to use the script you will need to get your [github token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

Once you have your access token create the script config file

```sh
touch ~/.github-collaborators
```

Then open the file and paste this

```sh
GITHUB_USER=<your-username>
GITHUB_ACCESS_TOKEN=<your-token>
```

Replace the `<variable>` with your credentials e.g.

```sh
GITHUB_USER=octocat
GITHUB_ACCESS_TOKEN=nBlHCGhHFo
```

That's it you're ready to run the script. Try listing the repo collaborators

```sh
github-collaborators ls <repo-name>
```

## Usage

```sh
Usage: github-collaborators [options] [command]

Options:
  -V, --version                 output the version number
  -h, --help                    output usage information

Commands:
  ls <repo>                     Lists repo collaborators
  add <collaborator> <repo>     Adds a collaborator to the repo
  remove <collaborator> <repo>  Removes a collaborator from the repo
  cancel <collaborator> <repo>  Cancels an invitation
```
