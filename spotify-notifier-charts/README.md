# Spotify Podcast Notifier Bot Helm Chart

This Helm chart deploys the Spotify Podcast Notifier Bot, a Telegram bot that
notifies users about new Spotify podcast episodes.

## Prerequisites

- Kubernetes 1.12+
- Helm 3.0+
- PV provisioner support in the underlying infrastructure (for persistent
  volume)
- TLS certificate (for HTTPS) or cert-manager installed with a ClusterIssuer

## Configuration

### Local values file

This chart uses a `values.local.yaml` file for sensitive configuration that
should not be committed to version control. This file is excluded from git via
the `.gitignore` file.

Before deploying, create a `values.local.yaml` file with the following
structure:

```yaml
# Environment variables for the application
env:
    - name: TELEGRAF_TOKEN
      value: "your-telegram-bot-token"
    - name: FETCHING_DURATION
      value: "35" # in minutes
    - name: SENDING_DURATION
      value: "33" # in minutes
    - name: SPOTIFY_CLIENT_ID
      value: "your-spotify-client-id"
    - name: SPOTIFY_CLIENT_SECRET
      value: "your-spotify-client-secret"
    - name: DOMAIN_URL
      value: "https://your-domain.com"

# Domain-specific settings for ingress
ingress:
    hosts:
        - host: your-domain.com
          paths:
              - path: /
                pathType: ImplementationSpecific
    tls:
        - secretName: spotify-notifier-ssl
          hosts:
              - your-domain.com
```

### HTTPS Configuration

The chart is configured to use HTTPS by default, using cert-manager with the
`letsencrypt-production` ClusterIssuer. If you need to modify these TLS
settings, you can override the following values in your values.local.yaml:

```yaml
# TLS configuration
tls:
    enabled: true
    certSource: secret
    secret:
        secretName: spotify-notifier-ssl

# Ingress configuration
ingress:
    className: "traefik"
    annotations:
        cert-manager.io/cluster-issuer: "letsencrypt-production"
```

**Important**: Your domain settings (hosts, TLS hosts) should be configured in
values.local.yaml to keep them environment-specific.

## Installation

To install the chart with the release name `spotify-notifier`:

```bash
helm upgrade spotify-notifier ./spotify-notifier-charts --install -f ./spotify-notifier-charts/values.local.yaml -n spotify-notifier --create-namespace
```

This command will:

- Create a new release named `spotify-notifier`
- Use the `--install` flag to install the release if it doesn't exist
- Apply the values from the local values file
- Create the namespace `spotify-notifier` if it doesn't exist

## Upgrading

To upgrade the deployment:

```bash
helm upgrade spotify-notifier ./spotify-notifier-charts -f ./spotify-notifier-charts/values.local.yaml -n spotify-notifier -i --create-namespace
```

## Uninstalling

To delete the `spotify-notifier` deployment:

```bash
helm delete spotify-notifier -n spotify-notifier
```

## Parameters

The following table lists the configurable parameters of the Spotify Podcast
Notifier Bot chart and their default values:

| Parameter               | Description                              | Default                                                    |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `replicaCount`          | Number of replicas                       | `1`                                                        |
| `image.repository`      | Image repository                         | `lexermal/spotify-podcast-notifier-bot`                    |
| `image.pullPolicy`      | Image pull policy                        | `Always`                                                   |
| `image.tag`             | Image tag                                | `""`                                                       |
| `nameOverride`          | String to partially override chart name  | `spotify-podcast-notifier-bot`                             |
| `fullnameOverride`      | String to fully override deployment name | `spotify-podcast-notifier-bot`                             |
| `service.type`          | Kubernetes Service type                  | `ClusterIP`                                                |
| `service.port`          | Service HTTP port                        | `3000`                                                     |
| `tls.enabled`           | Enable TLS/HTTPS                         | `true`                                                     |
| `tls.certSource`        | Source of TLS certificates               | `secret`                                                   |
| `tls.secret.secretName` | Name of TLS secret                       | `spotify-notifier-ssl`                                     |
| `ingress.enabled`       | Enable ingress controller resource       | `true`                                                     |
| `ingress.className`     | Ingress class name                       | `traefik`                                                  |
| `ingress.annotations`   | Ingress annotations                      | `{cert-manager.io/cluster-issuer: letsencrypt-production}` |
| `ingress.hosts`         | Ingress hostnames                        | Set in values.local.yaml                                   |
| `ingress.tls`           | Ingress TLS configuration                | Set in values.local.yaml                                   |
| `volumes`               | Additional volumes                       | PVC for data storage                                       |
| `volumeMounts`          | Additional volumeMounts                  | Mount for data storage                                     |

For a full list of parameters, see the `values.yaml` file.
