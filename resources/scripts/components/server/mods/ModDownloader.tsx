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
import { BubbleButton, BubbleCard, BubbleInput, BubbleSelect, BubbleModal } from '@/witchyworlds/ui';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('mods');
    const addFlash = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes.addFlash);

    const [searchQuery, setSearchQuery] = useState('');
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

    useEffect(() => {
        loadMods();
    }, [page]);

    const loadMods = async () => {
        setLoading(true);
        clearFlashes();
        try {
            const data = await searchMods(uuid, searchQuery, pageSize, page);
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
            <form onSubmit={handleSearch} css={tw`mb-6 flex gap-3`}>
                <div css={tw`flex-1`}>
                    <BubbleInput
                        type="text"
                        placeholder="Search mods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={<FontAwesomeIcon icon={faSearch} css={tw`w-5 h-5`} />}
                    />
                </div>
                <div css={tw`flex items-end`}>
                    <BubbleButton
                        type="submit"
                        disabled={loading}
                        variant="primary"
                        size="md"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </BubbleButton>
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
                            <BubbleCard
                                key={mod.id}
                                onClick={() => selectMod(mod)}
                                css={tw`cursor-pointer flex flex-col h-full`}
                            >
                                {mod.icon && (
                                    <div css={tw`w-full mb-2 bg-white/5 rounded-lg overflow-hidden flex-shrink-0`} style={{ paddingBottom: '100%', position: 'relative' }}>
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
                            </BubbleCard>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div css={tw`flex justify-center gap-2 mb-6`}>
                        <BubbleButton
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1 || loading}
                            variant="secondary"
                            size="md"
                        >
                            Previous
                        </BubbleButton>
                        <div css={tw`flex items-center gap-2 text-neutral-400 px-4 py-2`}>
                            <span>Page {page} of {totalPages}</span>
                        </div>
                        <BubbleButton
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || loading}
                            variant="secondary"
                            size="md"
                        >
                            Next
                        </BubbleButton>
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
                            <BubbleSelect
                                label="Select Version"
                                value={selectedVersion?.id || ''}
                                onChange={(e) => {
                                    const version = versions.find((v) => v.id === e.target.value);
                                    setSelectedVersion(version || null);
                                }}
                                options={versions.map((v) => ({
                                    value: v.id,
                                    label: `${v.name} (${v.fileName})`,
                                }))}
                            />
                            {versions.length === 0 && (
                                <div css={tw`text-neutral-500 text-sm mt-2`}>Loading versions...</div>
                            )}
                        </div>

                        {selectedVersion && (
                            <BubbleCard css={tw`text-sm text-neutral-300 mb-6`}>
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
                            </BubbleCard>
                        )}
                    </div>
                )}
            </Dialog.Confirm>
        </div>
    );
};
