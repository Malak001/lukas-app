# Self-hosting LiveKit for Stage 4

Luka's Stage 4 (live conversation) needs a LiveKit server to relay video/voice
between the two participants. This folder has everything to run one, either
locally for development or on a real VPS for production.

## Local development

For testing the Stage 4 flow yourself (two browser tabs, or two devices on
your own WiFi hitting `localhost`), you don't need a VPS or domain at all —
just Docker Desktop:

```bash
cd livekit
docker compose -f docker-compose.local.yml up -d
```

Then in `.env.local`:

```
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=<the value from the `devkey:` line in livekit.local.yaml>
```

Restart `npm run dev` and Stage 4 will work against this local server. Two
browser tabs (or two separate browser profiles, so you can be logged in as
two different test accounts) both hitting `http://localhost:3000` can match
and call each other.

**Limits of this setup**: it only works for participants hitting `localhost`
on the same machine — it is not reachable from other devices on your network
or the internet, and stops working the moment `docker compose down` runs.
When you're ready for real users to use Stage 4, follow the VPS steps below
instead.

## Production: self-hosted VPS

Budget ~20-30 minutes the first time.

## 1. Get a VPS

Any provider works — DigitalOcean, Hetzner, Linode are all fine. Cheapest
tier is enough to start (1 vCPU / 1-2GB RAM handles a handful of concurrent
calls). Pick **Ubuntu 22.04 or 24.04**. Note the server's public IPv4
address once it's created.

## 2. Point a domain at it

LiveKit needs a real hostname for TLS (browsers require HTTPS/WSS for
camera/mic access). If you already own a domain (e.g. for the Luka's site
itself), add an **A record** for a subdomain, e.g.:

```
livekit.yourdomain.com  →  <your VPS's public IP>
```

If you don't have a domain yet, buying one cheaply (Namecheap, Porkbun,
etc.) is the easiest path — you'll want one for the main site's deployment
later anyway.

## 3. Install Docker on the VPS

SSH into the server, then:

```bash
curl -fsSL https://get.docker.com | sh
```

That installs Docker Engine + the Compose plugin in one step.

## 4. Open the required ports

In your cloud provider's firewall panel (or `ufw` if you're managing it
yourself on the box):

| Port            | Protocol | Purpose                          |
| ---------------- | -------- | --------------------------------- |
| 80               | TCP      | Let's Encrypt HTTP challenge      |
| 443              | TCP      | HTTPS/WSS signaling (via Caddy)   |
| 7881             | TCP      | LiveKit TCP fallback for WebRTC   |
| 50000–60000      | UDP      | WebRTC media (audio/video)        |

If using `ufw`:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 7881/tcp
sudo ufw allow 50000:60000/udp
```

## 5. Generate an API key/secret pair

```bash
docker run --rm livekit/livekit-server generate-keys
```

This prints something like:

```
API Key:    APIxxxxxxxxxxxx
API Secret: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

Keep this output — you'll need it in two places below.

## 6. Copy this folder to the server and configure it

From your machine, copy `livekit/docker-compose.yml`, `livekit/livekit.yaml`,
and `livekit/Caddyfile` to a directory on the VPS (e.g. via `scp` or just
paste the contents over SSH into new files at `~/livekit/`).

Then on the server, edit the two config files:

- **`Caddyfile`** — replace `livekit.yourdomain.com` with the real subdomain
  from step 2.
- **`livekit.yaml`** — replace `REPLACE_WITH_GENERATED_API_KEY` and
  `REPLACE_WITH_GENERATED_API_SECRET` with the key/secret from step 5.

## 7. Start it

```bash
cd ~/livekit
docker compose up -d
docker compose logs -f
```

Watch the logs for a few seconds — you're looking for LiveKit reporting it's
listening, and Caddy successfully obtaining a certificate (no TLS errors).
Ctrl+C to stop tailing logs (the containers keep running).

## 8. Wire it into Luka's

In `.env.local` (on your dev machine, and later wherever you deploy the app):

```
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=<the API key from step 5>
LIVEKIT_API_SECRET=<the API secret from step 5>
```

Restart `npm run dev` so it picks up the new values. Stage 4 is ready to test.

## Notes

- **Updating**: `docker compose pull && docker compose up -d` on the server
  pulls newer LiveKit/Caddy images and restarts with zero manual config
  changes.
- **Scaling**: this is a single-node setup — fine for testing and a modest
  number of concurrent calls. LiveKit's docs cover multi-node clustering if
  you outgrow it.
- **NAT/firewalls**: `use_external_ip: true` handles the common case of a
  VPS with a direct public IP. Users on very restrictive corporate networks
  that block UDP outright may still have trouble connecting — a TURN server
  fixes that, but is out of scope for the initial setup.
