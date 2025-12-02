import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';

interface MotdEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// Minecraft formatting codes
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
    'k': { name: 'Obfuscated', style: 'obfuscated' },
    'l': { name: 'Bold', style: 'bold' },
    'm': { name: 'Strikethrough', style: 'strikethrough' },
    'n': { name: 'Underline', style: 'underline' },
    'o': { name: 'Italic', style: 'italic' },
    'r': { name: 'Reset', style: 'reset' },
};

export default ({ value, onChange }: MotdEditorProps) => {
    const [motd, setMotd] = useState(value || '');
    const [showCodes, setShowCodes] = useState(false);

    useEffect(() => {
        setMotd(value || '');
    }, [value]);

    const handleChange = (newValue: string) => {
        setMotd(newValue);
        onChange(newValue);
    };

    const insertCode = (code: string) => {
        const newValue = motd + '§' + code;
        handleChange(newValue);
    };

    const renderPreview = () => {
        const lines = motd.split('\\n');
        return (
            <div css={tw`bg-[#1E1E1E] p-4 rounded border-2 border-gray-600 font-mono text-sm`}>
                <div css={tw`text-center mb-2 text-gray-400 text-xs`}>Server List Preview</div>
                {lines.slice(0, 2).map((line, idx) => (
                    <div key={idx} css={tw`text-center`}>
                        {renderFormattedText(line)}
                    </div>
                ))}
            </div>
        );
    };

    const renderFormattedText = (text: string) => {
        const parts: JSX.Element[] = [];
        let currentColor = '#FFFFFF';
        let currentStyles: string[] = [];
        let buffer = '';
        let i = 0;

        const flushBuffer = () => {
            if (buffer) {
                const styles: React.CSSProperties = {
                    color: currentColor,
                    fontWeight: currentStyles.includes('bold') ? 'bold' : 'normal',
                    fontStyle: currentStyles.includes('italic') ? 'italic' : 'normal',
                    textDecoration: [
                        currentStyles.includes('strikethrough') ? 'line-through' : '',
                        currentStyles.includes('underline') ? 'underline' : '',
                    ]
                        .filter(Boolean)
                        .join(' '),
                };

                if (currentStyles.includes('obfuscated')) {
                    parts.push(
                        <span key={i} style={styles} css={tw`animate-pulse`}>
                            {buffer.replace(/./g, '?')}
                        </span>
                    );
                } else {
                    parts.push(
                        <span key={i} style={styles}>
                            {buffer}
                        </span>
                    );
                }
                buffer = '';
            }
        };

        while (i < text.length) {
            if (text[i] === '§' && i + 1 < text.length) {
                flushBuffer();
                const code = text[i + 1].toLowerCase();
                const format = formatCodes[code];

                if (format) {
                    if (format.color) {
                        currentColor = format.color;
                        currentStyles = []; // Reset styles on color change
                    } else if (format.style === 'reset') {
                        currentColor = '#FFFFFF';
                        currentStyles = [];
                    } else if (format.style) {
                        currentStyles.push(format.style);
                    }
                }
                i += 2;
            } else if (text[i] === '&' && i + 1 < text.length) {
                // Support & as well as §
                flushBuffer();
                const code = text[i + 1].toLowerCase();
                const format = formatCodes[code];

                if (format) {
                    if (format.color) {
                        currentColor = format.color;
                        currentStyles = [];
                    } else if (format.style === 'reset') {
                        currentColor = '#FFFFFF';
                        currentStyles = [];
                    } else if (format.style) {
                        currentStyles.push(format.style);
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

            {/* Editor */}
            <div>
                <label css={tw`block text-sm font-medium text-gray-200 mb-2`}>MOTD Text</label>
                <textarea
                    value={motd}
                    onChange={(e) => handleChange(e.target.value)}
                    rows={3}
                    css={tw`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    placeholder="Enter your MOTD here... Use \\n for new line"
                />
                <p css={tw`text-xs text-gray-400 mt-1`}>
                    Use §[code] or &[code] for formatting. Use \n for line breaks (max 2 lines).
                </p>
            </div>

            {/* Formatting Toolbar */}
            <div>
                <button
                    type="button"
                    onClick={() => setShowCodes(!showCodes)}
                    css={tw`text-sm text-primary-400 hover:text-primary-300 mb-2`}
                >
                    {showCodes ? 'Hide' : 'Show'} Formatting Codes
                </button>

                {showCodes && (
                    <div css={tw`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 bg-gray-800 rounded border border-gray-600`}>
                        {/* Color Codes */}
                        <div css={tw`col-span-full text-xs text-gray-400 mb-1`}>Colors</div>
                        {Object.entries(formatCodes)
                            .filter(([_, format]) => format.color)
                            .map(([code, format]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => insertCode(code)}
                                    css={tw`px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-700`}
                                    style={{ backgroundColor: format.color, color: '#000' }}
                                    title={format.name}
                                >
                                    §{code}
                                </button>
                            ))}

                        {/* Style Codes */}
                        <div css={tw`col-span-full text-xs text-gray-400 mt-2 mb-1`}>Styles</div>
                        {Object.entries(formatCodes)
                            .filter(([_, format]) => format.style)
                            .map(([code, format]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => insertCode(code)}
                                    css={tw`px-2 py-1 bg-gray-700 rounded text-xs font-medium transition-colors hover:bg-gray-600 text-gray-200`}
                                    title={format.name}
                                >
                                    §{code}
                                </button>
                            ))}
                    </div>
                )}
            </div>

            {/* Quick Templates */}
            <div>
                <label css={tw`block text-sm font-medium text-gray-200 mb-2`}>Quick Templates</label>
                <div css={tw`flex flex-wrap gap-2`}>
                    <button
                        type="button"
                        onClick={() => handleChange('§6§lMy Server§r\\n§7Play now!')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Gold & Gray
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange('§a§lSurvival§r §8|§r §bCreative\\n§7Join us today!')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Multi-Color
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange('§c§l♦ §6Epic Server §c♦\\n§e» §fVersion 1.20 §e«')}
                        css={tw`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200`}
                    >
                        Fancy
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange('')}
                        css={tw`px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white`}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};
