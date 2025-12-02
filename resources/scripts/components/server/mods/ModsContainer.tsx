import React, { useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import ContentBlock from '@/witchyworlds/ui/ContentBlock';
import Card from '@/witchyworlds/ui/Card';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import getModsAndPlugins from '@/api/server/mods/getModsAndPlugins';
import searchMods from '@/api/server/mods/searchMods';
import installMod from '@/api/server/mods/installMod';
import uninstallMod from '@/api/server/mods/uninstallMod';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [installedMods, setInstalledMods] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'mod' | 'plugin'>('plugin');
    const [selectedSource, setSelectedSource] = useState<'curseforge' | 'spigot'>('spigot');
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const loadInstalled = () => {
        getModsAndPlugins(uuid, selectedType)
            .then((data) => setInstalledMods(data))
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadInstalled();
    }, [uuid, selectedType]);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        searchMods(uuid, searchQuery, selectedType, selectedSource)
            .then((data) => setSearchResults(data.data || []))
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setSearching(false));
    };

    const handleInstall = (modId: number, fileId: number) => {
        installMod(uuid, modId, fileId, selectedType, selectedSource)
            .then(() => {
                loadInstalled();
                setSearchResults([]);
                setSearchQuery('');
            })
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }));
    };

    const handleUninstall = (modId: number) => {
        uninstallMod(uuid, modId)
            .then(() => loadInstalled())
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }));
    };

    return (
        <ContentBlock title={'Mods & Plugins'}>
            <FlashMessageRender byKey={'mods'} css={tw`mb-4`} />

            {/* Type and Source Selector */}
            <Card css={tw`p-4 mb-4`}>
                <div css={tw`flex flex-wrap gap-4`}>
                    <div>
                        <label css={tw`block text-sm font-medium text-gray-300 mb-2`}>Type</label>
                        <div css={tw`flex gap-2`}>
                            <button
                                onClick={() => setSelectedType('mod')}
                                css={[
                                    tw`px-4 py-2 rounded font-medium transition-colors`,
                                    selectedType === 'mod'
                                        ? tw`bg-blue-600 text-white`
                                        : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                                ]}
                            >
                                Mods
                            </button>
                            <button
                                onClick={() => setSelectedType('plugin')}
                                css={[
                                    tw`px-4 py-2 rounded font-medium transition-colors`,
                                    selectedType === 'plugin'
                                        ? tw`bg-blue-600 text-white`
                                        : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                                ]}
                            >
                                Plugins
                            </button>
                        </div>
                    </div>

                    {selectedType === 'plugin' && (
                        <div>
                            <label css={tw`block text-sm font-medium text-gray-300 mb-2`}>Source</label>
                            <div css={tw`flex gap-2`}>
                                <button
                                    onClick={() => setSelectedSource('spigot')}
                                    css={[
                                        tw`px-4 py-2 rounded font-medium transition-colors`,
                                        selectedSource === 'spigot'
                                            ? tw`bg-blue-600 text-white`
                                            : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                                    ]}
                                >
                                    Spigot
                                </button>
                                <button
                                    onClick={() => setSelectedSource('curseforge')}
                                    css={[
                                        tw`px-4 py-2 rounded font-medium transition-colors`,
                                        selectedSource === 'curseforge'
                                            ? tw`bg-blue-600 text-white`
                                            : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                                    ]}
                                >
                                    CurseForge
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Search */}
            <Card css={tw`p-4 mb-4`}>
                <div css={tw`flex gap-2`}>
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={`Search ${selectedSource === 'spigot' ? 'Spigot' : 'CurseForge'}...`}
                        css={tw`flex-1`}
                    />
                    <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                        {searching ? 'Searching...' : 'Search'}
                    </Button>
                </div>

                {searchResults.length > 0 && (
                    <div css={tw`mt-4 space-y-2`}>
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                css={tw`p-3 bg-gray-700 rounded flex items-center justify-between`}
                            >
                                <div>
                                    <h4 css={tw`font-medium text-gray-100`}>{result.name || result.title}</h4>
                                    <p css={tw`text-sm text-gray-400`}>
                                        {selectedSource === 'spigot'
                                            ? `${result.downloads?.toLocaleString() || 0} downloads`
                                            : `By ${result.author?.name || 'Unknown'}`}
                                    </p>
                                </div>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        handleInstall(
                                            result.id,
                                            selectedSource === 'spigot'
                                                ? result.latest_version?.id || 0
                                                : result.latestFiles?.[0]?.id || 0
                                        )
                                    }
                                >
                                    Install
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Installed Mods/Plugins */}
            <Card css={tw`p-4`}>
                <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>
                    Installed {selectedType === 'mod' ? 'Mods' : 'Plugins'}
                </h3>

                {loading ? (
                    <Spinner size="large" centered />
                ) : installedMods.length === 0 ? (
                    <p css={tw`text-center text-gray-400 py-8`}>
                        No {selectedType === 'mod' ? 'mods' : 'plugins'} installed
                    </p>
                ) : (
                    <div css={tw`space-y-2`}>
                        {installedMods.map((mod) => (
                            <div
                                key={mod.id}
                                css={tw`p-3 bg-gray-700 rounded flex items-center justify-between`}
                            >
                                <div>
                                    <h4 css={tw`font-medium text-gray-100`}>{mod.name}</h4>
                                    <p css={tw`text-sm text-gray-400`}>
                                        {mod.version} • {mod.filename}
                                    </p>
                                    {mod.status === 'downloading' && (
                                        <span css={tw`text-xs text-blue-400`}>Downloading...</span>
                                    )}
                                    {mod.status === 'failed' && (
                                        <span css={tw`text-xs text-red-400`}>
                                            Failed: {mod.error_message}
                                        </span>
                                    )}
                                </div>
                                <Button size="small" color="red" onClick={() => handleUninstall(mod.id)}>
                                    Uninstall
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </ContentBlock>
    );
};
