# Data Subject Rights (DSR) Procedures

## Overview

This document describes how to handle Data Subject Requests (DSR) under GDPR Articles 15-22.

**Response Time:** < 30 days (typically immediate)  
**Contact:** dsr@huntaze.com

---

## Supported Rights

### 1. Right to Access (Article 15)

**Request:** User wants to know what data we have about them.

**Endpoint:** `GET /api/admin/dsr/export?userId={userId}`

**Process:**
1. Verify user identity
2. Export all onboarding data
3. Provide data in JSON format
4. Include metadata (export date, record counts)

**Example:**
```bash
curl -X GET "/api/admin/dsr/export?userId=user-123" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "exportedAt": "2024-11-11T12:00:00Z",
    "onboarding_progress": [...],
    "onboarding_events": [...],
    "metadata": {
      "totalSteps": 5,
      "completedSteps": 3,
      "progress": 60
    }
  }
}
```

### 2. Right to Rectification (Article 16)

**Request:** User wants to correct their data.

**Endpoint:** `PATCH /api/onboarding/steps/:id`

**Process:**
1. User updates step status via normal API
2. Changes are immediate
3. No special procedure needed

### 3. Right to Erasure (Article 17)

**Request:** User wants their data deleted.

**Endpoint:** `POST /api/admin/dsr/delete`

**Process:**
1. Verify user identity
2. Check for legal obligations to retain data
3. Delete all onboarding data
4. Log deletion for audit
5. Confirm deletion to user

**Example:**
```bash
# Preview what would be deleted
curl -X GET "/api/admin/dsr/delete?userId=user-123" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Execute deletion
curl -X POST "/api/admin/dsr/delete" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "confirm": true}'
```

**Response:**
```json
{
  "success": true,
  "message": "User onboarding data deleted successfully",
  "deleted": {
    "events": 15,
    "progress": 5,
    "total": 20
  },
  "deletedAt": "2024-11-11T12:00:00Z"
}
```

### 4. Right to Restriction (Article 18)

**Request:** User wants to restrict processing.

**Implementation:** Activate kill switch for specific user

**Process:**
1. Add user to restriction list
2. Disable onboarding for that user
3. Maintain data but don't process
4. Document restriction reason

### 5. Right to Data Portability (Article 20)

**Request:** User wants data in machine-readable format.

**Endpoint:** Same as Right to Access

**Format:** JSON (machine-readable)

**Process:**
1. Export data via DSR export endpoint
2. Provide in structured JSON format
3. Include all personal data
4. User can import to another service

### 6. Right to Object (Article 21)

**Request:** User objects to processing.

**Implementation:** User can opt-out via settings

**Process:**
1. User disables onboarding in settings
2. Kill switch activated for user
3. No further processing occurs
4. Data retained per retention policy

---

## Request Handling Workflow

### Step 1: Receive Request

**Channels:**
- Email: dsr@huntaze.com
- Support ticket
- User settings page

**Required Information:**
- User ID or email
- Type of request
- Identity verification

### Step 2: Verify Identity

**Methods:**
- Email verification link
- Account login
- Support ticket verification

**Security:**
- Never process requests without verification
- Log all verification attempts
- Use secure channels only

### Step 3: Process Request

**Timeline:**
- Acknowledge: < 24 hours
- Complete: < 30 days (typically immediate)

**Actions:**
- Execute appropriate endpoint
- Document in audit log
- Prepare response

### Step 4: Respond to User

**Response Includes:**
- Confirmation of action taken
- Data export (if applicable)
- Next steps (if any)
- Contact for questions

### Step 5: Document

**Audit Log:**
- Request type
- User ID
- Date received
- Date completed
- Action taken
- Staff member who processed

---

## Special Cases

### Deletion with Legal Obligations

If we must retain data for legal reasons:

1. Inform user of obligation
2. Explain legal basis
3. Restrict processing instead
4. Delete when obligation ends

**Example Legal Obligations:**
- Tax records (7 years)
- Fraud prevention (varies)
- Legal disputes (until resolved)

### Requests for Deceased Users

1. Verify relationship to deceased
2. Check local laws
3. Process according to jurisdiction
4. Document special handling

### Requests from Minors

1. Verify parental consent
2. Process with extra care
3. Prioritize deletion requests
4. Document age verification

---

## API Documentation

### Export Endpoint

```typescript
POST /api/admin/dsr/export
Content-Type: application/json

{
  "userId": "user-123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": "user-123",
    "exportedAt": "2024-11-11T12:00:00Z",
    "onboarding_progress": [...],
    "onboarding_events": [...]
  }
}
```

### Delete Endpoint

```typescript
POST /api/admin/dsr/delete
Content-Type: application/json

{
  "userId": "user-123",
  "confirm": true
}

Response: 200 OK
{
  "success": true,
  "message": "User onboarding data deleted successfully",
  "deleted": {
    "events": 15,
    "progress": 5,
    "total": 20
  }
}
```

---

## Compliance Checklist

- [ ] Identity verified
- [ ] Request type identified
- [ ] Legal obligations checked
- [ ] Action executed
- [ ] User notified
- [ ] Audit log updated
- [ ] Response sent within 30 days

---

## Contact Information

**Data Subject Requests:**  
Email: dsr@huntaze.com  
Response Time: < 24 hours (acknowledgment)

**Data Protection Officer:**  
Email: dpo@huntaze.com  
Phone: [Phone]

**Escalation:**  
If request cannot be fulfilled, escalate to DPO immediately.

---

## Related Documentation

- [GDPR Data Processing Registry](./GDPR_DATA_PROCESSING_REGISTRY.md)
- [Data Retention Policy](./DATA_RETENTION_POLICY.md)
- [Privacy Policy](https://huntaze.com/privacy)
