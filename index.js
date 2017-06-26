const fs = require('fs')
const os = require('os')
const exec = require('child_process').execSync
const util = require('util')
const findup = require('findup')
const resolve = require('path').resolve

function init(filename = 'package.json') {
  this.config = loadConfiguration(filename)

  this.BRANCH_PREFIXES = this.config.prefixes || ['feature', 'hotfix', 'release']
  this.PREFIX_SUGGESTIONS = this.config.suggestions || {'features': 'feature', 'feat': 'feature', 'fix': 'hotfix', 'releases': 'release'}
  this.BANNED_BRANCH_NAMES = this.config.banned || ['wip']
  this.BRANCHES_CHECK_SKIP = this.config.skip || []
  this.DISALLOWED_BRANCHES = this.config.disallowed || ['master', 'develop', 'staging']
  this.SEPERATOR = this.config.seperator || '/'

  this.MSG_BRANCH_BANNED = this.config.msgBranchBanned || 'Branches with the name "%s" are not allowed.'
  this.MSG_BRANCH_PUSH_NOT_ALLOWED = this.config.msgBranchDisallowed || 'Pushing to "%s" is not allowed, use git-flow.'
  this.MSG_PREFIX_NOT_ALLOWED = this.config.msgPrefixNotAllowed || 'Branch prefix "%s" is not allowed.'
  this.MSG_PREFIX_SUGGESTION = this.config.msgPrefixSuggestion || 'Instead of "%s" try "%s".'
  this.MSG_SEPERATOR_REQUIRED = this.config.msgSeperatorRequired || 'Branch "%s" must contain a seperator "%s".'

  this.ERROR_CODE = 1
  this.SUCCESS_CODE = 0
}

function loadConfiguration (filename = 'package.json') {
  var pkgFile = findup.sync(process.cwd(), filename)
  var pkg = JSON.parse(fs.readFileSync(resolve(pkgFile, filename)))
  return pkg && pkg.config && pkg.config['careful'] || {}
}

function error () {
  console.error('CAREFUL!', util.format.apply(null, arguments))
  return this.ERROR_CODE
}

function doValidation (branch, options = {}) {
  var prefix
  var parts
  var name

  var defaultOptions = {
    configFileName: 'package.json',
  }

  options = Object.assign(defaultOptions, options);

  init.call(this, options.configFileName);

  if (this.BRANCHES_CHECK_SKIP.indexOf(branch) > -1) {
    return this.SUCCESS_CODE
  }

  if (this.BANNED_BRANCH_NAMES.indexOf(branch) > -1) {
    return error.call(this, this.MSG_BRANCH_BANNED, branch)
  }

  if (this.DISALLOWED_BRANCHES.indexOf(branch) > -1) {
    return error.call(this, this.MSG_BRANCH_PUSH_NOT_ALLOWED, branch)
  }

  if (branch.indexOf(this.SEPERATOR) < 0) {
    return error.call(this, this.MSG_SEPERATOR_REQUIRED, branch)
  } else {
    parts = branch.split(this.SEPERATOR)
    prefix = parts[0].toLowerCase()
    name = parts[1].toLowerCase()
  }

  if (this.BANNED_BRANCH_NAMES.indexOf(name) > -1) {
    return error.call(this, this.MSG_BRANCH_BANNED, name)
  }

  if (this.BRANCH_PREFIXES.indexOf(prefix) < 0) {
    error.call(this, this.MSG_PREFIX_NOT_ALLOWED, prefix)

    if (this.PREFIX_SUGGESTIONS[prefix]) {
      error.call(
        this,
        this.MSG_PREFIX_SUGGESTION,
        [prefix, name].join(this.SEPERATOR),
        [this.PREFIX_SUGGESTIONS[prefix], name].join(this.SEPERATOR)
      )
    }

    return this.ERROR_CODE
  }

  return this.SUCCESS_CODE
}

function getCurrentBranch () {
  var branch
  var IS_WINDOWS = os.platform() === 'win32'
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
