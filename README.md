# Core Features
- [] add stackit to project
- [] install dependencies
- [] update dependencies
- [] remove dependencies
- [] clear global dependencies directory (with "--all" or "--force" option)
- [] release a new version (promote changes to a new version)

# Extended Features
- [] stackit dependencies with other stackit dependencies (dependencies with dependencies)
- [] stackit hook (hook to run before and after a command)
- [] stackit alias (alias to run a command)


## Init
Initializes a new stackit project.
```bash
stackit init
```
- Create a `stackit.json` file on the current directory.
- If a stackit.json file already exists, no action is taken.
- On creating ask the user to provide a:
  - dependencies directory


## Install
Installs a dependency.
```bash
stackit install <git-url> [--branch <branch>|--tag <tag>] [--path <subdirectory>]
```
### Options
- `--branch <branch>`: Install the dependency from a specific branch.
- `--tag <tag>`: Install the dependency from a specific tag.
- `--path <subdirectory>`: Install the dependency into a specific subdirectory.

### Actions
- Add the dependency to the `stackit.json` file.
- Clone the dependency into the global stackit dependencies directory.
- Copy the dependency in global dependencies directory into the project dependencies directory (without the git repository).
- Add project directory to global stackit directory to control used git repositories in global dependencies directory.
- If the dependency is already installed, no action is taken.

## Remove
Removes a dependency.
```bash
stackit remove <dependency>
```
### Actions
- Remove the dependency from the `stackit.json` file.
- Remove the dependency from the project dependencies directory.
- If the dependency is not installed, print an error message and exit with code 1.

## Clear
Clears the global dependencies directory.
```bash
stackit clear [--all|--force]
```
### Options
- `--all`: Clear all dependencies.
- `--force`: Clear all dependencies without confirmation.

### Actions
- Remove all dependencies from the global dependencies directory that are not used in any project.
- If `--all` is provided, remove all dependencies from the global dependencies directory but show a confirmation prompt if the dependency is used in any project.
- If `--force` is provided, remove all dependencies from the global dependencies directory without confirmation.

## Release
Releases a new version of the stackit CLI.
```bash
stackit release <dependency> [--tag <tag>] [--message|-m <message>] [--major | --minor | --patch] [--push]
```

### Options
- `--tag <tag>`: Create a new release with the provided tag.
- `--message <message> | -m <message>`: Create a new release with the provided commit message (if not provided, use the tag name).
- `--push`: Push the release tag to the remote repository.
- `--major | --minor | --patch`: Create a new release and increment the version accordingly.

### Actions
- Update the `stackit.json` file with the new version.
- Copy the project dependency to global dependencies directory (if no have global dependencies directory, create it).
- Commit the changes to the global dependencies directory.
- Create a new release tag.
- Push the release tag to the remote repository if `--push` is provided.
- If the dependency is not installed or not found, print an error message and exit with code 1.