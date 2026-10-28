---
status: proposed
---

# Host owns step approval; file tools enforce the final target

The proposed implementation suspends the actual file tool at the Host-owned approval boundary. An approval carries its own operation identity and version, even though clarification and approval both project the existing `awaiting_user` request status. A separate approval endpoint prevents an ordinary question answer from authorizing access. Persisted answers and continuing file scopes belong to one Chat; no missing answer authorizes work.

The Local Web app owns permission persistence in its existing database and injects request-scoped authorization into file tools. This keeps current package responsibilities while the architecture remains under review. A separate security package is deferred until another application needs the policy. Filesystem validation remains responsible for canonical targets, blocked application roots, links and identity checks immediately around reads; an approval cannot bypass those checks. Continuing scopes currently name one exact file, so no hidden parent-folder grant is created.

Preset and grant changes apply to later requests. An active request keeps its captured preset and grants; explicit approval may extend that request only by the named read. Host restart preserves interrupted state without replaying the tool. Attachments, named references and network research must use the same authorization principle when those capabilities are added.
