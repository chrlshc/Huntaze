# Huntaze API Documentation

Welcome to the Huntaze API documentation. This directory contains comprehensive guides for integrating with the Huntaze CRM API.

## 📚 Documentation Files

### Core Documentation

1. **[API Reference](../API_REFERENCE.md)** - Complete API endpoint reference
   - All endpoints with request/response examples
   - Authentication and rate limiting
   - Data types and field descriptions
   - Quick start guide

2. **[OpenAPI Specification](./openapi.yaml)** - Machine-readable API spec
   - OpenAPI 3.0 format
   - Import into Postman, Swagger, or other tools
   - Complete schema definitions

3. **[Integration Guide](./INTEGRATION_GUIDE.md)** - Developer integration guide
   - Step-by-step integration instructions
   - Complete code examples in JavaScript
   - Best practices and patterns
   - Troubleshooting common issues

4. **[Instagram Webhook Guide](./INSTAGRAM_WEBHOOK_GUIDE.md)** - Instagram webhook integration
   - Meta Developer Console setup
   - Webhook verification flow
   - Event types and examples
   - Security and signature verification
   - Testing and troubleshooting

5. **[Error Codes Reference](./ERROR_CODES.md)** - Complete error code documentation
   - All HTTP status codes
   - Error messages by endpoint
   - Error handling best practices
   - Common error scenarios with solutions

## 🚀 Quick Start

### 1. Authentication

All API requests require authentication via JWT token in cookies:

```javascript
const response = await fetch('/api/crm/fans', {
  credentials: 'include' // Include authentication cookies
});
```

### 2. List Fans

```javascript
const response = await fetch('/api/crm/fans', {
  credentials: 'include'
});
const { fans } = await response.json();
```

### 3. Create Fan

```javascript
const response = await fetch('/api/crm/fans', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    platform: 'onlyfans',
    platform_id: 'of_john_123'
  })
});
const { fan } = await response.json();
```

## 📖 Documentation Structure

```
docs/
├── API_REFERENCE.md          # Main API reference
└── api/
    ├── README.md             # This file
    ├── openapi.yaml          # OpenAPI 3.0 spec
    ├── INTEGRATION_GUIDE.md  # Integration guide
    └── ERROR_CODES.md        # Error codes reference
```

## 🔑 Key Concepts

### Authentication
- JWT tokens stored in HTTP-only cookies
- Cookie names: `access_token` or `auth_token`
- Always use `credentials: 'include'` in fetch requests

### Rate Limiting
- Read endpoints: No limit
- Write endpoints: 60 requests per 60 seconds
- Returns 429 status code when exceeded

### Data Types
- **Monetary values**: Cents (USD) as integers
- **Timestamps**: ISO 8601 format (UTC)
- **IDs**: Integers
- **Database aggregates**: Strings (must parse as integers)

### Error Handling
- All errors return JSON: `{ "error": "message" }`
- Check HTTP status code first
- Implement retry logic for 429 and 5xx errors

## ⚠️ Important Notes

### Database Numeric Values

PostgreSQL aggregate functions (SUM, COUNT, AVG) return **strings**, not numbers. Always parse them:

```javascript
// ❌ Wrong
const total = result.rows[0].total_value;
expect(total).toBeGreaterThan(0); // Fails!

// ✅ Correct
const total = parseInt(result.rows[0].total_value);
expect(total).toBeGreaterThan(0); // Works!
```

This applies to:
- `SUM()` → `parseInt()`
- `COUNT()` → `parseInt()`
- `AVG()` → `parseFloat()`

## 📋 Available Endpoints

### Fans Management
- `GET /api/crm/fans` - List all fans
- `POST /api/crm/fans` - Create new fan

### Conversations
- `GET /api/crm/conversations` - List all conversations
- `POST /api/crm/conversations` - Create new conversation

### Analytics
- `GET /api/analytics/overview` - Get analytics overview

### Webhooks
- `POST /api/webhooks/instagram` - Receive Instagram webhook events
- `GET /api/webhooks/instagram` - Verify Instagram webhook

## 🛠️ Tools & Resources

### API Testing Tools

1. **Postman**
   - Import `openapi.yaml` for automatic collection generation
   - Set up environment variables for base URL and tokens

2. **Swagger UI**
   - View interactive API documentation
   - Test endpoints directly in browser

3. **cURL**
   - Command-line testing
   - Examples provided in documentation

### Code Examples

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete examples:
- Fan management class
- Conversation management class
- Analytics dashboard class
- Error handling wrapper
- Retry logic implementation

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Ensure `credentials: 'include'` is set
   - Check if authentication token exists
   - Verify token hasn't expired

2. **429 Rate Limit Exceeded**
   - Implement exponential backoff
   - Reduce request frequency
   - Cache responses when possible

3. **Numeric Type Errors**
   - Parse database aggregate results
   - Use `parseInt()` for SUM/COUNT
   - Use `parseFloat()` for AVG

4. **CORS Errors**
   - Use same-origin requests
   - Ensure credentials are included
   - Check server CORS configuration

See [ERROR_CODES.md](./ERROR_CODES.md) for detailed troubleshooting.

## 📞 Support

### Documentation
- **API Reference**: [API_REFERENCE.md](../API_REFERENCE.md)
- **Integration Guide**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Error Codes**: [ERROR_CODES.md](./ERROR_CODES.md)
- **OpenAPI Spec**: [openapi.yaml](./openapi.yaml)

### Contact
- **Email**: support@huntaze.com
- **Documentation**: https://docs.huntaze.com
- **Status Page**: https://status.huntaze.com

## 🔄 Changelog

### v1.4.2 (2025-10-31)
- ✅ Added Instagram webhook endpoint documentation
- ✅ Created comprehensive Instagram webhook integration guide
- ✅ Documented webhook signature verification
- ✅ Added Meta Developer Console setup instructions
- ✅ Documented webhook event types (media, comments, mentions)
- 📚 Updated OpenAPI spec with webhook endpoints

### v1.4.1 (2025-10-31)
- ✅ Added complete API documentation
- ✅ Created OpenAPI 3.0 specification
- ✅ Added integration guide with code examples
- ✅ Documented error codes and handling
- ✅ Fixed database numeric value parsing
- 📚 Documented PostgreSQL aggregate type behavior

### v1.4.0 (2025-10-31)
- ✅ Email verification system
- ✅ AWS SES integration
- ✅ Production deployment ready

### v1.3.0 (2025-10-31)
- ✅ PostgreSQL CRM tables
- ✅ Database migration complete
- ✅ Optimized indexes

## 📝 Contributing

When updating the API:

1. Update OpenAPI spec (`openapi.yaml`)
2. Update API reference (`API_REFERENCE.md`)
3. Update integration guide if needed
4. Add error codes to `ERROR_CODES.md`
5. Update changelog in `CHANGELOG.md`
6. Test all examples

## 🎯 Next Steps

1. **Read the API Reference**: Start with [API_REFERENCE.md](../API_REFERENCE.md)
2. **Try the Examples**: Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. **Import OpenAPI Spec**: Use [openapi.yaml](./openapi.yaml) in your tools
4. **Handle Errors**: Review [ERROR_CODES.md](./ERROR_CODES.md)
5. **Build Your Integration**: Use the code examples as templates

---

**Last Updated**: October 31, 2025  
**API Version**: 1.4.2  
**Documentation Version**: 1.1.0
