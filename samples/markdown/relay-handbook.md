---
title: Relay Operations Handbook
revision: 2026.9
tags: [relay, telemetry, runbook]
---

# Relay Operations Handbook

A field guide to the telemetry relay: how it **starts**, what it _reports_,
and what to do when it `stalls`. Read the [escalation path](#escalation)
before paging anyone, or see <https://relay.esper.invalid/docs>.

> Operators are on call for the relay, not for the fleet.
> If the relay is reporting an unhealthy fleet correctly, it is working.

## Design constraints

1. Frames are append-only; a frame is never rewritten after acknowledgement.
2. The journal is the source of truth, and the socket is a convenience.
3. Backpressure is visible: a slow reader ~~is dropped~~ stalls the writer.

- Timers use monotonic clocks only.
- Retries are capped at five attempts.
  - Backoff is exponential, with jitter drawn once per attempt.
- [x] Journal fsync on acknowledgement
- [ ] Multi-region replication

### Configuration

| Setting | Default | Environment | Notes |
| --- | --- | --- | --- |
| `socket.path` | `/run/relay.sock` | `RELAY_SOCKET_PATH` | Local filesystems only |
| `journal.dir` | `/var/lib/relay` | `RELAY_JOURNAL_DIR` | Needs 2 GB free |
| `log.level` | `info` | `RELAY_LOG_LEVEL` | `trace` is extremely loud |

#### Reading telemetry

```typescript
import { RelayClient, type Frame } from "@esper/relay";

const client = new RelayClient({ socketPath: "/run/relay.sock" });

client.on("frame", (frame: Frame): void => {
  if (frame.severity >= 3) {
    console.warn(`relay: ${frame.source} reported ${frame.code}`);
  }
});

await client.connect();
```

A one-shot read from the shell is fine for spot checks:

```bash
# Tail the last twenty frames and pretty-print them.
relayctl tail --limit 20 --format json | jq '.frames[] | {source, code}'
```

##### Escalation

If `relayctl status` reports `degraded` for more than **five minutes**:

1. Capture state: `relayctl dump --output /tmp/relay-dump.tar.gz`
2. Check the journal directory for free space.
3. Restart the service with `systemctl restart relay`.
4. If the restart fails twice, page the owner listed in [the rotation][rotation].

<!-- The rotation lives in the ops repo, not here, so it stays a reference. -->

***

###### Reference

Escape a literal asterisk with `\*` when you need one. Footnotes[^1] are
supported by the renderer but not by the editor preview.

![Relay topology diagram](./images/relay-topology.png "Relay topology")

[rotation]: https://ops.esper.invalid/rotation "On-call rotation"
[^1]: Footnote syntax requires the `markdown-it-footnote` plugin.
