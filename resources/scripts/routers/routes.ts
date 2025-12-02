import React, { lazy } from 'react';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import ServerPropertiesContainer from '@/components/server/configs/ServerPropertiesContainer';
import AdvancedConfigContainer from '@/components/server/configs/AdvancedConfigContainer';
import AnalyticsContainer from '@/components/server/analytics/AnalyticsContainer';
import ModsContainer from '@/components/server/mods/ModsContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import DedicatedServersContainer from '@/components/dashboard/dedicated/DedicatedServersContainer';
import DedicatedServerDetailContainer from '@/components/dashboard/dedicated/DedicatedServerDetailContainer';
import CreateDedicatedServerContainer from '@/components/dashboard/dedicated/CreateDedicatedServerContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import { FaBoltLightning, FaBoxArchive, FaCalendar, FaDatabase, FaEye, FaFolder, FaGear, FaKey, FaLock, FaPlay, FaTerminal, FaUser, FaUsers, FaServer, FaWrench, FaChartLine, FaScrewdriverWrench, FaPuzzlePiece } from 'react-icons/fa6';

// Each of the router files is already code split out appropriately — so
// all of the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));

interface RouteDefinition {
    path: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: React.ComponentType;
    exact?: boolean;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
    nestId?: number;
    eggId?: number;
    nestIds?: number[];
    eggIds?: number[];
}

interface Routes {
    // All of the routes available under "/account"
    account: RouteDefinition[];
    // All of the routes available under "/server/:id"
    server: {
        overview: ServerRouteDefinition[];
        management: ServerRouteDefinition[];
        tools: ServerRouteDefinition[];
        advanced: ServerRouteDefinition[];
    };
}

export default {
    account: [
        {
            path: '/',
            name: 'account.overview',
            component: AccountOverviewContainer,
            icon: FaUser,
            exact: true,
        },
        {
            path: '/api',
            name: 'account.api',
            icon: FaLock,
            component: AccountApiContainer,
        },
        {
            path: '/ssh',
            name: 'account.ssh',
            icon: FaKey,
            component: AccountSSHContainer,
        },
        {
            path: '/activity',
            name: 'account.activity',
            icon: FaEye,
            component: ActivityLogContainer,
        },
        {
            path: '/dedicated',
            name: 'account.dedicated',
            icon: FaServer,
            component: DedicatedServersContainer,
            exact: true,
        },
        {
            path: '/dedicated/:id/create',
            name: undefined,
            component: CreateDedicatedServerContainer,
            exact: true,
        },
        {
            path: '/dedicated/:id',
            name: undefined,
            component: DedicatedServerDetailContainer,
            exact: true,
        },
    ],
    server: {
        overview: [
            {
                path: '/',
                permission: null,
                name: 'server.console',
                component: ServerConsole,
                icon: FaTerminal,
                exact: true,
            },
            {
                path: '/analytics',
                permission: null,
                name: 'server.analytics',
                component: AnalyticsContainer,
                icon: FaChartLine,
            },
            {
                path: '/mods',
                permission: null,
                name: 'server.mods',
                component: ModsContainer,
                icon: FaPuzzlePiece,
            },
        ],
        management: [
            {
                path: '/files',
                permission: 'file.*',
                name: 'server.files',
                component: FileManagerContainer,
                icon: FaFolder,
            },
            {
                path: '/files/:action(edit|new)',
                permission: 'file.*',
                name: undefined,
                component: FileEditContainer,
            },
            {
                path: '/databases',
                permission: 'database.*',
                name: 'server.databases',
                component: DatabasesContainer,
                icon: FaDatabase,
            },
            {
                path: '/schedules',
                permission: 'schedule.*',
                name: 'server.schedules',
                component: ScheduleContainer,
                icon: FaCalendar,
            },
            {
                path: '/schedules/:id',
                permission: 'schedule.*',
                name: undefined,
                component: ScheduleEditContainer,
            },
            {
                path: '/backups',
                permission: 'backup.*',
                name: 'server.backups',
                component: BackupContainer,
                icon: FaBoxArchive,
            },
            {
                path: '/users',
                permission: 'user.*',
                name: 'server.users',
                component: UsersContainer,
                icon: FaUsers,
            },
        ],
        tools: [
            {
                path: '/startup',
                permission: 'startup.*',
                name: 'server.startup',
                component: StartupContainer,
                icon: FaPlay,
            },
            {
                path: '/network',
                permission: 'allocation.*',
                name: 'server.network',
                component: NetworkContainer,
                icon: FaBoltLightning,
            },
            {
                path: '/server-properties',
                permission: 'file.*',
                name: 'server.properties',
                component: ServerPropertiesContainer,
                icon: FaWrench,
            },
            {
                path: '/advanced-config',
                permission: 'file.*',
                name: 'server.advanced-config',
                component: AdvancedConfigContainer,
                icon: FaScrewdriverWrench,
            },
        ],
        advanced: [
            {
                path: '/settings',
                permission: ['settings.*', 'file.sftp'],
                name: 'server.settings',
                component: SettingsContainer,
                icon: FaGear,
            },
            {
                path: '/activity',
                permission: 'activity.*',
                name: 'server.activity',
                component: ServerActivityLogContainer,
                icon: FaEye,
            },
        ],
    },
} as Routes;
