# auth.md

> Authentication and agent registration information for milkyway.center

## Status

This site is **fully public**. No authentication is required to access any content or endpoints.

## Agent Audience

AI agents, crawlers, and automated tools seeking information about the V131 Topological Photonic Cipher, FPGA-native physical-layer security, and hardware-validated deterministic encryption.

## Agent Access

All resources are freely accessible without registration or credentials:

| Endpoint | Method | Auth Required |
|----------|--------|---------------|
| `/` | GET | No |
| `/index.md` | GET | No |
| `/.well-known/api-catalog` | GET | No |
| `/.well-known/agent-skills/index.json` | GET | No |
| `/.well-known/mcp/server-card.json` | GET | No |
| `/.well-known/oauth-protected-resource` | GET | No |
| `/.well-known/oauth-authorization-server` | GET | No |
| `/agent/register` | POST | No |

## agent_auth

```yaml
agent_auth:
  skill: https://www.milkyway.center/auth.md
  register_uri: https://www.milkyway.center/agent/register
  claim_uri: https://www.milkyway.center/agent/register
  identity_types_supported:
    - anonymous
  anonymous:
    credential_types_supported:
      - bearer
```

## Discovery Documents

- OAuth Protected Resource: `/.well-known/oauth-protected-resource`
- OAuth Authorization Server: `/.well-known/oauth-authorization-server`
- OpenID Configuration: `/.well-known/openid-configuration`

## Contact

- Email: yuanjimaster@gmail.com
- Website: https://milkyway.center
