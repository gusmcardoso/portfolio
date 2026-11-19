# syntax=docker/dockerfile:1
# Imagem do portfólio: site estático servido por Nginx sem privilégios de root.
FROM nginxinc/nginx-unprivileged:1.31-alpine

LABEL org.opencontainers.image.title="portfolio" \
      org.opencontainers.image.description="Portfólio de Gustavo Martins — Fullstack & DevOps" \
      org.opencontainers.image.source="https://github.com/gusmcardoso/portfolio"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Só o que é público vai para a imagem (o resto é filtrado também pelo .dockerignore)
COPY index.html /usr/share/nginx/html/
COPY assets/    /usr/share/nginx/html/assets/
COPY credito/   /usr/share/nginx/html/credito/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
