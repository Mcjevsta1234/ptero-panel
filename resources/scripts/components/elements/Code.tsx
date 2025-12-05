import React from 'react';

interface CodeProps {
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

export default ({ children }: CodeProps) => (
    <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', padding: '0.25rem 0.5rem', display: 'inline-block', borderRadius: '0.375rem', background: 'linear-gradient(135deg, rgba(15, 40, 24, 0.5), rgba(10, 14, 39, 0.7))', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
        {children}
    </code>
);
