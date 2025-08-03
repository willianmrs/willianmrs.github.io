# Wilian Moreira's Blog

Um gerador de blog estático minimalista, baseado em componentes JavaScript.

## 🚀 Funcionalidades

- **Arquitetura de Componentes** - Código modular e fácil manutenção
- **100% Estático** - Sem frameworks pesados
- **Markdown Support** - Escreva posts em Markdown com front-matter
- **Design Responsivo** - Cards adaptativos que ocupam 60% da tela
- **Infinite Scroll** - Carregamento progressivo dos posts
- **GitHub Pages Ready** - Deploy automático com GitHub Actions
- **CORS-free** - Funciona tanto localmente quanto em servidor

## 📝 Como Adicionar Posts

1. Crie um arquivo `.md` na pasta `posts/`
2. Use front-matter no início do arquivo:

```markdown
---
title: Título do Post
subtitle: Subtítulo opcional
date: 2025-07-24
---

Conteúdo do post em **Markdown**.

## Heading 2

- Lista
- Items

[Link](https://example.com)

`código inline`

```javascript
// Bloco de código
console.log('Hello World');
```
```

3. Execute `node generate.js` para gerar os arquivos HTML
4. Os arquivos serão criados em `public/`

## 🛠️ Desenvolvimento Local

```bash
# Gerar arquivos estáticos
node generate.js

# Servir localmente (opcional)
python -m http.server 8000 -d public
# ou
npx serve public
```

## 🚀 Deploy Automático

O blog está configurado para deploy automático no GitHub Pages:

1. **Faça push** para o branch `main`
2. **GitHub Actions** executará automaticamente
3. **Site publicado** em `https://seu-usuario.github.io/repositorio`

### Configuração no GitHub:

1. Vá em **Settings** → **Pages**
2. Source: **GitHub Actions**
3. O workflow fará o resto automaticamente

## 📁 Estrutura do Projeto

```
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions workflow
├── components/             # Componentes reutilizáveis
│   ├── footer.js           # Componente de rodapé
│   ├── header.js           # Componente de cabeçalho
│   ├── layout.js           # Layout principal da página
│   └── post.js             # Renderização de posts
├── posts/                  # Seus posts em Markdown
│   ├── 2025-05-03-*.md
│   └── 2025-07-24-*.md
├── public/                 # Arquivos gerados (HTML, não versionado)
│   ├── index.html
│   ├── posts.json
│   └── *.html
├── generate.js             # Gerador estático
└── README.md
```

## 🎨 Personalização

Edite os arquivos na pasta `components/` para personalizar:

- **Componentes reutilizáveis** para melhor consistência
- **Cores e estilos** CSS
- **Layout** dos cards e páginas
- **Rodapé** com links sociais
- **Cabeçalho** com navegação

## 📱 Design

- **Header minimalista** com tamanho de fonte consistente (2rem)
- **Cards responsivos** com hover effects
- **Links sociais** mostrando nomes de usuário
- **Separação de responsabilidades** com componentes
- **Typography moderna** com fontes system
- **Mobile-first** design

---

Feito com ❤️ usando JavaScript puro Estático

Um gerador de blog estático minimalista em Node.js, pensado para ser
executado localmente ou em pipelines como o GitLab Pages.  Não usa
frameworks pesados nem depende de bibliotecas externas — tudo é
processado com as funcionalidades nativas do Node.js.

## Estrutura do projeto

```
static-blog/
├── posts/        # Posts em Markdown com front matter
├── public/       # Saída gerada (index.html, posts.json e páginas)
├── generate.js   # Script gerador
├── .gitlab-ci.yml# Pipeline para GitLab Pages
└── README.md     # Este guia
```

### Posts

Os arquivos em `posts/` devem ter a extensão `.md` e começar com um
bloco de *front matter* delimitado por `---`.  Esse bloco define
metadados obrigatórios que o gerador usa para criar o site.

Exemplo de post (`posts/2025-07-24-bem-vindo.md`):

```markdown
---
title: Bem-vindo ao meu blog
subtitle: Começando uma nova jornada
date: 2025-07-24
---
Este é o primeiro post do meu novo blog estático. Vou compartilhar
ideias, projetos e dicas sobre desenvolvimento web e muito mais. Fique
atento para novidades!
```

Campos suportados no front matter:

- **title** (obrigatório) – título do post;
- **subtitle** (opcional) – subtítulo ou descrição curta;
- **date** (obrigatório) – data no formato `YYYY-MM-DD`.

Abaixo do front matter vem o conteúdo em Markdown.  O gerador suporta
um subconjunto de Markdown (títulos com `#`, listas, parágrafos,
citações, links e formatação básica) suficiente para posts simples.

### Slugs

O script cria um *slug* para cada post a partir do campo `title` (ou do
nome do arquivo quando o título não está definido).  O slug é usado
como nome de arquivo `.html` e como chave em `posts.json`.

As regras para gerar o slug são:

1. O texto é convertido para minúsculas, acentos são removidos e
   caracteres que não sejam letras ou números são substituídos por
   hífens (`-`).
2. Hífens consecutivos são comprimidos e os hífens no início ou no
   final são removidos.
3. Se o slug resultante já existir, a data no formato `YYYYMMDD` é
   anexada (`meu-post-20250724`).
4. Se ainda houver conflito, um sufixo numérico sequencial é adicionado
   (`meu-post-20250724-1`, `meu-post-20250724-2` e assim por diante).

Esses slugs permanecem estáveis mesmo se o post for editado no futuro.

## Gerando o site

Para gerar o blog localmente, certifique-se de ter Node.js instalado
(versão 14 ou superior).  Em seguida, execute:

```sh
node generate.js
```

O script irá:

- Ler todos os arquivos `.md` em `posts/`;
- Extrair o front matter e ordenar os posts pela data;
- Criar `public/posts.json` com os metadados de cada post;
- Gerar um arquivo HTML para cada post em `public/` contendo o
  conteúdo convertido em HTML, além de links para até cinco posts
  anteriores e cinco seguintes na ordem cronológica;
- Criar `public/index.html` com um layout simples e *scroll infinito*:
  a página carrega lotes de cinco posts conforme o usuário se aproxima
  do final da página, usando apenas `fetch` e `IntersectionObserver`.

Após a execução, a pasta `public/` estará pronta para ser hospedada
como um site estático, por exemplo no GitLab Pages ou em qualquer
servidor que sirva arquivos estáticos.

## Pipeline do GitLab Pages

O arquivo `.gitlab-ci.yml` define um job `pages` que roda o script
`generate.js` dentro de uma imagem Node 18 e publica o conteúdo da
pasta `public/` como artefato.  Para ativar o GitLab Pages basta
adicionar este repositório a um projeto GitLab e fazer push para a
branch `main`.

Trecho do `.gitlab-ci.yml`:

```yaml
image: node:18

pages:
  stage: deploy
  script:
    - node generate.js
  artifacts:
    paths:
      - public
    expire_in: 1 week
  only:
    - main
```

Quando o job for executado, o GitLab Pages servirá o conteúdo da
pasta `public/` em `https://<seu-usuário-ou-nome-do-projeto>.gitlab.io/<seu-projeto>/`.

## Adicionando novos posts

1. Crie um novo arquivo Markdown em `posts/`, seguindo a nomenclatura
   `YYYY-MM-DD-meu-titulo.md` e preencha o front matter com título,
   subtítulo (opcional) e data.
2. Escreva o conteúdo do seu post abaixo do front matter.
3. Execute `node generate.js` localmente para atualizar a pasta
   `public/`, ou faça push para a branch `main` para que o GitLab
   Pages gere o site automaticamente.

Os novos posts aparecerão na página inicial de forma automática,
ordenados pela data (do mais recente para o mais antigo).  Os links de
navegação nos posts também serão atualizados para apontar para os
vizinhos cronológicos.