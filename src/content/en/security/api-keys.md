---
title: API Key Cryptographic Management
description: How per-sensor keys are generated, hashed with SHA-256, and audited.
---

API keys are generated with high-entropy CSPRNG (`betty_live_...`). Betty only stores the SHA-256 hash in `sensors.api_key_hash`. Raw API keys are never written to disk or printed in server logs.
