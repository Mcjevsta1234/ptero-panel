import React, { useState, useEffect } from 'react';
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
    const [pageSize] = useState(20);

    const [selectedModpack, setSelectedModpack] = useState<Modpack | null>(null);
    const [versions, setVersions] = useState<ModpackVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<ModpackVersion | null>(null);
    const [deleteFiles, setDeleteFiles] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadModpacks();
    }, [page]);

    const loadModpacks = async () => {
        setLoading(true);
        clearFlashes();
        try {
            const data = await getModpacks(uuid, searchQuery, pageSize, page);
            setModpacks(data.data);
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
        loadModpacks();
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
            await installModpack(uuid, selectedModpack.id, selectedVersion.id, deleteFiles);
            addFlash({
                type: 'success',
                key: 'modpacks',
                message: `${selectedModpack.name} installation has started! Redirecting to console...`,
            });
            setDialogOpen(false);
            setSelectedModpack(null);
            
            // Redirect to console after 2 seconds
            setTimeout(() => {
                history.push(`/server/${uuid}`);
            }, 2000);
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
                    <div css={tw`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6`}>
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
                                    <div css={tw`flex items-center justify-between text-xs`}>
                                        <span css={tw`text-neutral-400`}>
                                            {(modpack.downloadCount / 1000000).toFixed(1)}M downloads
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div css={tw`flex justify-center gap-2`}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                css={tw`px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                                Previous
                            </button>
                            <span css={tw`px-4 py-2 bg-neutral-800 rounded`}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                css={tw`px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                                Next
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
