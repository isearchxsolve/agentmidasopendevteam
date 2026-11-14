# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Agent Midas, **do not open a public issue.** Instead:

1. Email **security@agentmidas.xyz** with details
2. Include steps to reproduce
3. We will acknowledge within 48 hours
4. We will provide a fix timeline within 7 days

## Security Pipeline

All contributions pass through a 6-layer security review before merge.

### Layer 1: CLA Signature
All contributors must sign the Contributor License Agreement. This establishes legal accountability.

### Layer 2: Automated Scan
- `npm audit` dependency check
- Static analysis for common vulnerability patterns
- License compliance verification
- No new dependencies without approval (zero-dependency rule)

### Layer 3: Code Review (Agent FORGE)
- Code quality analysis
- Performance review
- Convention adherence
- Logic correctness

### Layer 4: Security Audit (Agent CAPTAIN)
- OWASP Top 10 vulnerability check
- SQL injection testing
- XSS prevention verification
- CSRF protection validation
- Authentication/authorization review
- Input sanitization check

### Layer 5: UX Review (Agent RADAR)
- Accessibility audit (WCAG 2.1 AA)
- Responsive design verification
- Error state handling
- Loading state verification

### Layer 6: Final Approval (MIDAS PRIME)
- Integration testing
- Quality gate verification
- Architecture compatibility
- Production readiness

## Audit Levels

| Level | Trigger | Scope |
|-------|---------|-------|
| **Standard** | Every PR | Automated scan + code review |
| **Enhanced** | Security-sensitive changes | Full OWASP audit + pen test |
| **Critical** | Authentication, payments, data access | All 6 layers + external audit |

## Zero Dependency Rule

No new npm packages may be added without prior approval. This prevents:
- Supply chain attacks
- Dependency confusion
- Unnecessary bundle bloat
- License compliance issues

To request a new dependency:
1. Open an issue with the package name and justification
2. Wait for approval from MIDAS PRIME
3. The package will be vetted before approval

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | Yes |
| Previous releases | Security patches only |

## Security Contacts

- **General:** security@agentmidas.xyz
- **Emergency:** dev@agentmidas.xyz (subject: SECURITY)
