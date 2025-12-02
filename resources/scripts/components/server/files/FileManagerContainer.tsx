import React, { useEffect, useState, useMemo } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import style from './style.module.css';
import Card from '@/witchyworlds/ui/Card';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface RecentFile {
    name: string;
    path: string;
    directory: string;
    timestamp: number;
}

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const { t } = useTranslation('server/files');
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [searchQuery, setSearchQuery] = useState('');
    const [showRecent, setShowRecent] = useState(false);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
        setSearchQuery('');
        setShowRecent(false);
        loadRecentFiles();
    }, [hash]);

    const loadRecentFiles = () => {
        try {
            const stored = localStorage.getItem(`recent_files_${id}`);
            if (stored) {
                const parsed: RecentFile[] = JSON.parse(stored);
                setRecentFiles(parsed.filter(f => Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000).slice(0, 5));
            }
        } catch (e) {
            console.error('Failed to load recent files', e);
        }
    };

    const trackFileView = (file: FileObject) => {
        if (!file.isFile) return;
        try {
            const recent: RecentFile = {
                name: file.name,
                path: `${directory}/${file.name}`.replace(/\/+/g, '/'),
                directory: directory,
                timestamp: Date.now(),
            };
            const stored = localStorage.getItem(`recent_files_${id}`);
            let recents: RecentFile[] = stored ? JSON.parse(stored) : [];
            recents = recents.filter(r => r.path !== recent.path);
            recents.unshift(recent);
            recents = recents.slice(0, 5);
            localStorage.setItem(`recent_files_${id}`, JSON.stringify(recents));
            setRecentFiles(recents);
        } catch (e) {
            console.error('Failed to track file view', e);
        }
    };

    useEffect(() => {
        mutate();
    }, [directory]);

    const filteredFiles = useMemo(() => {
        if (!files) return [];
        if (!searchQuery.trim()) return files;
        const query = searchQuery.toLowerCase();
        return files.filter(file => file.name.toLowerCase().includes(query));
    }, [files, searchQuery]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? filteredFiles?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={t('title')} showFlashKey={'files'}>
            <ErrorBoundary>
                <Card className={'flex flex-wrap-reverse md:flex-nowrap mb-1 mt-2 !rounded-b-none !px-2 !py-3'}>
                    <FileManagerBreadcrumbs
                        renderLeft={
                            <FileActionCheckbox
                                type={'checkbox'}
                                css={tw`mx-4`}
                                checked={selectedFilesLength === (filteredFiles?.length === 0 ? -1 : filteredFiles?.length)}
                                onChange={onSelectAllClick}
                            />
                        }
                    />
                    <Can action={'file.create'}>
                        <div className={style.manager_actions}>
                            <FileManagerStatus />
                            <NewDirectoryButton />
                            <UploadButton />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <Button>{t('new-file')}</Button>
                            </NavLink>
                        </div>
                    </Can>
                </Card>
                <Card className={'mb-1 !rounded-t-none !rounded-b-none !px-3 !py-2'}>
                    <div className={'flex items-center gap-2'}>
                        <button
                            type={'button'}
                            onClick={() => setShowRecent(false)}
                            className={`px-3 py-1 rounded ${!showRecent ? 'bg-primary-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            Files
                        </button>
                        <button
                            type={'button'}
                            onClick={() => setShowRecent(true)}
                            className={`px-3 py-1 rounded ${showRecent ? 'bg-primary-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            Recent ({recentFiles.length})
                        </button>
                        {!showRecent && (
                            <div className={'relative flex-1'}>
                                <FontAwesomeIcon icon={faSearch} className={'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'} />
                                <input
                                    type="text"
                                    placeholder={t('search-files', { defaultValue: 'Search files...' })}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={'w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'}
                                />
                            </div>
                        )}
                    </div>
                </Card>
            </ErrorBoundary>
            {!files ? (
                <Spinner size={'large'} centered />
            ) : (
                <Card className='!rounded-t-none !p-3'>
                    {showRecent ? (
                        recentFiles.length === 0 ? (
                            <p css={tw`text-sm text-neutral-400 text-center`}>
                                {t('no-recent', { defaultValue: 'No recently viewed files.' })}
                            </p>
                        ) : (
                            <div>
                                {recentFiles.map((rf) => (
                                    <FileObjectRow
                                        key={rf.path}
                                        file={{
                                            key: rf.path,
                                            name: rf.name,
                                            mode: '-rw-r--r--',
                                            modeBits: '0644',
                                            size: 0,
                                            isFile: true,
                                            isSymlink: false,
                                            mimetype: 'application/octet-stream',
                                            createdAt: new Date(rf.timestamp),
                                            modifiedAt: new Date(rf.timestamp),
                                            isArchiveType: () => false,
                                            isEditable: () => true,
                                        }}
                                    />
                                ))}
                            </div>
                        )
                    ) : !filteredFiles.length ? (
                        <p css={tw`text-sm text-neutral-400 text-center`}>
                            {searchQuery ? t('no-results', { defaultValue: 'No files match your search.' }) : t('empty')}
                        </p>
                    ) : (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div>
                                {searchQuery && (
                                    <div css={tw`rounded bg-blue-500/20 mb-2 p-2 border border-blue-500/50`}>
                                        <p css={tw`text-blue-300 text-sm text-center`}>
                                            {t('search-results', { defaultValue: 'Showing {{count}} result(s) for "{{query}}"', count: filteredFiles.length, query: searchQuery })}
                                        </p>
                                    </div>
                                )}
                                {filteredFiles.length > 250 && (
                                    <div css={tw`rounded bg-yellow-400 mb-px p-3`}>
                                        <p css={tw`text-yellow-900 text-sm text-center`}>{t('too-large')}</p>
                                    </div>
                                )}
                                {sortFiles(filteredFiles.slice(0, 250)).map((file) => (
                                    <FileObjectRow key={file.key} file={file} />
                                ))}
                                <MassActionsBar />
                            </div>
                        </CSSTransition>
                    )}
                </Card>
            )}
        </ServerContentBlock>
    );
};
