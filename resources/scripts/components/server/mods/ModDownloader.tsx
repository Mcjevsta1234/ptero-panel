import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { searchMods, getModVersions, downloadMod, Mod, ModVersion } from '@/api/server/mods/getMods';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useFlashKey } from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch, faBox } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import { useStoreActions, Actions } from 'easy-peasy';
import { ApplicationStore } from '@/state';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('mods');
    const addFlash = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes.addFlash);

    const [searchQuery, setSearchQuery] = useState('');
    const [gameVersion, setGameVersion] = useState<string>('');
    const [categoryId, setCategoryId] = useState<number | undefined>();
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(12);

    const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
    const [versions, setVersions] = useState<ModVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<ModVersion | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Common Minecraft versions for filter
    const minecraftVersions = [
        { label: 'All Versions', value: '' },
        // 1.20+ versions
        { label: '1.21.3', value: '1.21.3' },
        { label: '1.21.2', value: '1.21.2' },
        { label: '1.21.1', value: '1.21.1' },
        { label: '1.21', value: '1.21' },
        { label: '1.20.6', value: '1.20.6' },
        { label: '1.20.5', value: '1.20.5' },
        { label: '1.20.4', value: '1.20.4' },
        { label: '1.20.3', value: '1.20.3' },
        { label: '1.20.2', value: '1.20.2' },
        { label: '1.20.1', value: '1.20.1' },
        { label: '1.20', value: '1.20' },
        // 1.19 versions
        { label: '1.19.2', value: '1.19.2' },
        { label: '1.19.1', value: '1.19.1' },
        { label: '1.19', value: '1.19' },
        // 1.18 versions
        { label: '1.18.2', value: '1.18.2' },
        { label: '1.18.1', value: '1.18.1' },
        { label: '1.18', value: '1.18' },
        // 1.17 versions
        { label: '1.17.1', value: '1.17.1' },
        { label: '1.17', value: '1.17' },
        // 1.16 versions
        { label: '1.16.5', value: '1.16.5' },
        { label: '1.16.4', value: '1.16.4' },
        { label: '1.16.3', value: '1.16.3' },
        { label: '1.16.2', value: '1.16.2' },
        { label: '1.16.1', value: '1.16.1' },
        { label: '1.16', value: '1.16' },
        // 1.15 versions
        { label: '1.15.2', value: '1.15.2' },
        { label: '1.15.1', value: '1.15.1' },
        { label: '1.15', value: '1.15' },
        // 1.14 versions
        { label: '1.14.4', value: '1.14.4' },
        { label: '1.14.3', value: '1.14.3' },
        { label: '1.14.2', value: '1.14.2' },
        { label: '1.14.1', value: '1.14.1' },
        { label: '1.14', value: '1.14' },
        // 1.12 versions
        { label: '1.12.2', value: '1.12.2' },
        { label: '1.12.1', value: '1.12.1' },
        { label: '1.12', value: '1.12' },
        // Earlier versions
        { label: '1.8', value: '1.8' },
    ];

    // CurseForge mod loaders (categories)
    const modLoaders = [
        { label: 'All Loaders', value: 0 },
        { label: 'Forge', value: 5 },
        { label: 'Fabric', value: 12 },
        { label: 'Quilt', value: 58 },
        { label: 'NeoForge', value: 61 },
    ];

    useEffect(() => {
        // Only load on initial mount
        loadMods(1, '', '', undefined);
    }, []);  // Empty dependency array - only run on mount

    const loadMods = async (pageNum: number = page, query: string = searchQuery, version: string = gameVersion, loader: number | undefined = categoryId) => {
        setLoading(true);
        clearFlashes();
        try {
            const data = await searchMods(
                uuid,
                query,
                pageSize,
                pageNum,
                version || undefined,
                loader || undefined
            );
            setMods(data.data);
            setTotalPages(data.meta.pagination.total_pages);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadMods(1, searchQuery, gameVersion, categoryId);
    };

    const handleFilterChange = (newGameVersion?: string, newCategoryId?: number) => {
        setPage(1);
        loadMods(1, searchQuery, newGameVersion || gameVersion, newCategoryId !== undefined ? newCategoryId : categoryId);
    };

    const selectMod = async (mod: Mod) => {
        setSelectedMod(mod);
        setDialogOpen(true);
        setVersions([]);
        setSelectedVersion(null);

        try {
            const versionData = await getModVersions(uuid, mod.id);
            setVersions(versionData.data);
            if (versionData.data.length > 0) {
                setSelectedVersion(versionData.data[0]);
            }
        } catch (error) {
            clearAndAddHttpError(error as Error);
            setDialogOpen(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedMod || !selectedVersion) return;

        setDownloading(true);
        clearFlashes();
        try {
            await downloadMod(uuid, selectedMod.id, selectedVersion.id);
            addFlash({
                type: 'success',
                key: 'mods',
                message: `${selectedMod.name} download started!`,
            });
            setDialogOpen(false);
            setSelectedMod(null);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div css={tw`w-full`}>
            <FlashMessageRender byKey={'mods'} css={tw`mb-4`} />

            {/* Header */}
            <div css={tw`mb-6`}>
                <h1 css={tw`text-3xl font-bold text-neutral-100 flex items-center gap-3`}>
                    <FontAwesomeIcon icon={faBox} css={tw`text-primary-400`} />
                    Mod Downloader
                </h1>
                <p css={tw`text-neutral-400 mt-2`}>
                    Browse and download mods from CurseForge for your server.
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} css={tw`mb-6 flex flex-col gap-4`}>
                <div css={tw`flex gap-3`}>
                    <div css={tw`flex-1 relative`}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            css={tw`absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400`}
                        />
                        <input
                            type="text"
                            placeholder="Search mods..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            css={tw`w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none transition-colors`}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        css={tw`px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Filters */}
                <div css={tw`flex flex-col md:flex-row gap-3`}>
                    <div css={tw`flex-1`}>
                        <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>
                            Minecraft Version
                        </label>
                        <select
                            value={gameVersion}
                            onChange={(e) => {
                                const newVersion = e.target.value;
                                setGameVersion(newVersion);
                                handleFilterChange(newVersion, categoryId);
                            }}
                            css={tw`w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:border-primary-500 focus:outline-none`}
                        >
                            {minecraftVersions.map((version) => (
                                <option key={version.value} value={version.value}>
                                    {version.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div css={tw`flex-1`}>
                        <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>
                            Mod Loader
                        </label>
                        <select
                            value={categoryId || 0}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                const newCategoryId = value === 0 ? undefined : value;
                                setCategoryId(newCategoryId);
                                handleFilterChange(gameVersion, newCategoryId);
                            }}
                            css={tw`w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:border-primary-500 focus:outline-none`}
                        >
                            {modLoaders.map((loader) => (
                                <option key={loader.value} value={loader.value}>
                                    {loader.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </form>

            {/* Mods Grid */}
            {loading ? (
                <div css={tw`flex justify-center items-center py-12`}>
                    <Spinner />
                </div>
            ) : mods.length === 0 ? (
                <div css={tw`text-center py-12 text-neutral-400`}>
                    {searchQuery ? 'No mods found. Try a different search.' : 'Enter a search query to find mods.'}
                </div>
            ) : (
                <>
                    <div css={tw`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6`}>
                        {mods.map((mod) => (
                            <div
                                key={mod.id}
                                css={tw`bg-neutral-800 border border-neutral-700 rounded-lg p-3 hover:border-primary-500 transition-colors cursor-pointer flex flex-col`}
                                onClick={() => selectMod(mod)}
                            >
                                {mod.icon && (
                                    <div css={tw`w-full mb-2 bg-neutral-700 rounded-md overflow-hidden flex-shrink-0`} style={{ paddingBottom: '100%', position: 'relative' }}>
                                        <img
                                            src={mod.icon}
                                            alt={mod.name}
                                            css={tw`absolute inset-0 w-full h-full object-cover`}
                                        />
                                    </div>
                                )}
                                <h3 css={tw`font-semibold text-neutral-100 truncate text-sm mb-1`}>{mod.name}</h3>
                                <p css={tw`text-xs text-neutral-400 line-clamp-1 mb-2 flex-grow`}>{mod.description}</p>
                                <div css={tw`text-xs text-neutral-500 flex items-center justify-between`}>
                                    <span css={tw`truncate`}>{(mod.downloadCount / 1000).toFixed(0)}k</span>
                                    <FontAwesomeIcon icon={faDownload} css={tw`text-primary-400 flex-shrink-0`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div css={tw`flex justify-center gap-2 mb-6`}>
                        <button
                            onClick={() => {
                                const newPage = Math.max(1, page - 1);
                                setPage(newPage);
                                loadMods(newPage, searchQuery, gameVersion, categoryId);
                            }}
                            disabled={page === 1 || loading}
                            css={tw`px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors`}
                        >
                            Previous
                        </button>
                        <div css={tw`flex items-center gap-2 text-neutral-400`}>
                            <span>Page {page} of {totalPages}</span>
                        </div>
                        <button
                            onClick={() => {
                                const newPage = Math.min(totalPages, page + 1);
                                setPage(newPage);
                                loadMods(newPage, searchQuery, gameVersion, categoryId);
                            }}
                            disabled={page === totalPages || loading}
                            css={tw`px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors`}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* Version Selection Dialog */}
            <Dialog.Confirm
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={`Download ${selectedMod?.name}`}
                confirm={'Download'}
                onConfirmed={handleDownload}
            >
                {selectedMod && (
                    <div>
                        <p css={tw`text-neutral-300 mb-6 text-sm`}>
                            {selectedMod.description}
                        </p>

                        <div css={tw`mb-6`}>
                            <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>
                                Select Version
                            </label>
                            {versions.length === 0 ? (
                                <div css={tw`text-neutral-500 text-sm`}>Loading versions...</div>
                            ) : (
                                <select
                                    value={selectedVersion?.id || ''}
                                    onChange={(e) => {
                                        const version = versions.find((v) => v.id === e.target.value);
                                        setSelectedVersion(version || null);
                                    }}
                                    css={tw`w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:border-primary-500 focus:outline-none`}
                                >
                                    {versions.map((version) => (
                                        <option key={version.id} value={version.id}>
                                            {version.name} ({version.fileName})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedVersion && (
                            <div css={tw`p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300`}>
                                <p css={tw`mb-2`}>
                                    <strong>File:</strong> {selectedVersion.fileName}
                                </p>
                                <p css={tw`mb-2`}>
                                    <strong>Size:</strong> {(selectedVersion.fileLength / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {selectedVersion.gameVersions.length > 0 && (
                                    <p>
                                        <strong>Minecraft Versions:</strong> {selectedVersion.gameVersions.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog.Confirm>
        </div>
    );
};
