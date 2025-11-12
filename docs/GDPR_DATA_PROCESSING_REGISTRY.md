# GDPR Data Processing Registry
## Huntaze Onboarding System

**Last Updated:** November 11, 2025  
**Review Frequency:** Quarterly  
**Next Review:** February 11, 2026  
**Data Protection Officer:** dpo@huntaze.com

---

## Processing Activity: Onboarding Progress Tracking

### 1. Purpose of Processing

**Primary Purpose:**  
Guide new users through account setup and configuration by tracking their progress through required onboarding steps.

**Secondary Purposes:**
- Improve user experience by personalizing onboarding flow
- Analyze completion rates to optimize onboarding process
- Provide support team with user progress context

### 2. Legal Basis

**Legal Basis:** Legitimate Interest (GDPR Article 6(1)(f))

**Justification:**  
Processing is necessary for our legitimate interest in providing an effective onboarding experience and ensuring users properly configure their accounts. This interest is not overridden by the data subject's rights as:
- Processing is minimal and necessary
- Users expect onboarding guidance when creating accounts
- No sensitive personal data is processed
- Users can opt out via kill switch

**Alternative Basis:** Contract Performance (GDPR Article 6(1)(b))  
Processing is necessary to fulfill our contract with users by providing the service they signed up for.

### 3. Data Categories

#### Personal Data Collected

| Data Category | Examples | Source | Necessity |
|--------------|----------|--------|-----------|
| User Identifier | User ID (UUID) | Account creation | Required |
| Progress Data | Step status (todo/done/skipped) | User actions | Required |
| Timestamps | completed_at, updated_at | System generated | Required |
| Market Data | User's market (FR, US, etc.) | User profile | Required |
| Role Data | User role (owner, staff) | User profile | Required |
| Interaction Events | Step viewed, completed, skipped | User actions | Optional |

#### Data NOT Collected
- ❌ Names, emails, phone numbers
- ❌ Payment information
- ❌ Sensitive personal data (health, religion, etc.)
- ❌ Biometric data
- ❌ Location data (beyond market)

### 4. Data Subjects

**Categories:**
- New users creating Huntaze accounts
- Existing users accessing new features
- Staff members with onboarding access

**Geographic Scope:**
- European Union (GDPR applies)
- United States (CCPA may apply)
- Other markets as service expands

**Estimated Volume:** ~10,000 users/month

### 5. Data Recipients

#### Internal Recipients

| Recipient | Purpose | Access Level |
|-----------|---------|--------------|
| Product Team | Analyze completion rates | Aggregated only |
| Engineering Team | Debug issues, maintain system | Full access |
| Support Team | Assist users with onboarding | User-specific |
| Analytics Team | Improve onboarding flow | Aggregated only |

#### External Recipients

| Recipient | Purpose | Safeguards |
|-----------|---------|------------|
| None | N/A | N/A |

**Note:** No data is shared with third parties. All processing occurs within Huntaze infrastructure.

### 6. Data Transfers

**International Transfers:** None

**Storage Location:** EU (primary), with potential US backup

**Transfer Mechanisms:** N/A (no transfers outside EU)

**Future Considerations:** If US storage is implemented, Standard Contractual Clauses (SCCs) will be used.

### 7. Retention Periods

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Active Progress | While account active | Service provision |
| Completed Steps | 2 years after completion | Analytics, support |
| Interaction Events | 365 days | Analytics optimization |
| Deleted User Data | 30 days (soft delete) | Recovery period |

**Deletion Process:**
- Automated daily cleanup script
- Manual deletion via DSR endpoint
- Soft delete with 30-day recovery window
- Hard delete after retention period

### 8. Security Measures

#### Technical Measures

- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access control (role-based)
- ✅ Audit logging (all access tracked)
- ✅ Rate limiting (prevent abuse)
- ✅ CSRF protection
- ✅ Optimistic locking (data integrity)

#### Organizational Measures

- ✅ Data minimization (only necessary data)
- ✅ Purpose limitation (clear purposes)
- ✅ Access restrictions (need-to-know basis)
- ✅ Regular security audits
- ✅ Incident response plan
- ✅ Staff training on data protection

### 9. Data Subject Rights

Users can exercise the following rights:

| Right | Implementation | Response Time |
|-------|----------------|---------------|
| **Access** | GET /api/admin/dsr/export | < 30 days |
| **Rectification** | PATCH /api/onboarding/steps/:id | Immediate |
| **Erasure** | POST /api/admin/dsr/delete | < 30 days |
| **Restriction** | Kill switch activation | Immediate |
| **Portability** | JSON export via API | < 30 days |
| **Object** | Opt-out via settings | Immediate |

**Contact:** dsr@huntaze.com

### 10. Data Protection Impact Assessment (DPIA)

**DPIA Required:** No

**Justification:**
- No high-risk processing
- No sensitive personal data
- No systematic monitoring
- No large-scale processing
- No automated decision-making

**Last Assessment:** November 11, 2025  
**Next Assessment:** If processing changes significantly

### 11. Automated Decision-Making

**Automated Decisions:** None

**Profiling:** Limited to aggregated analytics only

**User Impact:** No automated decisions affect users

### 12. Data Breach Procedures

**Detection:**
- Automated monitoring and alerting
- Regular security audits
- User reports

**Response Time:**
- Internal notification: < 1 hour
- DPO notification: < 4 hours
- Supervisory authority: < 72 hours (if required)
- Data subjects: Without undue delay (if high risk)

**Incident Response Plan:** docs/INCIDENT_RESPONSE.md

### 13. Compliance Documentation

**Related Documents:**
- Privacy Policy: https://huntaze.com/privacy
- Terms of Service: https://huntaze.com/terms
- Cookie Policy: https://huntaze.com/cookies
- Data Retention Policy: docs/DATA_RETENTION_POLICY.md
- DSR Procedures: docs/DSR_PROCEDURES.md

### 14. Changes and Updates

| Date | Change | Approved By |
|------|--------|-------------|
| 2025-11-11 | Initial registry created | DPO |
| - | - | - |

### 15. Review and Approval

**Reviewed By:**
- Data Protection Officer: _________________ Date: _______
- Legal Counsel: _________________ Date: _______
- Engineering Lead: _________________ Date: _______

**Next Review Date:** February 11, 2026

---

## Appendix A: Data Flow Diagram

```
User Action (Browser)
    ↓
API Endpoint (/api/onboarding)
    ↓
Application Logic (Next.js)
    ↓
Database (PostgreSQL - EU)
    ↓
Analytics (Aggregated only)
```

## Appendix B: Data Minimization Checklist

- [x] Only collect necessary data
- [x] No sensitive personal data
- [x] Pseudonymization where possible (UUIDs)
- [x] Aggregation for analytics
- [x] Regular data cleanup
- [x] Clear retention periods

## Appendix C: Contact Information

**Data Controller:**  
Huntaze SAS  
[Address]  
Email: privacy@huntaze.com

**Data Protection Officer:**  
Email: dpo@huntaze.com  
Phone: [Phone]

**Supervisory Authority:**  
CNIL (France)  
https://www.cnil.fr
