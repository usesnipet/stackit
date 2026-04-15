# 📦 stackit

> Minimal, fast, and deterministic — a Git-based dependency manager.

**stackit** is a lightweight alternative to npm/yarn when you only need to manage dependencies directly from Git repositories.

No registry. No complexity. Just Git.

---

# 🚀 Motivation

Managing dependencies via Git usually involves:

* submodules (complex and annoying)
* manual scripts
* lack of deterministic version control

**stackit** solves this with:

* simple configuration
* automated installation
* support for branches, tags, and commits
* compatibility with private repositories

---

# 📥 Installation

```bash
npm install -g stackit
```

---

# ⚙️ Configuration

Create a `stackit.json` file at the project root:

```json
{
  "dir": "vendor",
  "dependencies": {
    "https://github.com/user/repo-a.git": "v1.0.0",
    "https://github.com/user/repo-b.git": "main"
  }
}
```

Or just run `stackit init` to generate a `stackit.json` file with the default template.

---

## 🧠 How it works

* Each dependency is a Git repository
* The value defines the reference:

| Value     | Type   |
| --------- | ------ |
| `v1.0.0`  | Tag    |
| `main`    | Branch |
| `a1b2c3d` | Commit |

---

# 📦 Installing dependencies

```bash
stackit install
```

### What happens:

* Clones repositories into `dir`
* Updates existing repositories (`git fetch`)
* Checks out the specified version
* Automatically names folders

---

## 📁 Generated structure

```bash
folder-name/
  user-repo-a/
  user-repo-b/
```

---

# 🏷️ Creating tags

```bash
stackit tag 0.0.1
```

With push:

```bash
stackit tag 0.0.1 --push
```

---

# 🔄 Updating dependencies

```bash
stackit update
```

---

# ➕ Adding a dependency

```bash
stackit add https://github.com/user/repo.git --ref main
```

---

# 🔐 Private repositories

**stackit** supports anything Git supports:

## ✅ SSH (recommended)

```bash
git@github.com:user/repo.git
```

## ✅ HTTPS with credentials

```bash
https://github.com/user/repo.git
```

## ✅ Git Credential Manager

Uses credentials saved on the system automatically.

---

# 🧠 Name resolution

Repositories are converted automatically:

```
https://github.com/user/repo.git
→ user-repo
```

---

# ⚡ Features

* ⚡ Fast installation via Git
* 🧠 Smart version resolution
* 🔐 Support for private repositories
* 📁 Simple structure
* 🔄 Easy updates
* 🏷️ Tag-based versioning
* 🚫 No registry

---

# 🛠️ Roadmap

* [ ] Full lockfile
* [ ] Global repository cache
* [ ] Parallel installation
* [ ] Hooks (`postinstall`)

---

# ⚠️ Limitations

* Does not resolve transitive dependencies
* No registry (by design)
* Does not replace npm/yarn/pnpm

---

# 💡 Use cases

* Distributed monorepos
* External plugins
* Infrastructure as code
* Sharing private libraries

---

# 🤝 Contributing

Pull requests are welcome!

1. Fork
2. Create your branch
3. Commit
4. Push
5. Open a PR

---

# 📄 License

MIT

---

# 👀 Comparison

| Tool           | Complexity   | Git-native | Deterministic |
| -------------- | ------------ | ---------- | -------------- |
| npm            | High         | ❌         | ✅             |
| git submodules | High         | ✅         | 😐             |
| stackit        | Low          | ✅         | ✅             |
