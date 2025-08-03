---
title: Self-hosting n8n with Kamal
summary: A practical guide to deploying n8n workflow automation using Kamal for simple, container-based deployments
author: Paul Koerbitz <paul@koerbitz.me>
date: 2025-08-03
---

[n8n] is a powerful workflow automation tool that lets you connect various services and automate tasks. While n8n offers a cloud solution, self-hosting gives you complete control over your data and workflows. [Kamal] is a deployment tool that makes it simple to deploy containerized applications to your own servers. Here's how to combine them for a simple self-hosted setup.

The setup here is not quite optimal, there is a bunch of repetition between the file (e.g. the port and hostname appears again and again
and I'm sure this could be reduced). But this is running well enough and I'm not looking to invest the time to optimze this further at
this point, so here we go...

## Why Self-host n8n?

Self-hosting n8n offers several advantages:
- **Data privacy**: Your workflow data stays on your infrastructure
- **Cost control**: No per-execution fees or user limits
- **Customization**: Full control over the environment and configurations
- **Integration freedom**: Connect to internal services without exposing them

## Why Self-host using kamal?

I already have a server where I'm running a number of different apps behind kamal-proxy and also
I really like kamal for it's simplicity in deploying apps, auto-configuring TLS/SSL certificates
and for updating apps in the future.

## How we'll do this

Apart from Docker, kamal and n8n, I'll use the github container registry (but I assume this would
similary work with other registries).

Overall, the deployment is pretty simple, we'll just need a few pretty simple files things:

1. an `.env` file where we will store our secrets
2. a `.gitignore` so we don't commit `.env` to git
3. a `Dockerfile` that builds on the n8n image and
4. a `config/deploy.yml` file to configure the deployment for kamal.
5. a `.kamal/secrets` file that tells kamal which secrets to forward to the server

## The `.env` file

The .env file holds secret keys you don't want to commit or otherwise share (there are
better setups than this, e.g. using a password manager, but this is the simplest):

```
export N8N_ENCRYPTION_KEY=SECRET_N8N_ENCRYPTION_KEY
export KAMAL_REGISTRY_PASSWORD=SECRET_PASSWORD_FOR_CONTAINER_REGISTRY
```

## Setting up the Dockerfile

The setup starts with a simple Dockerfile that extends the official n8n image:

```dockerfile
FROM n8nio/n8n:latest

ENV NODE_ENV=production
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV N8N_HOST=<YOUR_HOSTNAME_HERE>

EXPOSE 5678
```

This configuration:
- Uses the latest official n8n image as the base
- Sets production environment variables
- Configures n8n to run on port 5678 with HTTPS
- Exposes the application port for external access

### Local Development with Docker Compose

For local development and testing, a `compose.yml` file provides an easy way to run n8n:

```yaml
services:
  n8n:
    build: .
    ports:
      - "5678:5678"
    env_file:
      - .env
    volumes:
      - ~/.n8n:/home/node/.n8n
```

You can run this with `docker compose up`, this will initially download the n8n image, build the
new docker image and run the container for you. It maps the `~/.n8n` file to `/home/node/.n8n`
inside the container.

Specifying the volume is actually pretty important - if you don't specify it then n8n will
still write to that directory in the container, but will lose the data when the container
is re-created.

## Production Deployment with Kamal

The real magic happens in the Kamal deployment configuration (`config/deploy.yml`). I'm
using Githubs container registry ghcr.io here, but any other registry should work as well.


```yaml
service: n8n
image: YOUR_GITHUB_USERNAME/n8n

servers:
  - YOUR_SERVER_IP

proxy:
  ssl: true
  host: YOUR_DOMAIN_NAME
  app_port: 5678
  healthcheck:
    path: /healthz # health check path for n8n

registry:
  username: YOUR_GITHUB_USERNAME
  server: ghcr.io # change if using a different registrry
  password:
    - KAMAL_REGISTRY_PASSWORD

builder:
  arch: amd64

env:
  clear:
    N8N_PROTOCOL: https
    N8N_HOST: YOUR_DOMAIN_NAME
    N8N_PORT: 5678
    N8N_BASIC_AUTH_ACTIVE: true
    WEBHOOK_URL: https://YOUR_DOMAIN_NAME/ # Needed, otherwise the 5678 port shows up in webhooks (e.g. for oauth)

  secret:
    - N8N_BASIC_AUTH_PASSWORD
    - N8N_ENCRYPTION_KEY

# Use this if you use a non-standard ssh config (e.g. not using port 22)
ssh:
  config: true
  user: YOUR_SSH_USER
  port: YOUR_PORT

volumes:
  - n8n_data:/home/node/.n8n # Map /home/node/.n8n to the named volume `n8n_data`
```

Two important points on this config:

1. Specify the volume, otherwise your instance will be very forgetful and will lose all data after each re-deploy.
2. Specify the webhook URL, otherwise the 5678 port will show up in webhook URLs and this will not work because the
    the reverse proxy takes care of the port mapping (so it's not actually needed in the domain).

## Deploying...

If you have kamal(-proxy) running on your server, you should be able to deploy this with `kamal deploy`. If not
you may have to run `kamal setup` first to get your server ready.

Happy automating ;)

[n8n]: https://n8n.io
[Kamal]: https://kamal-deploy.org