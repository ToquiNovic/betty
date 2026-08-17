---
title: REST API Reference
description: HTTP endpoint catalog, authentication headers, and standard response envelopes.
---

## 🔒 Authentication

Include the JWT token in the `Authorization` header:

```http
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

---

## 📦 Standard Response Envelope (`ApiResponseDto`)

```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-08-17T04:45:00.000Z"
}
```
