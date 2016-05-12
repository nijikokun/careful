# careful

[![version](https://img.shields.io/npm/v/careful.svg?style=flat-square)](http://npm.im/careful)
[![downloads](https://img.shields.io/npm/dm/careful.svg?style=flat-square)](http://npm-stat.com/charts.html?package=careful)
[![MIT License](https://img.shields.io/npm/l/careful.svg?style=flat-square)](http://opensource.org/licenses/MIT)

Provides a binary that can be used as a `git-hook` to validate branch names according to `git-flow` prior to pushing upstream. 

```sh
$ (features/banned-regex-support) careful

CAREFUL! Branch prefix "features" is not allowed.
CAREFUL! Instead of "features/banned-regex-support" try "feature/banned-regex-support".
```

## Features

- Validate branch name according to default `git-flow` format.
- Prevent pushes to certain branches such as `master` or `staging`.
- Completely customizable, from prefix seperator to the error messages themselves.
- Give suggestions when prefixes don't exist.

## Installation

```sh
$ npm install careful --save-dev
```

- Use [ghooks](http://npm.im/ghooks) to setup `pre-push` and `pre-commit` git hooks. Requires `git 1.8.2+`

## Usage

### Options

Define options in your `package.json` file (values displayed below are the default values):

```javascript
{
  "config": {
    "careful": {
      // Allowed git-flow prefixes (e.g. <prefix>/<name>)
      // Example: feature/banned-regex-support
      "prefixes": ["feature", "hotfix", "release"],

      // Commonly misspelled or forgotten?
      // Add a suggestion for when it occurs
      "suggestions": {
        "features": "feature",
        "feat": "feature",
        "fix": "hotfix",
        "releases": "release"
      },

      // Skip validation check completely for certain branches
      // MUST be full branch name including prefixes
      "skip": [],
      
      // Branches developers are disallowed to push code
      // MUST be full branch name including prefixes
      "disallowed": ["master", "staging", "develop"],

      // Ban a branch name completely from being used regardless of prefix
      "banned": ["wip"],

      // Prefix to name seperator
      "seperator": "/"
    }
  }
}
```

#### skip

Skip all checks for certain branches.

#### prefixes

`git-flow` branch prefixes allowed. 

#### suggestions

Give suggestions when a certain prefix is used.

```
Instead of "features/banned-regex-support" try "feature/banned-regex-support"
```

#### disallowed

Prevent pushing to certain branches, must be the entire branch name, including prefixes.

#### seperator

Character used to seperate the `prefix` and branch `name`. Defaults to `/`, as Sourcetree converts branch names that use `/` into folders.

#### banned

Ban pushing to branches with a certain `name`. Checks both complete branch name, and the name of the branch with the prefix omitted.

#### msgBranchBanned

Message displayed when a banned branch name is used.

#### msgPrefixNotAllowed

Message displayed when a prefix that is not allowed is used.

#### msgPrefixSuggestion

Message displayed when a suggestion for a prefix exists.

#### msgSeperatorRequired

Message displayed when the branch is missing the seperator.

## License

MIT