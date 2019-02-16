const fs = require('fs');
const os = require('os');
const exec = require('child_process').execSync;
const util = require('util');
const findup = require('findup');
const { resolve } = require('path');

const ERROR_CODE = 1;
const SUCCESS_CODE = 0;
const IS_WINDOWS = os.platform() === 'win32';

const loadConfiguration = () => {
  const pkgFile = findup.sync(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(resolve(pkgFile, 'package.json')));

  return (pkg && pkg.config && pkg.config.careful) || {};
};

const error = (...args) => {
  console.error('CAREFUL!', util.format(null, args));

  return ERROR_CODE;
};

const {
  prefixes,
  suggestions,
  banned,
  skip,
  disallowed,
  seperator,
  msgBranchBanned,
  msgBranchDisallowed,
  msgPrefixNotAllowed,
  msgPrefixSuggestion,
  msgSeperatorRequired,
} = loadConfiguration();

const BRANCH_PREFIXES = prefixes || ['feature', 'hotfix', 'release'];
const PREFIX_SUGGESTIONS = suggestions || {
  features: 'feature',
  feat: 'feature',
  fix: 'hotfix',
  releases: 'release',
};
const BANNED_BRANCH_NAMES = banned || ['wip'];
const BRANCHES_CHECK_SKIP = skip || [];
const DISALLOWED_BRANCHES = disallowed || ['master', 'develop', 'staging'];
const SEPERATOR = seperator || '/';

const MSG_BRANCH_BANNED =
  msgBranchBanned || 'Branches with the name "%s" are not allowed.';
const MSG_BRANCH_PUSH_NOT_ALLOWED =
  msgBranchDisallowed || 'Pushing to "%s" is not allowed, use git-flow.';
const MSG_PREFIX_NOT_ALLOWED =
  msgPrefixNotAllowed || 'Branch prefix "%s" is not allowed.';
const MSG_PREFIX_SUGGESTION =
  msgPrefixSuggestion || 'Instead of "%s" try "%s".';
const MSG_SEPERATOR_REQUIRED =
  msgSeperatorRequired || 'Branch "%s" must contain a seperator "%s".';

const doValidation = (branch) => {
  if (BRANCHES_CHECK_SKIP.includes(branch)) {
    return SUCCESS_CODE;
  }

  if (BANNED_BRANCH_NAMES.includes(branch)) {
    return error(MSG_BRANCH_BANNED, branch);
  }

  if (DISALLOWED_BRANCHES.includes(branch)) {
    return error(MSG_BRANCH_PUSH_NOT_ALLOWED, branch);
  }

  if (branch.indexOf(SEPERATOR) < 0) {
    return error(MSG_SEPERATOR_REQUIRED, branch);
  }

  const parts = branch.split(SEPERATOR);
  const prefix = parts[0].toLowerCase();
  const name = parts[1].toLowerCase();

  if (BANNED_BRANCH_NAMES.includes(name)) {
    return error(MSG_BRANCH_BANNED, name);
  }

  if (BRANCH_PREFIXES.indexOf(prefix) < 0) {
    error(MSG_PREFIX_NOT_ALLOWED, prefix);

    if (PREFIX_SUGGESTIONS[prefix]) {
      error(
        MSG_PREFIX_SUGGESTION,
        [prefix, name].join(SEPERATOR),
        [PREFIX_SUGGESTIONS[prefix], name].join(SEPERATOR),
      );
    }

    return ERROR_CODE;
  }

  return SUCCESS_CODE;
};

const getCurrentBranch = () => {
  let branch;

  if (IS_WINDOWS) {
    branch = exec(
      'git symbolic-ref HEAD 2> NUL || git rev-parse --short HEAD 2> NUL',
    );
  } else {
    branch = exec(
      'git symbolic-ref HEAD 2> /dev/null || git rev-parse --short HEAD 2> /dev/null',
    );
  }

  if (!branch) {
    throw new Error('Unable to determine branch name using git command.');
  }

  return branch
    .toString()
    .split('\n')[0]
    .replace('refs/heads/', '')
    .toLowerCase();
};

module.exports = {
  currentBranch: getCurrentBranch(),
  validateBranchName: doValidation,
};
