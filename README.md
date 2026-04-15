# 📦 stackit

> Minimalista, rápido e determinístico — um gerenciador de dependências baseado em Git.

O **stackit** é uma alternativa leve ao npm/yarn quando você só precisa gerenciar dependências diretamente de repositórios Git.

Sem registry. Sem complexidade. Só Git.

---

# 🚀 Motivação

Gerenciar dependências via Git normalmente envolve:

* submodules (complexos e chatos)
* scripts manuais
* falta de controle de versão determinístico

O **stackit** resolve isso com:

* configuração simples
* instalação automatizada
* suporte a branches, tags e commits
* compatibilidade com repositórios privados

---

# 📥 Instalação

```bash
npm install -g stackit
```

---

# ⚙️ Configuração

Crie um arquivo `stackit.json` na raiz do projeto:

```json
{
  "dir": "vendor",
  "dependencies": {
    "https://github.com/user/repo-a.git": "v1.0.0",
    "https://github.com/user/repo-b.git": "main"
  }
}
```

Ou apenas execute o comando `stackit init` para criar um arquivo `stackit.json` com o template padrão.

---

## 🧠 Como funciona

* Cada dependência é um repositório Git
* O valor define a referência:

| Valor     | Tipo   |
| --------- | ------ |
| `v1.0.0`  | Tag    |
| `main`    | Branch |
| `a1b2c3d` | Commit |

---

# 📦 Instalação de dependências

```bash
stackit install
```

### O que acontece:

* Clona os repositórios em `dir`
* Atualiza repositórios existentes (`git fetch`)
* Faz checkout da versão especificada
* Nomeia automaticamente as pastas

---

## 📁 Estrutura gerada

```bash
folder-name/
  user-repo-a/
  user-repo-b/
```

---

# 🏷️ Criar tags

```bash
stackit tag 0.0.1
```

Com push:

```bash
stackit tag 0.0.1 --push
```

---

# 🔄 Atualizar dependências

```bash
stackit update
```

---

# ➕ Adicionar dependência

```bash
stackit add https://github.com/user/repo.git --ref main
```

---

# 🔐 Repositórios privados

O **stackit** suporta qualquer método que o Git suporta:

## ✅ SSH (recomendado)

```bash
git@github.com:user/repo.git
```

## ✅ HTTPS com credenciais

```bash
https://github.com/user/repo.git
```

## ✅ Git Credential Manager

Usa credenciais salvas no sistema automaticamente.

---

# 🧠 Resolução de nomes

Os repositórios são convertidos automaticamente:

```
https://github.com/user/repo.git
→ user-repo
```

---

# ⚡ Features

* ⚡ Instalação rápida via Git
* 🧠 Resolução inteligente de versão
* 🔐 Suporte a repositórios privados
* 📁 Estrutura simples
* 🔄 Atualização fácil
* 🏷️ Versionamento com tags
* 🚫 Sem registry

---

# 🛠️ Roadmap

* [ ] Lockfile completo
* [ ] Cache global de repositórios
* [ ] Instalação paralela
* [ ] Hooks (`postinstall`)

---

# ⚠️ Limitações

* Não resolve dependências transitivas
* Não possui registry (por design)
* Não substitui npm/yarn/pnpm

---

# 💡 Casos de uso

* Monorepos distribuídos
* Plugins externos
* Infra como código
* Compartilhamento de libs privadas

---

# 🤝 Contribuição

Pull requests são bem-vindos!

1. Fork
2. Crie sua branch
3. Commit
4. Push
5. Abra um PR

---

# 📄 Licença

MIT

---

# 👀 Comparação

| Ferramenta     | Complexidade | Git-native | Determinístico |
| -------------- | ------------ | ---------- | -------------- |
| npm            | Alta         | ❌         | ✅             |
| git submodules | Alta         | ✅         | 😐             |
| stackit        | Baixa        | ✅         | ✅             |
