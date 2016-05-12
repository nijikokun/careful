const assert = require('assert')
const careful = require('./index')

console.error = function mockConsoleError () {
  return
}

assert(careful.validateBranchName('master') === 1, 'Invalid branch "master" passed disallowed validation.')
assert(careful.validateBranchName('develop') === 1, 'Invalid branch "develop" passed disallowed validation.')
assert(careful.validateBranchName('staging') === 1, 'Invalid branch "staging" passed disallowed validation.')
assert(careful.validateBranchName('fix/examples') === 1, 'Invalid prefix "fix" passed validation.')
assert(careful.validateBranchName('hotfix/examples') === 0, 'Valid prefix "hotfix" failed to pass validation.')
assert(careful.validateBranchName('hotfix/wip') === 1, 'Banned branch name "wip" passed validation.')
