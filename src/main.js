#!/usr/bin/env node

const path = require('path');
const homeDir = require('os').homedir();

require('dotenv').config({
  path: path.join(homeDir, '.github-collaborators'),
});

const commander = require('commander');
const chalk = require('chalk');
const R = require('ramda');
const axios = require('axios');
const { table } = require('table');

const GITHUB_BASE_URL = 'https://api.github.com';
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

const makeUrl = (...fragments) => fragments.filter(Boolean).join('/');

/* ===============================================
 * |                    API                      |
 * =============================================== */

/**
 * Sends a request to the github repo api
 * @param {string} repo
 * @param {string} url
 * @param {axios.AxiosRequestConfig} params
 */
function githubRequest(repo, url, params) {
  return axios.default
    .request({
      method: 'GET',
      ...params,
      baseURL: makeUrl(GITHUB_BASE_URL, 'repos', GITHUB_USER, repo),
      url,
      auth: {
        username: GITHUB_USER,
        password: GITHUB_ACCESS_TOKEN,
      },
    })
    .then(res => res.data);
}

/**
 * Sends a request to the github collaborators api
 * @param {string} repo
 * @param {string} url
 * @param {axios.AxiosRequestConfig} params
 */
function collaboratorsRequest(repo, url, params) {
  return githubRequest(repo, makeUrl('collaborators', url), params);
}

/**
 * Sends a request to the github invitations api
 * @param {string} repo
 * @param {string} url
 * @param {axios.AxiosRequestConfig} params
 */
function invitationsRequest(repo, url, params) {
  return githubRequest(repo, makeUrl('invitations', url), params);
}

/* ===============================================
 * |                  ADAPTERS                   |
 * =============================================== */

const adaptCollaborator = R.applySpec({
  id: R.prop('id'),
  login: R.prop('login'),
});

const adaptInvitation = R.applySpec({
  id: R.prop('id'),
  login: R.path(['invitee', 'login']),
  createdAt: R.pipe(R.prop('created_at'), date =>
    new Date(date).toLocaleString(),
  ),
  inviteLink: R.prop('html_url'),
});

/* ===============================================
 * |                      UI                     |
 * =============================================== */

function printInvitations(invitations, { showTitle = true } = {}) {
  if (R.isEmpty(invitations)) {
    return;
  }

  const title = chalk.bold.white;

  const data = [
    [title('ID'), title('User'), title('Creation Date'), title('Invite Link')],
    ...invitations.map(R.props(['id', 'login', 'createdAt', 'inviteLink'])),
  ];

  if (showTitle) {
    console.log(title.underline('Invitations'));
  }

  console.log(table(data, { singleLine: true }));
}

function printCollaborators(collaborators) {
  if (R.isEmpty(collaborators)) {
    return;
  }

  const title = chalk.bold.white;

  const data = [
    [title('ID'), title('User')],
    ...collaborators.map(R.props(['id', 'login'])),
  ];

  console.log(title.underline('Collaborators'));
  console.log(table(data, { singleLine: true }));
}

/* ===============================================
 * |              COMMAND ACTIONS                |
 * =============================================== */

async function addCollaborator(collaborator, repo) {
  try {
    const invitation = await collaboratorsRequest(repo, collaborator, {
      method: 'PUT',
    }).then(adaptInvitation);

    console.log(
      chalk`\n{green Invitation sent to => {bold.underline ${collaborator}}}\n`,
    );
    printInvitations([invitation], { showTitle: false });
  } catch (err) {
    console.error(chalk`{red ${err}}`);
  }
}

async function listCollaborators(repo) {
  try {
    const collaborators = await collaboratorsRequest(repo).then(
      R.map(adaptCollaborator),
    );

    const invitations = await invitationsRequest(repo).then(
      R.map(adaptInvitation),
    );

    printCollaborators(collaborators);
    printInvitations(invitations);
  } catch (err) {
    console.error(chalk.red(err));
  }
}

async function deleteCollaborator(collaborator, repo) {
  try {
    await collaboratorsRequest(repo, collaborator, {
      method: 'DELETE',
    });

    console.log(
      chalk`\n{green Removed {bold.underline ${collaborator}} from {bold ${repo}}}\n`,
    );
  } catch (err) {
    console.error(chalk.red(err));
  }
}

async function cancelInvite(collaborator, repo) {
  try {
    const invitationId = await invitationsRequest(repo).then(
      R.pipe(
        R.map(adaptInvitation),
        R.find(R.propEq('login', collaborator)),
        R.prop('id'),
      ),
    );

    await invitationsRequest(repo, invitationId, {
      method: 'DELETE',
    });

    console.log(
      chalk`\n{green Cancelled {bold.underline ${collaborator}}'s invitation}\n`,
    );
  } catch (err) {
    console.error(chalk.red(err));
  }
}

commander.version('v0.0.1');

commander
  .command('ls <repo>')
  .description('Lists repo collaborators')
  .action(listCollaborators);

commander
  .command('add <collaborator> <repo>')
  .description('Adds a collaborator to the repo')
  .action(addCollaborator);

commander
  .command('remove <collaborator> <repo>')
  .description('Removes a collaborator from the repo')
  .action(deleteCollaborator);

commander
  .command('cancel <collaborator> <repo>')
  .description('Cancels an invitation')
  .action(cancelInvite);

commander.parse(process.argv);
