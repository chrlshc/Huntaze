# Three.js Emergency Procedures

## Quick Response Guide

This document provides emergency procedures for Three.js related issues in production.

## 🚨 Emergency Contacts

- **Development Team**: [Your team contact]
- **DevOps Team**: [DevOps contact]
- **On-call Engineer**: [On-call contact]

## 🔥 Critical Issues Response

### 1. WebGL Context Loss (Critical)

**Symptoms:**
- Black screens instead of 3D content
- "WebGL context lost" errors in console
- All 3D components failing to render

**Immediate Actions:**
```bash
# 1. Check monitoring dashboard
curl https://your-domain.com/api/monitoring/three-js-errors

# 2. Verify error scope
npm run three:health

# 3. If widespread, initiate rollback
npm run three:rollback:force
```

**Root Causes:**
- GPU driver issues
- Memory exhaustion
- Browser compatibility problems
- Faulty Three.js update

### 2. Performance Degradation (High)

**Symptoms:**
- Frame rates below 30 FPS
- Browser freezing during 3D interactions
- High CPU/GPU usage

**Immediate Actions:**
```bash
# 1. Check performance metrics
npm run test:three:performance

# 2. Validate current setup
npm run three:health:report

# 3. If performance is severely impacted
npm run three:rollback
```

### 3. Rendering Errors (Medium)

**Symptoms:**
- 3D models not loading
- Textures missing or corrupted
- Shader compilation errors

**Immediate Actions:**
```bash
# 1. Validate Three.js installation
npm run three:validate

# 2. Check for dependency conflicts
npm ls three @react-three/fiber @react-three/drei

# 3. Test component compatibility
npm run three:test
```

## 🔄 Rollback Procedures

### Automatic Rollback (Recommended)

```bash
# Full automatic rollback with confirmation
npm run three:rollback

# Force rollback without confirmation (emergency)
npm run three:rollback:force
```

### Manual Rollback

```bash
# 1. Uninstall current versions
npm uninstall three @react-three/fiber @react-three/drei

# 2. Install previous working versions
npm install three@^0.169.0 @react-three/fiber@^8.17.10 @react-three/drei@^9.114.3

# 3. Validate rollback
npm run three:health
```

### Rollback Validation Checklist

- [ ] Dependencies installed correctly
- [ ] No peer dependency conflicts
- [ ] Three.js imports working
- [ ] Basic 3D components rendering
- [ ] Performance within acceptable range
- [ ] Build process successful
- [ ] Tests passing

## 📊 Monitoring and Diagnostics

### Health Check Commands

```bash
# Complete health validation
npm run three:health

# Generate detailed report
npm run three:health:report

# Check monitoring status
npm run three:monitor

# Validate Amplify deployment
npm run amplify:validate
```

### Monitoring Dashboard

Access the Three.js health dashboard at:
- **Local**: `http://localhost:3000/admin/three-js-health`
- **Production**: `https://your-domain.com/admin/three-js-health`

### Key Metrics to Monitor

1. **Error Rate**: Should be < 1% of page loads
2. **Frame Rate**: Should maintain > 30 FPS
3. **Memory Usage**: Should not exceed 100MB per scene
4. **Load Time**: Three.js imports should load < 2 seconds

## 🛠️ Troubleshooting Steps

### Step 1: Identify Issue Scope

```bash
# Check if issue is widespread
curl -s https://your-domain.com/api/monitoring/three-js-errors | jq '.errorsByType'

# Check specific component
npm run test:three -- --grep "ComponentName"
```

### Step 2: Validate Environment

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version   # Should be 8+

# Check React version
npm list react react-dom
```

### Step 3: Test Dependencies

```bash
# Validate Three.js installation
node -e "console.log(require('three').REVISION)"

# Test React Three Fiber
node -e "require('@react-three/fiber')"

# Test React Three Drei
node -e "require('@react-three/drei')"
```

### Step 4: Component-Level Testing

```bash
# Run Three.js specific tests
npm run test:three

# Run performance benchmarks
npm run test:three:performance

# Test individual components
npm test -- tests/unit/three-js/specific-component.test.ts
```

## 🚀 Recovery Procedures

### After Rollback

1. **Immediate Validation**
   ```bash
   npm run three:health
   npm run build
   npm test
   ```

2. **Deploy to Staging**
   ```bash
   # Test in staging environment
   npm run build
   # Deploy to staging
   # Validate 3D functionality
   ```

3. **Production Deployment**
   ```bash
   # Only after staging validation
   npm run build
   # Deploy to production
   # Monitor for 30 minutes
   ```

### Post-Incident Analysis

1. **Document the Issue**
   - What triggered the problem?
   - What was the impact?
   - How long did resolution take?

2. **Review Monitoring Data**
   ```bash
   # Generate incident report
   npm run three:health:report
   ```

3. **Update Procedures**
   - Update this document with lessons learned
   - Improve monitoring if gaps identified
   - Update rollback procedures if needed

## 📋 Emergency Checklist

### Before Rollback
- [ ] Confirm issue is Three.js related
- [ ] Check monitoring dashboard
- [ ] Estimate impact scope
- [ ] Notify stakeholders
- [ ] Backup current state

### During Rollback
- [ ] Execute rollback procedure
- [ ] Validate rollback success
- [ ] Test critical 3D functionality
- [ ] Monitor error rates
- [ ] Confirm performance metrics

### After Rollback
- [ ] Notify stakeholders of resolution
- [ ] Document incident details
- [ ] Schedule post-mortem meeting
- [ ] Plan fix for root cause
- [ ] Update monitoring if needed

## 🔗 Quick Links

### Documentation
- [Upgrade Guide](./REACT_THREE_DEPS_UPGRADE_GUIDE.md)
- [Troubleshooting Guide](./THREE_JS_TROUBLESHOOTING_GUIDE.md)
- [API Changes](./THREE_JS_API_CHANGES.md)
- [Developer Guide](./THREE_JS_DEVELOPER_README.md)

### Monitoring
- [Health Dashboard](/admin/three-js-health)
- [Error API](/api/monitoring/three-js-errors)
- [Performance Metrics](/api/monitoring/three-js-performance)

### External Resources
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei GitHub](https://github.com/pmndrs/drei)

## 📞 Escalation Matrix

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | 15 minutes | On-call engineer |
| High | 1 hour | Development team lead |
| Medium | 4 hours | Development team |
| Low | Next business day | Standard support |

---

**Last Updated**: November 3, 2025  
**Version**: 1.0  
**Review Schedule**: Monthly  
**Owner**: Development Team