# Security Utilities

This module provides security utilities for input sanitization and XSS prevention in the EarnButton application.

## Functions

### `sanitizeInput(input: string): string`

Sanitizes user input by escaping characters that could be used for XSS (Cross-Site Scripting) attacks.

**Requirements**: 12.5 - Validates that all user inputs are sanitized to prevent XSS attacks

**Parameters**:
- `input` (string): The user input string to sanitize

**Returns**: 
- (string): The sanitized string with XSS characters escaped

**Escaped Characters**:
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

**Examples**:

```typescript
import { sanitizeInput } from '@/lib'

// Basic usage
const userInput = '<script>alert("XSS")</script>'
const safe = sanitizeInput(userInput)
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'

// Sanitizing user comments
const comment = 'Great vault! <3 Check out <a href="http://evil.com">this</a>'
const safeComment = sanitizeInput(comment)
// Result: 'Great vault! &lt;3 Check out &lt;a href=&quot;http:&#x2F;&#x2F;evil.com&quot;&gt;this&lt;&#x2F;a&gt;'

// Sanitizing vault names
const vaultName = 'USDC Vault <High Yield> & "Safe"'
const safeName = sanitizeInput(vaultName)
// Result: 'USDC Vault &lt;High Yield&gt; &amp; &quot;Safe&quot;'

// Non-string inputs return empty string
sanitizeInput(null)      // ''
sanitizeInput(undefined) // ''
sanitizeInput(123)       // ''
```

## Usage Guidelines

### When to Use

Always sanitize user input before:
1. Displaying it in the UI
2. Storing it in state
3. Passing it to other components
4. Using it in any context where it could be rendered as HTML

### Common Use Cases

**Form Inputs**:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const rawInput = e.currentTarget.value
  const safeInput = sanitizeInput(rawInput)
  // Use safeInput for further processing
}
```

**User Comments/Descriptions**:
```typescript
const UserComment = ({ comment }: { comment: string }) => {
  const safeComment = sanitizeInput(comment)
  return <p>{safeComment}</p>
}
```

**Vault Names/Metadata**:
```typescript
const displayVaultName = (vault: VaultMetadata) => {
  return sanitizeInput(vault.name)
}
```

**Search Queries**:
```typescript
const handleSearch = (query: string) => {
  const safeQuery = sanitizeInput(query)
  performSearch(safeQuery)
}
```

## Security Considerations

### What This Function Does
- Escapes HTML special characters to prevent XSS attacks
- Handles common XSS attack vectors (script tags, event handlers, etc.)
- Returns empty string for non-string inputs

### What This Function Does NOT Do
- Does not validate Ethereum addresses (use `validateAddress` for that)
- Does not validate amounts or numbers (use `validateAmount` for that)
- Does not sanitize already-escaped HTML entities (will double-escape)
- Does not remove characters, only escapes them

### Defense in Depth

This function is one layer of defense. Also implement:
1. Content Security Policy (CSP) headers
2. Input validation at the API level
3. Output encoding in templates
4. Regular security audits

## Testing

The security utilities are thoroughly tested against common XSS attack vectors:

```bash
# Run security tests
npx tsx lib/__tests__/security.test.ts
```

Test coverage includes:
- Basic character escaping
- Script tag injections
- Event handler injections (onclick, onerror, onload, etc.)
- iframe and svg injections
- JavaScript protocol URLs
- Data URIs
- HTML entities
- Edge cases and non-string inputs

## Related Functions

- `validateAddress()` - Validates Ethereum addresses
- `validateAmount()` - Validates deposit/withdrawal amounts
- `formatAddress()` - Formats addresses for display

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- Requirements Document: Section 12.5 (Security and Safety)
- Design Document: Security Considerations section
