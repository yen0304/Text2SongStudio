# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Text2Song Studio, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the security team at: security@your-org.com (replace with actual email)
3. Or use GitHub's private vulnerability reporting feature

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Disclosure Policy

- We will acknowledge your contribution in the release notes (unless you prefer to remain anonymous)
- We ask that you give us reasonable time to address the issue before public disclosure
- We will coordinate with you on the disclosure timeline

## Security Best Practices for Users

### Deployment

- Always use HTTPS in production
- Keep dependencies updated
- Use strong database credentials
- Configure proper firewall rules
- Enable authentication for API access

### Model Security

- Be cautious when loading untrusted model files
- Validate adapter files before use
- Monitor resource usage during generation

### Data Security

- Regularly backup your database
- Encrypt sensitive data at rest
- Implement proper access controls
- Review audit logs periodically

## Known Security Considerations

### Audio Generation

- Generated audio may consume significant disk space
- Implement storage quotas in production
- Consider rate limiting for generation endpoints

### User Input

- Text prompts are sanitized before processing
- File uploads are validated for type and size
- API inputs are validated using Pydantic schemas

Thank you for helping keep Text2Song Studio secure.
