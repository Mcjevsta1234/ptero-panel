import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import ContentBlock from '@/witchyworlds/ui/ContentBlock';
import Card from '@/witchyworlds/ui/Card';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import getConfigs, { ConfigFile, ConfigOption } from '@/api/server/configs/getConfigs';
import updateConfig, { ConfigUpdate } from '@/api/server/configs/updateConfig';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import { useTranslation } from 'react-i18next';
import Input from '@/components/elements/Input';

export default () => {
    const { t } = useTranslation('server/configs');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<ConfigFile[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(null);
    const [changes, setChanges] = useState<Map<string, ConfigUpdate>>(new Map());
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { addFlash, clearFlashes } = useFlash();

    useEffect(() => {
        clearFlashes('configs');
        setLoading(true);
        getConfigs(uuid)
            .then((data) => {
                setConfigs(data);
                if (data.length > 0) {
                    setSelectedConfig(data[0]);
                }
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    key: 'configs',
                    type: 'error',
                    message: 'Failed to load config files',
                });
            })
            .finally(() => setLoading(false));
    }, [uuid]);

    const handleChange = (option: ConfigOption, value: any) => {
        const key = `${selectedConfig?.path}:${option.path}`;
        const newChanges = new Map(changes);
        
        newChanges.set(key, {
            path: option.path,
            key: option.key,
            value: value,
        });
        
        setChanges(newChanges);
    };

    const handleSave = () => {
        if (!selectedConfig) return;

        clearFlashes('configs');
        setSaving(true);

        const updates = Array.from(changes.values()).filter((update) => {
            const key = `${selectedConfig.path}:${update.path}`;
            return changes.has(key);
        });

        updateConfig(uuid, selectedConfig.path, updates)
            .then(() => {
                addFlash({
                    key: 'configs',
                    type: 'success',
                    message: `${selectedConfig.name} updated successfully! Restart your server for changes to take effect.`,
                });
                setChanges(new Map());
                
                // Reload configs to get updated values
                return getConfigs(uuid);
            })
            .then((data) => {
                setConfigs(data);
                const updated = data.find((c) => c.path === selectedConfig.path);
                if (updated) {
                    setSelectedConfig(updated);
                }
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    key: 'configs',
                    type: 'error',
                    message: 'Failed to update config file',
                });
            })
            .finally(() => setSaving(false));
    };

    const getChangedValue = (option: ConfigOption): any => {
        const key = `${selectedConfig?.path}:${option.path}`;
        return changes.has(key) ? changes.get(key)!.value : option.value;
    };

    const renderInput = (option: ConfigOption) => {
        const value = getChangedValue(option);
        const hasChanged = changes.has(`${selectedConfig?.path}:${option.path}`);

        const inputStyles = [
            tw`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent`,
            hasChanged && tw`border-yellow-500 bg-yellow-900/20`,
        ];

        switch (option.type) {
            case 'boolean':
                return (
                    <label css={tw`flex items-center space-x-2`}>
                        <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => handleChange(option, e.target.checked)}
                            css={tw`rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500`}
                        />
                        <span css={tw`text-sm text-gray-300`}>
                            {value === true ? 'Enabled' : 'Disabled'}
                        </span>
                        {hasChanged && (
                            <span css={tw`text-xs text-yellow-400`}>(Modified)</span>
                        )}
                    </label>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value ?? 0}
                        onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleChange(option, val);
                        }}
                        css={inputStyles}
                    />
                );

            case 'list':
                return (
                    <div css={tw`space-y-1`}>
                        <textarea
                            value={Array.isArray(value) ? value.join('\n') : ''}
                            onChange={(e) => {
                                const lines = e.target.value.split('\n').filter((l) => l.trim());
                                handleChange(option, lines);
                            }}
                            rows={5}
                            css={inputStyles}
                            placeholder="One item per line"
                        />
                        <p css={tw`text-xs text-gray-400`}>One item per line</p>
                    </div>
                );

            case 'object':
                return (
                    <div css={tw`p-3 bg-gray-800 rounded border border-gray-600`}>
                        <p css={tw`text-xs text-gray-400`}>
                            Complex object - edit via file manager for advanced changes
                        </p>
                        <pre css={tw`text-xs text-gray-300 mt-2 overflow-x-auto`}>
                            {JSON.stringify(value, null, 2)}
                        </pre>
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value ?? ''}
                        onChange={(e) => handleChange(option, e.target.value)}
                        css={inputStyles}
                    />
                );
        }
    };

    if (loading) {
        return (
            <ContentBlock title={'Advanced Config Editor'}>
                <Spinner size={'large'} centered />
            </ContentBlock>
        );
    }

    if (configs.length === 0) {
        return (
            <ContentBlock title={'Advanced Config Editor'}>
                <Card css={tw`p-6 text-center`}>
                    <p css={tw`text-gray-400`}>
                        No config files found. This feature is designed for Bukkit/Spigot/Paper-based servers.
                    </p>
                </Card>
            </ContentBlock>
        );
    }

    const filteredSections = selectedConfig?.sections
        .map((section) => ({
            ...section,
            options: section.options.filter(
                (opt) =>
                    !searchQuery ||
                    opt.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    opt.path.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        }))
        .filter((section) => section.options.length > 0);

    return (
        <ContentBlock title={'Advanced Config Editor'}>
            <FlashMessageRender byKey={'configs'} css={tw`mb-4`} />

            <div css={tw`flex flex-col lg:flex-row gap-4`}>
                {/* Sidebar - Config File Selector */}
                <Card css={tw`lg:w-64 p-4 space-y-2`}>
                    <h3 css={tw`font-bold text-gray-100 mb-3`}>Config Files</h3>
                    {configs.map((config) => (
                        <button
                            key={config.path}
                            onClick={() => {
                                setSelectedConfig(config);
                                setChanges(new Map());
                                setSearchQuery('');
                            }}
                            css={[
                                tw`w-full text-left px-3 py-2 rounded transition-colors`,
                                selectedConfig?.path === config.path
                                    ? tw`bg-primary-500 text-white`
                                    : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                            ]}
                        >
                            <div css={tw`font-medium`}>{config.name}</div>
                            <div css={tw`text-xs opacity-75`}>{config.path}</div>
                        </button>
                    ))}
                </Card>

                {/* Main Content */}
                <div css={tw`flex-1 space-y-4`}>
                    {selectedConfig && (
                        <>
                            {/* Header with search and save */}
                            <Card css={tw`p-4`}>
                                <div css={tw`flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between`}>
                                    <div>
                                        <h2 css={tw`text-xl font-bold text-gray-100`}>
                                            {selectedConfig.name}
                                        </h2>
                                        <p css={tw`text-sm text-gray-400`}>{selectedConfig.path}</p>
                                    </div>
                                    <div css={tw`flex gap-2 w-full sm:w-auto`}>
                                        <input
                                            type="text"
                                            placeholder="Search options..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            css={tw`flex-1 sm:w-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                        />
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving || changes.size === 0}
                                            css={tw`whitespace-nowrap`}
                                        >
                                            {saving ? 'Saving...' : `Save ${changes.size > 0 ? `(${changes.size})` : ''}`}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Config Sections */}
                            <div css={tw`space-y-4`}>
                                {filteredSections && filteredSections.length > 0 ? (
                                    filteredSections.map((section) => (
                                        <Card key={section.name} css={tw`p-4`}>
                                            <h3 css={tw`text-lg font-bold text-gray-100 mb-4 border-b border-gray-600 pb-2`}>
                                                {section.name}
                                            </h3>
                                            <div css={tw`space-y-4`}>
                                                {section.options.map((option) => (
                                                    <div key={option.path} css={tw`space-y-2`}>
                                                        <div css={tw`flex items-center justify-between`}>
                                                            <label css={tw`block text-sm font-medium text-gray-200`}>
                                                                {option.key}
                                                            </label>
                                                            <span css={tw`text-xs text-gray-500 font-mono`}>
                                                                {option.path}
                                                            </span>
                                                        </div>
                                                        {renderInput(option)}
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <Card css={tw`p-6 text-center`}>
                                        <p css={tw`text-gray-400`}>
                                            {searchQuery
                                                ? 'No options match your search'
                                                : 'No options available'}
                                        </p>
                                    </Card>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ContentBlock>
    );
};
