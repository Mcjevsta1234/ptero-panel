import React, { useState, useEffect, useRef } from 'react';
import tw from 'twin.macro';

interface MotdEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// Minecraft formatting codes with exact colors from Minecraft
const formatCodes: Record<string, { name: string; color?: string; style?: string }> = {
    '0': { name: 'Black', color: '#000000' },
    '1': { name: 'Dark Blue', color: '#0000AA' },
    '2': { name: 'Dark Green', color: '#00AA00' },
    '3': { name: 'Dark Aqua', color: '#00AAAA' },
    '4': { name: 'Dark Red', color: '#AA0000' },
    '5': { name: 'Dark Purple', color: '#AA00AA' },
    '6': { name: 'Gold', color: '#FFAA00' },
    '7': { name: 'Gray', color: '#AAAAAA' },
    '8': { name: 'Dark Gray', color: '#555555' },
    '9': { name: 'Blue', color: '#5555FF' },
    'a': { name: 'Green', color: '#55FF55' },
    'b': { name: 'Aqua', color: '#55FFFF' },
    'c': { name: 'Red', color: '#FF5555' },
    'd': { name: 'Light Purple', color: '#FF55FF' },
    'e': { name: 'Yellow', color: '#FFFF55' },
    'f': { name: 'White', color: '#FFFFFF' },
    'l': { name: 'Bold', style: 'bold' },
    'm': { name: 'Strikethrough', style: 'strikethrough' },
    'n': { name: 'Underline', style: 'underline' },
    'o': { name: 'Italic', style: 'italic' },
    'r': { name: 'Reset', style: 'reset' },
};

export default ({ value, onChange }: MotdEditorProps) => {
    const [motd, setMotd] = useState(value || '');
    const [plainText, setPlainText] = useState('');
    const [selectedColor, setSelectedColor] = useState('f');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setMotd(value || '');
        setPlainText(stripFormatting(value || ''));
    }, [value]);

    const stripFormatting = (text: string): string => {
        return text.replace(/[§&][0-9a-fk-or]/gi, '');
    };

    const applyFormatting = (code: string): void => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = plainText;

        if (start === end) {
            // No selection, just insert the code at cursor
            const newText = text.substring(0, start) + `§${code}` + text.substring(end);
            setPlainText(newText);
            setMotd(newText);
            onChange(newText);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 2, start + 2);
            }, 0);
            return;
        }

        // Apply formatting to selection
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + `§${code}` + selected + '§r' + after;
        
        setPlainText(newText);
        setMotd(newText);
        onChange(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, end + 4); // Select the formatted text
        }, 0);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setPlainText(newText);
        setMotd(newText);
        onChange(newText);
    };

    const toggleStyle = (code: string) => {
        const wasSelected = selectedStyles.includes(code);
        setSelectedStyles(prev => 
            wasSelected ? prev.filter(s => s !== code) : [...prev, code]
        );
        applyFormatting(code);
    };

    const handleColorChange = (code: string) => {
        setSelectedColor(code);
        applyFormatting(code);
    };

    const renderPreview = () => {
        const lines = motd.split('\\n');
        return (
            <div css={tw`bg-gray-900 p-6 rounded border border-gray-700`}>
                <div css={tw`text-center mb-3 text-gray-500 text-xs uppercase tracking-wide`}>Server List Preview</div>
                <div css={tw`bg-[#383838] p-4 rounded`}>
                    {lines.slice(0, 2).map((line: string, idx: number) => (
                        <div key={idx} css={tw`font-mono leading-tight`} style={{ fontSize: '16px', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                            {renderFormattedText(line)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderFormattedText = (text: string) => {
        const parts: React.ReactNode[] = [];
        let currentColor = '#FFFFFF';
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let isStrike = false;
        let buffer = '';
        let i = 0;

        const flushBuffer = () => {
            if (buffer) {
                const style: React.CSSProperties = {
                    color: currentColor,
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecoration: [
                        isStrike ? 'line-through' : '',
                        isUnderline ? 'underline' : '',
                    ].filter(Boolean).join(' ') || 'none',
                };

                parts.push(
                    <span key={`part-${i}`} style={style}>
                        {buffer}
                    </span>
                );
                buffer = '';
            }
        };

        while (i < text.length) {
            if ((text[i] === '§' || text[i] === '&') && i + 1 < text.length) {
                flushBuffer();
                const code = text[i + 1].toLowerCase();
                const format = formatCodes[code];

                if (format) {
                    if (format.color) {
                        currentColor = format.color;
                        // Color codes reset formatting
                        isBold = false;
                        isItalic = false;
                        isUnderline = false;
                        isStrike = false;
                    } else if (format.style === 'bold') {
                        isBold = true;
                    } else if (format.style === 'italic') {
                        isItalic = true;
                    } else if (format.style === 'underline') {
                        isUnderline = true;
                    } else if (format.style === 'strikethrough') {
                        isStrike = true;
                    } else if (format.style === 'reset') {
                        currentColor = '#FFFFFF';
                        isBold = false;
                        isItalic = false;
                        isUnderline = false;
                        isStrike = false;
                    }
                }
                i += 2;
            } else {
                buffer += text[i];
                i++;
            }
        }
        flushBuffer();

        return <>{parts}</>;
    };

    return (
        <div css={tw`space-y-4`}>
            {/* Preview */}
            {renderPreview()}

            {/* Formatting Toolbar */}
            <div css={tw`bg-gray-800 p-4 rounded border border-gray-700`}>
                <div css={tw`mb-3`}>
                    <label css={tw`block text-sm font-medium mb-2 text-gray-300`}>Formatting Toolbar</label>
                    <div css={tw`flex flex-wrap gap-2 mb-3`}>
                        {/* Color buttons */}
                        <div css={tw`flex flex-wrap gap-1`}>
                            {Object.entries(formatCodes)
                                .filter(([_, format]) => format.color)
                                .map(([code, format]) => (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => handleColorChange(code)}
                                        css={tw`w-8 h-8 rounded border-2 transition-all hover:scale-110`}
                                        style={{
                                            backgroundColor: format.color,
                                            borderColor: selectedColor === code ? '#10b981' : '#374151',
                                        }}
                                        title={format.name}
                                    />
                                ))}
                        </div>

                        {/* Style buttons */}
                        <div css={tw`flex gap-1 ml-2 border-l border-gray-600 pl-2`}>
                            {[
                                { code: 'l', label: 'B', style: 'bold', title: 'Bold' },
                                { code: 'm', label: 'S', style: 'strikethrough', title: 'Strikethrough' },
                                { code: 'n', label: 'U', style: 'underline', title: 'Underline' },
                                { code: 'o', label: 'I', style: 'italic', title: 'Italic' },
                            ].map((btn) => (
                                <button
                                    key={btn.code}
                                    type="button"
                                    onClick={() => toggleStyle(btn.code)}
                                    css={tw`w-8 h-8 rounded border-2 transition-all hover:scale-110 text-gray-100`}
                                    style={{
                                        backgroundColor: selectedStyles.includes(btn.code) ? '#374151' : '#1f2937',
                                        borderColor: selectedStyles.includes(btn.code) ? '#10b981' : '#4b5563',
                                        fontWeight: btn.style === 'bold' ? 700 : 400,
                                        fontStyle: btn.style === 'italic' ? 'italic' : 'normal',
                                        textDecoration: btn.style === 'strikethrough' ? 'line-through' : btn.style === 'underline' ? 'underline' : 'none',
                                    }}
                                    title={btn.title}
                                >
                                    {btn.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedColor('f');
                                    setSelectedStyles([]);
                                }}
                                css={tw`w-8 h-8 rounded border-2 bg-gray-700 border-gray-600 transition-all hover:scale-110 hover:border-red-500 text-gray-100`}
                                title="Reset formatting"
                            >
                                R
                            </button>
                        </div>
                    </div>
                </div>

                {/* Text Editor */}
                <div>
                    <label css={tw`block text-sm font-medium mb-2 text-gray-300`}>MOTD Text (2 lines max)</label>
                    <textarea
                        ref={textareaRef}
                        value={plainText}
                        onChange={handleTextChange}
                        rows={2}
                        css={tw`w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm text-gray-100`}
                        placeholder="Enter your MOTD here..."
                    />
                    <div css={tw`mt-2 text-xs text-gray-500`}>
                        Select text and click a color or style button to format it. Use Shift+Enter for a new line.
                    </div>
                </div>

                {/* Formatted Output */}
                <div css={tw`mt-3 p-3 bg-gray-900 rounded border border-gray-700`}>
                    <div css={tw`text-xs font-medium mb-1 text-gray-400`}>Formatted Output:</div>
                    <code css={tw`text-xs text-green-400 break-all`}>{motd}</code>
                </div>
            </div>

            {/* Quick Templates */}
            <div>
                <label css={tw`block text-sm font-medium text-gray-200 mb-2`}>Quick Templates</label>
                <div css={tw`flex flex-wrap gap-2`}>
                    <button
                        type="button"
                        onClick={() => onChange('§6§lMy Server§r\\n§7Play now!')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Gold & Gray
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('§a§lSurvival§r §8|§r §bCreative\\n§7Join us today!')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Multi-Color
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('§c§l♦ §6Epic Server §c♦\\n§e» §fVersion 1.20 §e«')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Fancy
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        css={tw`px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white`}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};
