const fs = require('fs')
const os = require('os')
const exec = require('child_process').execSync
const util = require('util')
const findup = require('findup')
const resolve = require('path').resolve
const config = loadConfiguration()

const IS_WINDOWS = os.platform() === 'win32'

const BRANCH_PREFIXES = config.prefixes || ['feature', 'hotfix', 'release']
const PREFIX_SUGGESTIONS = config.suggestions || {'features': 'feature', 'feat': 'feature', 'fix': 'hotfix', 'releases': 'release'}
const BANNED_BRANCH_NAMES = config.banned || ['wip']
const BRANCHES_CHECK_SKIP = config.skip || []
const DISALLOWED_BRANCHES = config.disallowed || ['master', 'develop', 'staging']
const SEPERATOR = config.seperator || '/'

const MSG_BRANCH_BANNED = config.msgBranchBanned || 'Branches with the name "%s" are not allowed.'
const MSG_BRANCH_PUSH_NOT_ALLOWED = config.msgBranchDisallowed || 'Pushing to "%s" is not allowed, use git-flow.'
const MSG_PREFIX_NOT_ALLOWED = config.msgPrefixNotAllowed || 'Branch prefix "%s" is not allowed.'
const MSG_PREFIX_SUGGESTION = config.msgPrefixSuggestion || 'Instead of "%s" try "%s".'
const MSG_SEPERATOR_REQUIRED = config.msgSeperatorRequired || 'Branch "%s" must contain a seperator "%s".'

const ERROR_CODE = 1
const SUCCESS_CODE = 0

function loadConfiguration () {
  var pkgFile = findup.sync(process.cwd(), 'package.json')
  var pkg = JSON.parse(fs.readFileSync(resolve(pkgFile, 'package.json')))
  return pkg && pkg.config && pkg.config['careful'] || {}
}

function error () {
  console.error('CAREFUL!', util.format.apply(null, arguments))
  return ERROR_CODE
}

function doValidation (branch) {
  var prefix
  var parts
  var name

  if (BRANCHES_CHECK_SKIP.indexOf(branch) > -1) {
    return SUCCESS_CODE
  }

  if (BANNED_BRANCH_NAMES.indexOf(branch) > -1) {
    return error(MSG_BRANCH_BANNED, branch)
  }

  if (DISALLOWED_BRANCHES.indexOf(branch) > -1) {
    return error(MSG_BRANCH_PUSH_NOT_ALLOWED, branch)
  }

  if (branch.indexOf(SEPERATOR) < 0) {
    return error(MSG_SEPERATOR_REQUIRED, branch)
  } else {
    parts = branch.split(SEPERATOR)
    prefix = parts[0].toLowerCase()
    name = parts[1].toLowerCase()
  }

  if (BANNED_BRANCH_NAMES.indexOf(name) > -1) {
    return error(MSG_BRANCH_BANNED, name)
  }

  if (BRANCH_PREFIXES.indexOf(prefix) < 0) {
    error(MSG_PREFIX_NOT_ALLOWED, prefix)

    if (PREFIX_SUGGESTIONS[prefix]) {
      error(
        MSG_PREFIX_SUGGESTION,
        [prefix, name].join(SEPERATOR),
        [PREFIX_SUGGESTIONS[prefix], name].join(SEPERATOR)
      )
    }

    return ERROR_CODE
  }

  return SUCCESS_CODE
}

function getCurrentBranch () {
  var branch

  if (IS_WINDOWS) {
    branch = exec('git symbolic-ref HEAD 2> NUL || git rev-parse --short HEAD 2> NUL')
  } else {
    branch = exec('git symbolic-ref HEAD 2> /dev/null || git rev-parse --short HEAD 2> /dev/null')
  }

  if (!branch) {
    throw new Error('Unable to determine branch name using git command.')
  }

  return branch.toString().split('\n')[0].replace('refs/heads/', '').toLowerCase()
}

module.exports = {
  currentBranch: getCurrentBranch(),
  validateBranchName: doValidation
}
