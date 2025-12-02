import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import getServerMods from '@/api/server/mods/getServerMods';
import searchMods from '@/api/server/mods/searchMods';
import installMod from '@/api/server/mods/installMod';
import uninstallMod from '@/api/server/mods/uninstallMod';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';

interface Mod {
    id: number;
    name: string;
    slug?: string;
    summary?: string;
    downloadCount?: number;
    logo?: {
        url: string;
    };
    latestFiles?: any[];
}

interface InstalledMod {
    id: number;
    mod_id: number;
    file_id: number;
    name: string;
    version: string;
    filename: string;
    type: string;
    status: string;
    error_message?: string;
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const [loading, setLoading] = useState(false);
    const [installedMods, setInstalledMods] = useState<InstalledMod[]>([]);
    const [searchResults, setSearchResults] = useState<Mod[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [type, setType] = useState<'mod' | 'plugin'>('plugin');
    const [source, setSource] = useState<'curseforge' | 'spigot'>('spigot');
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'install' | 'installed'>('install');

    useEffect(() => {
        if (activeTab === 'installed') {
            loadInstalledMods();
        }
    }, [type, activeTab]);

    const loadInstalledMods = () => {
        clearFlashes('mods');
        setLoading(true);

        getServerMods(uuid, type)
            .then((mods) => setInstalledMods(mods))
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setLoading(false));
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        clearFlashes('mods');
        setSearching(true);

        searchMods(uuid, searchQuery, type, source)
            .then((results) => setSearchResults(results.data || []))
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setSearching(false));
    };

    const handleInstall = (modId: number, fileId: number) => {
        clearFlashes('mods');
        setLoading(true);

        installMod(uuid, modId, fileId, type, source)
            .then(() => {
                setActiveTab('installed');
            })
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setLoading(false));
    };

    const handleUninstall = (modId: number) => {
        clearFlashes('mods');
        setLoading(true);

        uninstallMod(uuid, modId)
            .then(() => {
                loadInstalledMods();
            })
            .catch((error) => clearAndAddHttpError({ key: 'mods', error }))
            .finally(() => setLoading(false));
    };

    return (
        <div css={tw`w-full`}>
            <FlashMessageRender byKey={'mods'} css={tw`mb-4`} />

            {/* Tab Navigation */}
            <div css={tw`flex gap-2 mb-4 border-b border-neutral-700`}>
                <button
                    onClick={() => setActiveTab('install')}
                    css={[
                        tw`px-4 py-2 font-medium transition-colors`,
                        activeTab === 'install'
                            ? tw`text-blue-400 border-b-2 border-blue-400`
                            : tw`text-neutral-400 hover:text-neutral-200`,
                    ]}
                >
                    Install
                </button>
                <button
                    onClick={() => setActiveTab('installed')}
                    css={[
                        tw`px-4 py-2 font-medium transition-colors`,
                        activeTab === 'installed'
                            ? tw`text-blue-400 border-b-2 border-blue-400`
                            : tw`text-neutral-400 hover:text-neutral-200`,
                    ]}
                >
                    Installed
                </button>
            </div>

            {/* Type and Source Selection */}
            <div css={tw`flex gap-4 mb-4`}>
                <Button onClick={() => setType('mod')} color={type === 'mod' ? 'primary' : 'secondary'} size="small">
                    Mods
                </Button>
                <Button
                    onClick={() => setType('plugin')}
                    color={type === 'plugin' ? 'primary' : 'secondary'}
                    size="small"
                >
                    Plugins
                </Button>

                {type === 'plugin' && activeTab === 'install' && (
                    <>
                        <Button
                            onClick={() => setSource('curseforge')}
                            color={source === 'curseforge' ? 'primary' : 'secondary'}
                            size="small"
                        >
                            CurseForge
                        </Button>
                        <Button
                            onClick={() => setSource('spigot')}
                            color={source === 'spigot' ? 'primary' : 'secondary'}
                            size="small"
                        >
                            Spigot
                        </Button>
                    </>
                )}
            </div>

            {activeTab === 'install' ? (
                <TitledGreyBox title={'Search ' + (type === 'mod' ? 'Mods' : 'Plugins')}>
                    <div css={tw`flex gap-2 mb-4`}>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${type === 'mod' ? 'mods' : 'plugins'}...`}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()} size="small">
                            {searching ? <Spinner size={'small'} /> : 'Search'}
                        </Button>
                    </div>

                    {searching ? (
                        <Spinner size={'large'} centered />
                    ) : searchResults.length > 0 ? (
                        <div css={tw`space-y-2`}>
                            {searchResults.map((mod) => (
                                <div
                                    key={mod.id}
                                    css={tw`p-4 bg-neutral-700 rounded flex justify-between items-center`}
                                >
                                    <div css={tw`flex items-center gap-4`}>
                                        {mod.logo?.url && <img src={mod.logo.url} css={tw`w-12 h-12 rounded`} />}
                                        <div>
                                            <div css={tw`font-bold`}>{mod.name}</div>
                                            {mod.summary && (
                                                <div css={tw`text-sm text-neutral-400`}>{mod.summary}</div>
                                            )}
                                            {mod.downloadCount && (
                                                <div css={tw`text-xs text-neutral-500`}>
                                                    {mod.downloadCount.toLocaleString()} downloads
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {mod.latestFiles && mod.latestFiles.length > 0 && (
                                        <Button
                                            onClick={() => handleInstall(mod.id, mod.latestFiles![0].id)}
                                            size="small"
                                            disabled={loading}
                                        >
                                            Install
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p css={tw`text-center text-neutral-400 py-8`}>
                            Search for {type === 'mod' ? 'mods' : 'plugins'} to install
                        </p>
                    )}
                </TitledGreyBox>
            ) : (
                <TitledGreyBox title={'Installed ' + (type === 'mod' ? 'Mods' : 'Plugins')}>
                    {loading ? (
                        <Spinner size={'large'} centered />
                    ) : installedMods.length === 0 ? (
                        <p css={tw`text-center text-neutral-400 py-8`}>
                            No {type === 'mod' ? 'mods' : 'plugins'} installed.
                        </p>
                    ) : (
                        <div css={tw`space-y-2`}>
                            {installedMods.map((mod) => (
                                <div
                                    key={mod.id}
                                    css={tw`p-4 bg-neutral-700 rounded flex justify-between items-center`}
                                >
                                    <div>
                                        <div css={tw`font-bold`}>{mod.name}</div>
                                        <div css={tw`text-sm text-neutral-400`}>
                                            Version: {mod.version} | Status: {mod.status}
                                        </div>
                                        {mod.error_message && (
                                            <div css={tw`text-xs text-red-400`}>{mod.error_message}</div>
                                        )}
                                    </div>
                                    <Button onClick={() => handleUninstall(mod.id)} color={'red'} size="small">
                                        Uninstall
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </TitledGreyBox>
            )}
        </div>
    );
};
