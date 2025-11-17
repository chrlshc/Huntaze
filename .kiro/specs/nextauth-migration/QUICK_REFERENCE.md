# NextAuth Migration - Quick Reference Card

## 🚀 Quick Start

### For Developers

#### Protect a Page
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return <ProtectedRoute><Content /></ProtectedRoute>;
}
```

#### Protect an API Route
```typescript
import { requireAuth } from '@/lib/auth/api-protection';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;
  // Use user.id, user.email, etc.
}
```

#### Use Session in Component
```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthSession();
  return <div>Welcome {user?.name}</div>;
}
```

### For Operations

#### Deploy to Staging
```bash
./scripts/deploy-nextauth-staging.sh
```

#### Deploy to Production
```bash
./scripts/deploy-nextauth-production.sh
```

#### Check Health
```bash
curl https://app.huntaze.com/api/health
curl https://app.huntaze.com/api/auth/session
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [Migration Guide](../../docs/NEXTAUTH_MIGRATION_GUIDE.md) | Complete migration overview |
| [Troubleshooting](../../docs/NEXTAUTH_TROUBLESHOOTING.md) | Common issues & solutions |
| [Session Auth API](../../docs/api/SESSION_AUTH.md) | API authentication reference |
| [Staging Deployment](./STAGING_DEPLOYMENT_CHECKLIST.md) | Staging deployment guide |
| [Production Deployment](./PRODUCTION_DEPLOYMENT_GUIDE.md) | Production deployment guide |

## 🔍 Troubleshooting

### User Gets Logged Out
- Check SessionProvider in root layout
- Verify page wrapped with ProtectedRoute
- Check browser console for errors

### API Returns 401
- Verify `credentials: 'include'` in fetch
- Check API route uses `requireAuth()`
- Verify session cookie exists

### Session Not Persisting
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL is correct
- Clear browser cookies and retry

### TypeScript Errors
- Check `lib/types/auth.ts` for types
- Restart TypeScript server
- Clear `.next` and rebuild

## 🧪 Testing

### Run Tests
```bash
# Integration tests
npm run test:integration -- tests/integration/auth/nextauth-migration.test.ts

# Unit tests
npm run test:unit -- tests/unit/hooks/useAuthSession.test.ts

# All tests
npm run test
```

### Manual Testing Checklist
- [ ] Register new account
- [ ] Complete onboarding
- [ ] Login with existing account
- [ ] Navigate between pages
- [ ] Refresh browser
- [ ] Logout

## 📊 Monitoring

### Key Metrics
- Authentication success rate (target: >95%)
- 401 error rate (should be low)
- Session creation rate
- Page load times

### Check Logs
```bash
# Auth errors
grep -i "auth" logs.txt | grep -i "error"

# 401 errors
grep "401" logs.txt

# Session errors
grep -i "session" logs.txt | grep -i "error"
```

### Database Queries
```sql
-- Active sessions
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();

-- Users by onboarding status
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN onboarding_completed THEN 1 ELSE 0 END) as completed
FROM users;
```

## 🔄 Rollback

### Quick Rollback
```bash
# Git revert
git revert HEAD
git push origin main

# Or use platform rollback
amplify rollback
# or
vercel rollback
```

## 🆘 Support

### For Issues
1. Check [Troubleshooting Guide](../../docs/NEXTAUTH_TROUBLESHOOTING.md)
2. Review application logs
3. Check database state
4. Contact development team

### For Questions
1. Review [Migration Guide](../../docs/NEXTAUTH_MIGRATION_GUIDE.md)
2. Check code examples
3. Ask in team chat

## 📋 Checklists

### Before Staging Deployment
- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables set
- [ ] Database migrations applied

### Before Production Deployment
- [ ] Staging stable for 48+ hours
- [ ] Team sign-off received
- [ ] Database backup completed
- [ ] Rollback plan reviewed

### After Deployment
- [ ] Smoke tests completed
- [ ] Logs monitored
- [ ] Metrics checked
- [ ] Team notified

## 🔐 Security

### Session Cookies
- HTTP-only (XSS protection)
- Secure in production (HTTPS only)
- SameSite=lax (CSRF protection)

### Session Duration
- With "Remember Me": 30 days
- Without "Remember Me": 24 hours

### Best Practices
- Always use `credentials: 'include'`
- Never store tokens in localStorage
- Always validate sessions server-side
- Use HTTPS in production

## 📞 Contacts

- **Development Lead**: [NAME]
- **Operations Lead**: [NAME]
- **Product Owner**: [NAME]
- **On-Call Engineer**: [NAME]

---

**Version**: 1.0  
**Last Updated**: November 16, 2025  
**Status**: ✅ Ready for Deployment
