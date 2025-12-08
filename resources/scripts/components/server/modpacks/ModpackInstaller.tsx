import React, { useState, useEffect, useCallback } from 'react';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import getModpacks, { Modpack } from '@/api/server/modpacks/getModpacks';
import getModpackVersions, { ModpackVersion } from '@/api/server/modpacks/getModpackVersions';
import installModpack from '@/api/server/modpacks/installModpack';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useFlashKey } from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch, faGamepad } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import { useStoreActions, Actions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useHistory } from 'react-router-dom';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('modpacks');
    const addFlash = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes.addFlash);
    const history = useHistory();

    const [searchQuery, setSearchQuery] = useState('');
    const [modpacks, setModpacks] = useState<Modpack[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(50);

    const [selectedModpack, setSelectedModpack] = useState<Modpack | null>(null);
    const [versions, setVersions] = useState<ModpackVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<ModpackVersion | null>(null);
    const [deleteFiles, setDeleteFiles] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        // Load modpacks on mount and when page changes
        loadModpacks();
    }, [page]);

    const loadModpacks = useCallback(async () => {
        setLoading(true);
        clearFlashes();
        try {
            const data = await getModpacks(uuid, searchQuery, pageSize, page);
            console.log('Full API response:', data);
            console.log('Pagination object:', data.meta?.pagination);
            console.log('Total pages:', data.meta?.pagination?.total_pages);
            
            let newModpacks = data.data || [];
            
            // If we got fewer than 50 modpacks and there are still pages, keep loading until we fill the page or reach the end
            let currentPage = page;
            const totalPages = data.meta?.pagination?.total_pages || 1;
            while (newModpacks.length < pageSize && currentPage < totalPages) {
                currentPage++;
                const nextPageData = await getModpacks(uuid, searchQuery, pageSize, currentPage);
                newModpacks = [...newModpacks, ...nextPageData.data];
            }
            
            setModpacks(newModpacks.slice(0, pageSize));
            setTotalPages(totalPages);
            console.log('Final totalPages state:', totalPages);
        } catch (error) {
            console.error('Error loading modpacks:', error);
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
        }
    }, [uuid, searchQuery, pageSize, page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        // Don't call loadModpacks here - let the useEffect handle it when page changes to 1
    };

    const selectModpack = async (modpack: Modpack) => {
        setSelectedModpack(modpack);
        setDialogOpen(true);
        setVersions([]);
        setSelectedVersion(null);
        
        try {
            const versionData = await getModpackVersions(uuid, modpack.id);
            setVersions(versionData);
            if (versionData.length > 0) {
                setSelectedVersion(versionData[0]);
            }
        } catch (error) {
            clearAndAddHttpError(error as Error);
            setDialogOpen(false);
        }
    };

    const handleInstall = async () => {
        if (!selectedModpack || !selectedVersion) return;

        setInstalling(true);
        clearFlashes();
        try {
            // Extract minecraft version from gameVersions if available
            const minecraftVersion = selectedVersion.gameVersions?.length > 0 
                ? selectedVersion.gameVersions[0] 
                : undefined;

            await installModpack(uuid, selectedModpack.id, selectedVersion.id, deleteFiles, minecraftVersion);
            addFlash({
                type: 'success',
                key: 'modpacks',
                message: `${selectedModpack.name} installation has started! Redirecting to console...`,
            });
            setDialogOpen(false);
            setSelectedModpack(null);
            
            // Redirect to console immediately so user can watch the installation
            setTimeout(() => {
                history.push(`/server/${uuid}`);
            }, 1000);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div css={tw`w-full`}>
            <FlashMessageRender byKey={'modpacks'} css={tw`mb-4`} />

            {/* Header */}
            <div css={tw`mb-6`}>
                <h1 css={tw`text-3xl font-bold text-neutral-100 flex items-center gap-3`}>
                    <FontAwesomeIcon icon={faGamepad} css={tw`text-primary-400`} />
                    Modpack Installer
                </h1>
                <p css={tw`text-neutral-400 mt-2`}>
                    Browse and install modpacks from CurseForge. Installing a modpack will stop your server and may take several minutes.
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} css={tw`mb-6 flex gap-3`}>
                <div css={tw`flex-1 relative`}>
                    <FontAwesomeIcon
                        icon={faSearch}
                        css={tw`absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400`}
                    />
                    <input
                        type="text"
                        placeholder="Search modpacks..."
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
            </form>

            {/* Modpacks Grid */}
            {loading ? (
                <div css={tw`flex justify-center items-center py-20`}>
                    <Spinner size={'large'} />
                </div>
            ) : modpacks.length === 0 ? (
                <div css={tw`text-center py-20`}>
                    <p css={tw`text-neutral-400 text-lg`}>No modpacks found. Try a different search term.</p>
                </div>
            ) : (
                <>
                    <div css={tw`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-6`}>
                        {modpacks.map((modpack) => (
                            <div
                                key={modpack.id}
                                className="group"
                                css={tw`bg-neutral-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all duration-200 cursor-pointer relative`}
                                onClick={() => selectModpack(modpack)}
                            >
                                {/* Image Container */}
                                <div css={tw`w-full h-48 bg-neutral-900 flex items-center justify-center overflow-hidden relative`}>
                                    {modpack.iconUrl ? (
                                        <img
                                            src={modpack.iconUrl}
                                            alt={modpack.name}
                                            css={tw`w-full h-full object-cover group-hover:scale-110 transition-transform duration-200`}
                                        />
                                    ) : (
                                        <FontAwesomeIcon icon={faGamepad} css={tw`text-6xl text-neutral-700`} />
                                    )}
                                    {/* Overlay on hover */}
                                    <div css={tw`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center`}>
                                        <FontAwesomeIcon
                                            icon={faDownload}
                                            css={tw`text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                                        />
                                    </div>
                                </div>
                                
                                {/* Info Container */}
                                <div css={tw`p-3`}>
                                    <h3 css={tw`text-sm font-bold text-neutral-100 truncate mb-1`} title={modpack.name}>
                                        {modpack.name}
                                    </h3>
                                    <p css={tw`text-xs text-neutral-300 line-clamp-2 mb-2 h-8`}>
                                        {modpack.description}
                                    </p>
                                    <div css={tw`flex items-center justify-between text-xs`}>
                                        <span css={tw`text-neutral-400`}>
                                            {(modpack.downloadCount / 1000000).toFixed(1)}M downloads
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination - Show if there are multiple pages */}
                    {(totalPages > 1 || modpacks.length >= pageSize) && (
                        <div css={tw`flex justify-center items-center gap-6 mt-10 pt-8 border-t border-neutral-700`}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className={`px-8 py-3 font-bold text-white rounded-lg transition-all duration-200 ${
                                    page === 1
                                        ? 'bg-neutral-600 cursor-not-allowed opacity-50'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                                }`}
                            >
                                ← Previous
                            </button>
                            <div css={tw`flex flex-col items-center gap-2`}>
                                <span css={tw`text-lg font-bold text-blue-400`}>
                                    Page {page} of {totalPages}
                                </span>
                                <span css={tw`text-sm text-neutral-400`}>
                                    Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, modpacks.length + (page - 1) * 50)} modpacks
                                </span>
                            </div>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className={`px-8 py-3 font-bold text-white rounded-lg transition-all duration-200 ${
                                    page === totalPages
                                        ? 'bg-neutral-600 cursor-not-allowed opacity-50'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                                }`}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Installation Dialog */}
            <Dialog.Confirm
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={`Install ${selectedModpack?.name}`}
                confirm={'Install Modpack'}
                onConfirmed={handleInstall}
            >
                {selectedModpack && (
                    <div>
                        <p css={tw`mb-4 text-neutral-300`}>
                            Select a version of <strong>{selectedModpack.name}</strong> to install.
                        </p>

                        {versions.length > 0 ? (
                            <>
                                <label css={tw`block mb-2 text-sm font-medium text-neutral-200`}>Modpack Version</label>
                                <select
                                    value={selectedVersion?.id || ''}
                                    onChange={(e) => {
                                        const version = versions.find((v) => v.id === e.target.value);
                                        setSelectedVersion(version || null);
                                    }}
                                    css={tw`w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 mb-4`}
                                >
                                    {versions.map((version) => (
                                        <option key={version.id} value={version.id}>
                                            {version.name}
                                            {version.gameVersions.length > 0 &&
                                                ` (Minecraft ${version.gameVersions.join(', ')})`}
                                        </option>
                                    ))}
                                </select>

                                {selectedVersion && selectedVersion.javaVersion && (
                                    <div css={tw`bg-purple-900/20 border border-purple-700 rounded p-4 mb-4`}>
                                        <div css={tw`flex items-start`}>
                                            <svg css={tw`w-5 h-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <div css={tw`font-medium text-purple-300 mb-1`}>Java Version Required</div>
                                                <div css={tw`text-sm text-purple-200`}>
                                                    Minecraft {selectedVersion.minecraftVersion || 'this version'} requires <strong>Java {selectedVersion.javaVersion}</strong>.
                                                </div>
                                                <div css={tw`text-xs text-purple-300 mt-2`}>
                                                    ⚠️ Please set <strong>Java {selectedVersion.javaVersion}</strong> in the <strong>Startup</strong> tab after installation.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div css={tw`bg-neutral-800 border border-neutral-700 rounded p-4 mb-4`}>
                                    <label css={tw`flex items-center cursor-pointer`}>
                                        <input
                                            type="checkbox"
                                            checked={deleteFiles}
                                            onChange={(e) => setDeleteFiles(e.target.checked)}
                                            css={tw`mr-3 w-4 h-4`}
                                        />
                                        <div>
                                            <div css={tw`font-medium text-neutral-100`}>Delete all server files</div>
                                            <div css={tw`text-sm text-neutral-400`}>
                                                Recommended for clean installations. This cannot be undone!
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div css={tw`bg-blue-900/20 border border-blue-700 rounded p-4 mb-4`}>
                                    <p css={tw`text-sm text-blue-300`}>
                                        <strong>Minecraft EULA:</strong> By clicking "Install Modpack", you agree to the{' '}
                                        <a
                                            href="https://www.minecraft.net/en-us/eula"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            css={tw`underline hover:text-blue-200`}
                                        >
                                            Minecraft End User License Agreement
                                        </a>
                                        . The EULA will be automatically accepted (eula=true) and the server will start automatically after installation.
                                    </p>
                                </div>

                                <p css={tw`text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-700 rounded p-3`}>
                                    <strong>Note:</strong> The server will be stopped and the modpack will be installed.
                                    Installation may take several minutes. You will be redirected to the console when complete.
                                </p>
                            </>
                        ) : (
                            <Spinner size={'large'} centered />
                        )}
                    </div>
                )}
            </Dialog.Confirm>
        </div>
    );
};
