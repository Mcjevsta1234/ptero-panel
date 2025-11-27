import React, { useState } from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { RouterContainer } from '@/witchyworlds/ui/RouterContainer';
import Navbar from '@/witchyworlds/ui/Navbar';
import { LogoContainer } from '@/witchyworlds/ui/LogoContainer';
import { XIcon, MenuIcon } from '@heroicons/react/solid';
import tw from 'twin.macro';
import { ContentContainer } from '@/witchyworlds/ui/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '@/witchyworlds/ui/Sidebar';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';
import Announcement from '@/witchyworlds/ui/Announcement';
import MaintenanceAlert from '@/witchyworlds/ui/MaintenanceAlert';
import Maintenance from '@/witchyworlds/ui/Maintenance';
import { useTranslation } from 'react-i18next';

interface Props {
    route: any;
}

const NavItem = ({ route }: Props) => {
    const { t } = useTranslation('routes');
    const to = (value: string) => {
        return `/account/${value.replace(/^\/+/, '')}`;
    };

    return (
        <NavLink id={route.name} to={to(route.path)} exact={route.exact}>
            <span className='flex items-center'>
                {route.icon && <route.icon className={`w-5 mr-1`} />} {route.name ? t(route.name as string) : null}
            </span>
        </NavLink>
    );
};

const DashboardNavigation = () => {
    return (
        <>
            {routes.account
                .filter((route) => !!route.name)
                .map((route) => (
                    <NavItem key={route.path} route={route} />
                ))}
        </>
    );
};

export default () => {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const logo = useStoreState((state: ApplicationStore) => state.settings.data!.logo);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const isUnderMaintenance = useStoreState((state) => state.witchyworlds.data?.isUnderMaintenance);
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);
    return (
        <>
            {isUnderMaintenance && !rootAdmin ? (
                <Maintenance />
            ) : (
                <RouterContainer>
                    <Navbar>
                        <div className='lg:hidden'>
                            <button
                                onClick={() => setSidebarOpen(!isSidebarOpen)}
                                className='text-gray-500 bg-gray-700 p-2 rounded-ui'
                            >
                                {isSidebarOpen ? <XIcon className='w-6 h-6' /> : <MenuIcon className='w-6 h-6' />}
                            </button>
                        </div>
                        <LogoContainer>
                            <img
                                src={logo}
                                alt={name}
                                onClick={() => (window.location.href = '/')}
                                css={tw`h-[3rem] mt-5 cursor-pointer`}
                            />
                        </LogoContainer>
                    </Navbar>
                    <ContentContainer>
                        {isSidebarOpen && (
                            <div
                                onClick={() => setSidebarOpen(false)}
                                className='fixed inset-0 z-30 bg-gray-800/40 backdrop-blur-sm transition-all duration-300 ease-in-out lg:hidden'
                            />
                        )}
                        <CSSTransition timeout={150} classNames='fade'>
                            <Sidebar isOpen={isSidebarOpen} dashboard>
                                <DashboardNavigation />
                            </Sidebar>
                        </CSSTransition>
                        <div className='w-full flex-1 overflow-y-auto'>
                            <TransitionRouter>
                                <React.Suspense fallback={<Spinner centered />}>
                                    <Switch location={location}>
                                        <Route path={'/'} exact>
                                            <Announcement />
                                            <MaintenanceAlert />
                                            <DashboardContainer />
                                        </Route>
                                        {routes.account.map(({ path, component: Component }) => (
                                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                                <Component />
                                            </Route>
                                        ))}
                                        <Route path={'*'}>
                                            <NotFound />
                                        </Route>
                                    </Switch>
                                </React.Suspense>
                            </TransitionRouter>
                        </div>
                    </ContentContainer>
                </RouterContainer>
            )}
        </>
    );
};
