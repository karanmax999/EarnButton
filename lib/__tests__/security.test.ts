/**
 * Tests for security functions (input sanitization)
 */

import { describe, it, expect } from 'vitest'
import { sanitizeInput } from '../security'

describe('sanitizeInput', () => {
  describe('basic character escaping', () => {
    it('escapes less than character', () => {
      expect(sanitizeInput('<')).toBe('&lt;')
    })

    it('escapes greater than character', () => {
      expect(sanitizeInput('>')).toBe('&gt;')
    })

    it('escapes ampersand character', () => {
      expect(sanitizeInput('&')).toBe('&amp;')
    })

    it('escapes double quote character', () => {
      expect(sanitizeInput('"')).toBe('&quot;')
    })

    it('escapes single quote character', () => {
      expect(sanitizeInput("'")).toBe('&#x27;')
    })

    it('escapes forward slash character', () => {
      expect(sanitizeInput('/')).toBe('&#x2F;')
    })
  })

  describe('XSS attack vectors', () => {
    it('sanitizes basic script tag', () => {
      expect(sanitizeInput('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      )
    })

    it('sanitizes script tag with single quotes', () => {
      expect(sanitizeInput("<script>alert('XSS')</script>")).toBe(
        '&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;'
      )
    })

    it('sanitizes img tag with onerror', () => {
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe(
        '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
      )
    })

    it('sanitizes iframe injection', () => {
      expect(sanitizeInput('<iframe src="javascript:alert(1)"></iframe>')).toBe(
        '&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;&#x2F;iframe&gt;'
      )
    })

    it('sanitizes svg with onload', () => {
      expect(sanitizeInput('<svg onload="alert(1)">')).toBe(
        '&lt;svg onload=&quot;alert(1)&quot;&gt;'
      )
    })

    it('sanitizes anchor tag with javascript protocol', () => {
      expect(sanitizeInput('<a href="javascript:alert(1)">Click</a>')).toBe(
        '&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;&#x2F;a&gt;'
      )
    })

    it('sanitizes div with onclick', () => {
      expect(sanitizeInput('<div onclick="alert(1)">Click me</div>')).toBe(
        '&lt;div onclick=&quot;alert(1)&quot;&gt;Click me&lt;&#x2F;div&gt;'
      )
    })

    it('sanitizes input tag with autofocus and onfocus', () => {
      expect(sanitizeInput('<input autofocus onfocus="alert(1)">')).toBe(
        '&lt;input autofocus onfocus=&quot;alert(1)&quot;&gt;'
      )
    })

    it('sanitizes style tag with expression', () => {
      expect(sanitizeInput('<style>body{background:url("javascript:alert(1)")}</style>')).toBe(
        '&lt;style&gt;body{background:url(&quot;javascript:alert(1)&quot;)}&lt;&#x2F;style&gt;'
      )
    })

    it('sanitizes meta tag with refresh', () => {
      expect(sanitizeInput('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">')).toBe(
        '&lt;meta http-equiv=&quot;refresh&quot; content=&quot;0;url=javascript:alert(1)&quot;&gt;'
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('handles string with no special characters', () => {
      expect(sanitizeInput('Hello World 123')).toBe('Hello World 123')
    })

    it('handles string with mixed content', () => {
      expect(sanitizeInput('User input: <script>alert("test")</script> & more text')).toBe(
        'User input: &lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt; &amp; more text'
      )
    })

    it('handles multiple ampersands correctly', () => {
      expect(sanitizeInput('&&&')).toBe('&amp;&amp;&amp;')
    })

    it('handles complex nested tags', () => {
      expect(sanitizeInput('<div><span onclick="alert(1)"><img src="x" onerror="alert(2)"></span></div>')).toBe(
        '&lt;div&gt;&lt;span onclick=&quot;alert(1)&quot;&gt;&lt;img src=&quot;x&quot; onerror=&quot;alert(2)&quot;&gt;&lt;&#x2F;span&gt;&lt;&#x2F;div&gt;'
      )
    })

    it('handles data URIs', () => {
      expect(sanitizeInput('<img src="data:text/html,<script>alert(1)</script>">')).toBe(
        '&lt;img src=&quot;data:text&#x2F;html,&lt;script&gt;alert(1)&lt;&#x2F;script&gt;&quot;&gt;'
      )
    })

    it('handles event handlers in various formats', () => {
      expect(sanitizeInput('<body onload=alert(1)>')).toBe('&lt;body onload=alert(1)&gt;')
    })

    it('handles HTML entities in input', () => {
      expect(sanitizeInput('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;')
    })
  })

  describe('non-string input handling', () => {
    it('handles non-string input (number)', () => {
      expect(sanitizeInput(123 as any)).toBe('')
    })

    it('handles non-string input (null)', () => {
      expect(sanitizeInput(null as any)).toBe('')
    })

    it('handles non-string input (undefined)', () => {
      expect(sanitizeInput(undefined as any)).toBe('')
    })

    it('handles non-string input (object)', () => {
      expect(sanitizeInput({} as any)).toBe('')
    })

    it('handles non-string input (array)', () => {
      expect(sanitizeInput([] as any)).toBe('')
    })
  })

  describe('real-world scenarios', () => {
    it('sanitizes user comment with HTML', () => {
      expect(sanitizeInput('Great vault! <3 Check out <a href="http://evil.com">this link</a>')).toBe(
        'Great vault! &lt;3 Check out &lt;a href=&quot;http:&#x2F;&#x2F;evil.com&quot;&gt;this link&lt;&#x2F;a&gt;'
      )
    })

    it('sanitizes vault name with special characters', () => {
      expect(sanitizeInput('USDC Vault <High Yield> & "Safe"')).toBe(
        'USDC Vault &lt;High Yield&gt; &amp; &quot;Safe&quot;'
      )
    })

    it('sanitizes transaction hash-like string (should pass through)', () => {
      expect(sanitizeInput('0x1234567890abcdef')).toBe('0x1234567890abcdef')
    })

    it('sanitizes address with attempted injection', () => {
      expect(sanitizeInput('0x1234<script>alert(1)</script>')).toBe(
        '0x1234&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
      )
    })
  })
})
