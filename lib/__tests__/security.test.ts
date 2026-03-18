/**
 * Manual tests for security functions
 * These tests verify input sanitization works correctly against XSS attacks
 * 
 * To run: npx tsx lib/__tests__/security.test.ts
 */

import { sanitizeInput } from '../security'

// Test counter
let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  ${error}`)
    failed++
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}", got "${actual}"`)
  }
}

console.log('\n=== Testing sanitizeInput ===\n')

// Basic XSS character escaping tests
test('escapes less than character', () => {
  assertEqual(sanitizeInput('<'), '&lt;')
})

test('escapes greater than character', () => {
  assertEqual(sanitizeInput('>'), '&gt;')
})

test('escapes ampersand character', () => {
  assertEqual(sanitizeInput('&'), '&amp;')
})

test('escapes double quote character', () => {
  assertEqual(sanitizeInput('"'), '&quot;')
})

test('escapes single quote character', () => {
  assertEqual(sanitizeInput("'"), '&#x27;')
})

test('escapes forward slash character', () => {
  assertEqual(sanitizeInput('/'), '&#x2F;')
})

// Common XSS attack vector tests
test('sanitizes basic script tag', () => {
  const input = '<script>alert("XSS")</script>'
  const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes script tag with single quotes', () => {
  const input = "<script>alert('XSS')</script>"
  const expected = '&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes img tag with onerror', () => {
  const input = '<img src="x" onerror="alert(1)">'
  const expected = '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes iframe injection', () => {
  const input = '<iframe src="javascript:alert(1)"></iframe>'
  const expected = '&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;&#x2F;iframe&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes svg with onload', () => {
  const input = '<svg onload="alert(1)">'
  const expected = '&lt;svg onload=&quot;alert(1)&quot;&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes anchor tag with javascript protocol', () => {
  const input = '<a href="javascript:alert(1)">Click</a>'
  const expected = '&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;&#x2F;a&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes div with onclick', () => {
  const input = '<div onclick="alert(1)">Click me</div>'
  const expected = '&lt;div onclick=&quot;alert(1)&quot;&gt;Click me&lt;&#x2F;div&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes input tag with autofocus and onfocus', () => {
  const input = '<input autofocus onfocus="alert(1)">'
  const expected = '&lt;input autofocus onfocus=&quot;alert(1)&quot;&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes style tag with expression', () => {
  const input = '<style>body{background:url("javascript:alert(1)")}</style>'
  const expected = '&lt;style&gt;body{background:url(&quot;javascript:alert(1)&quot;)}&lt;&#x2F;style&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes meta tag with refresh', () => {
  const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'
  const expected = '&lt;meta http-equiv=&quot;refresh&quot; content=&quot;0;url=javascript:alert(1)&quot;&gt;'
  assertEqual(sanitizeInput(input), expected)
})

// Edge cases
test('handles empty string', () => {
  assertEqual(sanitizeInput(''), '')
})

test('handles string with no special characters', () => {
  const input = 'Hello World 123'
  assertEqual(sanitizeInput(input), input)
})

test('handles string with mixed content', () => {
  const input = 'User input: <script>alert("test")</script> & more text'
  const expected = 'User input: &lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt; &amp; more text'
  assertEqual(sanitizeInput(input), expected)
})

test('handles multiple ampersands correctly', () => {
  const input = '&&&'
  const expected = '&amp;&amp;&amp;'
  assertEqual(sanitizeInput(input), expected)
})

test('handles complex nested tags', () => {
  const input = '<div><span onclick="alert(1)"><img src="x" onerror="alert(2)"></span></div>'
  const expected = '&lt;div&gt;&lt;span onclick=&quot;alert(1)&quot;&gt;&lt;img src=&quot;x&quot; onerror=&quot;alert(2)&quot;&gt;&lt;&#x2F;span&gt;&lt;&#x2F;div&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('handles data URIs', () => {
  const input = '<img src="data:text/html,<script>alert(1)</script>">'
  const expected = '&lt;img src=&quot;data:text&#x2F;html,&lt;script&gt;alert(1)&lt;&#x2F;script&gt;&quot;&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('handles event handlers in various formats', () => {
  const input = '<body onload=alert(1)>'
  const expected = '&lt;body onload=alert(1)&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('handles HTML entities in input', () => {
  const input = '&lt;script&gt;'
  const expected = '&amp;lt;script&amp;gt;'
  assertEqual(sanitizeInput(input), expected)
})

// Non-string input handling
test('handles non-string input (number)', () => {
  assertEqual(sanitizeInput(123 as any), '')
})

test('handles non-string input (null)', () => {
  assertEqual(sanitizeInput(null as any), '')
})

test('handles non-string input (undefined)', () => {
  assertEqual(sanitizeInput(undefined as any), '')
})

test('handles non-string input (object)', () => {
  assertEqual(sanitizeInput({} as any), '')
})

test('handles non-string input (array)', () => {
  assertEqual(sanitizeInput([] as any), '')
})

// Real-world scenarios
test('sanitizes user comment with HTML', () => {
  const input = 'Great vault! <3 Check out <a href="http://evil.com">this link</a>'
  const expected = 'Great vault! &lt;3 Check out &lt;a href=&quot;http:&#x2F;&#x2F;evil.com&quot;&gt;this link&lt;&#x2F;a&gt;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes vault name with special characters', () => {
  const input = 'USDC Vault <High Yield> & "Safe"'
  const expected = 'USDC Vault &lt;High Yield&gt; &amp; &quot;Safe&quot;'
  assertEqual(sanitizeInput(input), expected)
})

test('sanitizes transaction hash-like string (should pass through)', () => {
  const input = '0x1234567890abcdef'
  assertEqual(sanitizeInput(input), input)
})

test('sanitizes address with attempted injection', () => {
  const input = '0x1234<script>alert(1)</script>'
  const expected = '0x1234&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
  assertEqual(sanitizeInput(input), expected)
})

// Print summary
console.log('\n=== Test Summary ===\n')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}\n`)

if (failed > 0) {
  process.exit(1)
}
