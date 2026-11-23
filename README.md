# Portfólio — Gustavo Martins

Site pessoal de Gustavo Martins, analista de sistemas (Fullstack & DevOps), em Porto Nacional/TO.
É um site estático (HTML, CSS e JavaScript puros), empacotado em Docker e publicado por um pipeline de CI/CD.

## Arquitetura

```
git push (main)
   │
   ▼
GitHub Actions ─┬─ 1. Validar HTML (html-validate)
                ├─ 2. Build da imagem + teste de fumaça no container
                │     (páginas, cabeçalhos de segurança, 404, health check)
                ├─ 3. Publicar no GHCR  →  ghcr.io/gusmcardoso/portfolio:{latest, <commit>}
                └─ 4. Deploy via SSH    →  docker compose pull && up -d
                                              │
Servidor:  Internet ──► Caddy (HTTPS automático, :443) ──► Nginx sem root (:8080, rede interna)
```

| Peça | Função |
| --- | --- |
| `Dockerfile` | Imagem `nginx-unprivileged` (sem root) com health check |
| `docker/nginx.conf` | Gzip, cache, CSP e cabeçalhos de segurança, bloqueio de arquivos ocultos, `/healthz` |
| `docker-compose.yml` | Ambiente local |
| `deploy/docker-compose.prod.yml` | Produção: site + Caddy, sem capabilities, sem porta exposta no container do site |
| `deploy/Caddyfile` | HTTPS automático (Let's Encrypt), HSTS e redirecionamento de `www` |
| `.github/workflows/ci-cd.yml` | Pipeline completo |
| `.github/dependabot.yml` | Atualização automática das actions e da imagem base |

## Rodando localmente

Sem Docker, pelo XAMPP: `http://localhost/portfolio/`

Com Docker:

```bash
docker compose up --build
# http://localhost:8080
```

## Publicando na Vercel

O site é estático, então a Vercel publica direto do repositório, sem build:

1. Na Vercel: **Add New › Project › Import** `gusmcardoso/portfolio`
2. Framework Preset: **Other** · Build Command: vazio · Output Directory: vazio (raiz)
3. **Deploy**. A cada push na `main` a Vercel publica de novo, e cada pull request ganha um link de prévia.

- `vercel.json` aplica os mesmos cabeçalhos de segurança do Nginx (CSP, nosniff, frame-ancestors etc.) e o cache dos arquivos estáticos. HTTPS e HSTS ficam por conta da Vercel.
- `.vercelignore` evita publicar arquivos do repositório que não são do site (Dockerfile, `deploy/`, README, kit da logo).

A infraestrutura com Docker abaixo continua valendo para hospedar em um servidor próprio (VPS).

## Colocando no ar (primeira vez)

1. **Repositório**: crie o repositório público `portfolio` no GitHub e faça o push para `main`.
   O pipeline valida, testa e publica a imagem em `ghcr.io/gusmcardoso/portfolio`.
2. **Imagem pública**: em *GitHub → Packages → portfolio → Package settings*, mude a visibilidade
   para *Public* (assim o servidor baixa a imagem sem precisar de login).
3. **Servidor** (VPS Linux; o Oracle Cloud Free Tier ARM funciona, porque a imagem é multi-arquitetura):
   - Instale o Docker e o plugin Compose.
   - Crie um usuário de deploy e coloque-o no grupo `docker`.
   - Libere as portas 80 e 443. Na Oracle Cloud, isso é feito em dois lugares: na *Security List* da VCN **e** no firewall do sistema (`iptables`/`ufw`).
   - Crie `~/portfolio/.env` a partir de `deploy/.env.example`.
4. **DNS**: aponte um registro `A` do domínio (e do `www`) para o IP do servidor.
5. **Chave SSH de deploy** (na sua máquina):
   ```bash
   ssh-keygen -t ed25519 -C "deploy-portfolio" -f deploy_key -N ""
   ssh-copy-id -i deploy_key.pub usuario@IP_DO_SERVIDOR
   ssh-keyscan IP_DO_SERVIDOR      # saída vai no secret SSH_KNOWN_HOSTS
   ```
6. **GitHub → Settings → Secrets and variables → Actions**:

   | Tipo | Nome | Valor |
   | --- | --- | --- |
   | Secret | `SSH_HOST` | IP ou host do servidor |
   | Secret | `SSH_USER` | usuário de deploy |
   | Secret | `SSH_PRIVATE_KEY` | conteúdo de `deploy_key` |
   | Secret | `SSH_KNOWN_HOSTS` | saída do `ssh-keyscan` |
   | Variable | `SITE_URL` | `https://seudominio.com.br` |
   | Variable | `DEPLOY_ENABLED` | `true` |

   Enquanto `DEPLOY_ENABLED` não for `true`, o pipeline só valida, testa e publica a imagem.

## Rollback

Toda imagem é marcada com o hash do commit. Para voltar para uma versão anterior, no servidor:

```bash
cd ~/portfolio
TAG=<hash-do-commit> docker compose -f docker-compose.prod.yml up -d
```

## Manutenção

- **Script inline e CSP**: o `<script>` do `<head>` do `index.html` é liberado na CSP por hash.
  Se alterá-lo, recalcule e atualize o `docker/nginx.conf` **e** o `vercel.json`:
  ```bash
  node -e "const s=\"document.documentElement.classList.remove('no-js');\";console.log(require('crypto').createHash('sha256').update(s).digest('base64'))"
  ```
- **Validar HTML** antes do push: `npx html-validate@9 index.html credito/index.html`
- **Selo "Desenvolvido por"** para sites de clientes: `credito/index.html`

<br>

---

<div align="center">

Desenvolvido por **Gustavo Martins** · Analista de Sistemas · Fullstack & DevOps

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavomartinsc)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/gusmcardoso)

<sub>Código publicado para fins de portfólio. Todos os direitos reservados.</sub>

</div>
