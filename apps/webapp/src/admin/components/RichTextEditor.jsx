import { useState, useRef, useEffect } from 'react';
import { Button } from './shared';
import DOMPurify from 'dompurify';

export default function RichTextEditor({ value, onChange }) {
  const contentRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const sanitizedValue = DOMPurify.sanitize(value || '');

  useEffect(() => {
    if (contentRef.current && value !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${isFocused ? 'var(--primary)' : 'var(--gray-light)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px',
          borderBottom: '1px solid var(--gray-light)',
          backgroundColor: 'var(--gray-lighter)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          title="Bold"
          style={{ fontWeight: 'bold', width: '30px', padding: 0 }}
        >
          B
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          title="Italic"
          style={{ fontStyle: 'italic', width: '30px', padding: 0 }}
        >
          I
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          title="Underline"
          style={{ textDecoration: 'underline', width: '30px', padding: 0 }}
        >
          U
        </Button>
        <div style={{ width: '1px', background: 'var(--gray-light)', margin: '0 4px' }} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
          style={{ width: '30px', padding: 0 }}
        >
          •
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
          style={{ width: '30px', padding: 0 }}
        >
          1.
        </Button>
      </div>
      <div
        ref={contentRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: '200px',
          padding: '12px',
          outline: 'none',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedValue }}
      />
    </div>
  );
}
