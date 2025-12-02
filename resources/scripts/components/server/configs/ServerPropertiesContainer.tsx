import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import ContentBlock from '@/witchyworlds/ui/ContentBlock';
import Card from '@/witchyworlds/ui/Card';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import getServerProperties from '@/api/server/configs/getServerProperties';
import updateServerProperties from '@/api/server/configs/updateServerProperties';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import { useTranslation } from 'react-i18next';
import MotdEditor from './MotdEditor';

interface PropertyConfig {
    label: string;
    description: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: Array<{ value: string | number; label: string }>;
    category: string;
}

const propertyConfigs: Record<string, PropertyConfig> = {
    // Server Settings
    'server-port': { label: 'Server Port', description: 'The port the server listens on', type: 'number', category: 'Server' },
    'server-ip': { label: 'Server IP', description: 'IP address to bind to (leave empty for all)', type: 'text', category: 'Server' },
    'motd': { label: 'MOTD', description: 'Message of the day shown in server list', type: 'motd' as any, category: 'Server' },
    'max-players': { label: 'Max Players', description: 'Maximum number of players', type: 'number', category: 'Server' },
    'white-list': { label: 'Whitelist', description: 'Enable whitelist', type: 'boolean', category: 'Server' },
    'online-mode': { label: 'Online Mode', description: 'Verify player authenticity with Mojang', type: 'boolean', category: 'Server' },
    
    // World Settings
    'level-name': { label: 'World Name', description: 'Name of the world folder', type: 'text', category: 'World' },
    'level-seed': { label: 'World Seed', description: 'Seed for world generation', type: 'text', category: 'World' },
    'level-type': { 
        label: 'World Type', 
        description: 'Type of world to generate', 
        type: 'select', 
        category: 'World',
        options: [
            { value: 'minecraft:normal', label: 'Normal' },
            { value: 'minecraft:flat', label: 'Flat' },
            { value: 'minecraft:large_biomes', label: 'Large Biomes' },
            { value: 'minecraft:amplified', label: 'Amplified' },
        ]
    },
    'generate-structures': { label: 'Generate Structures', description: 'Generate structures (villages, etc.)', type: 'boolean', category: 'World' },
    'spawn-monsters': { label: 'Spawn Monsters', description: 'Allow hostile mobs to spawn', type: 'boolean', category: 'World' },
    'spawn-animals': { label: 'Spawn Animals', description: 'Allow passive mobs to spawn', type: 'boolean', category: 'World' },
    'spawn-npcs': { label: 'Spawn NPCs', description: 'Allow villagers to spawn', type: 'boolean', category: 'World' },
    
    // Gameplay
    'difficulty': { 
        label: 'Difficulty', 
        description: 'Game difficulty', 
        type: 'select', 
        category: 'Gameplay',
        options: [
            { value: 'peaceful', label: 'Peaceful' },
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
        ]
    },
    'gamemode': { 
        label: 'Default Gamemode', 
        description: 'Default game mode for new players', 
        type: 'select', 
        category: 'Gameplay',
        options: [
            { value: 'survival', label: 'Survival' },
            { value: 'creative', label: 'Creative' },
            { value: 'adventure', label: 'Adventure' },
            { value: 'spectator', label: 'Spectator' },
        ]
    },
    'hardcore': { label: 'Hardcore', description: 'Enable hardcore mode', type: 'boolean', category: 'Gameplay' },
    'pvp': { label: 'PvP', description: 'Enable player vs player combat', type: 'boolean', category: 'Gameplay' },
    'force-gamemode': { label: 'Force Gamemode', description: 'Force players to use default gamemode', type: 'boolean', category: 'Gameplay' },
    
    // Performance
    'view-distance': { label: 'View Distance', description: 'Server-side view distance in chunks', type: 'number', category: 'Performance' },
    'simulation-distance': { label: 'Simulation Distance', description: 'Distance in chunks where mobs/crops update', type: 'number', category: 'Performance' },
    'max-tick-time': { label: 'Max Tick Time', description: 'Max milliseconds before server watchdog kicks in', type: 'number', category: 'Performance' },
    'network-compression-threshold': { label: 'Network Compression Threshold', description: 'Packet compression threshold in bytes', type: 'number', category: 'Performance' },
    
    // Other
    'allow-flight': { label: 'Allow Flight', description: 'Allow players to fly in survival mode', type: 'boolean', category: 'Other' },
    'allow-nether': { label: 'Allow Nether', description: 'Enable the Nether dimension', type: 'boolean', category: 'Other' },
    'enable-command-block': { label: 'Command Blocks', description: 'Enable command blocks', type: 'boolean', category: 'Other' },
    'spawn-protection': { label: 'Spawn Protection', description: 'Radius of spawn protection in blocks', type: 'number', category: 'Other' },
};

export default () => {
    const { t } = useTranslation('server/configs');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState<Record<string, any>>({});
    const { addFlash, clearFlashes } = useFlash();

    useEffect(() => {
        clearFlashes('configs');
        getServerProperties(uuid)
            .then((data) => {
                setProperties(data);
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    key: 'configs',
                    type: 'error',
                    message: 'Failed to load server properties',
                });
            })
            .finally(() => setLoading(false));
    }, [uuid]);

    const handleSave = () => {
        clearFlashes('configs');
        setSaving(true);
        updateServerProperties(uuid, properties)
            .then(() => {
                addFlash({
                    key: 'configs',
                    type: 'success',
                    message: 'Server properties updated successfully! Restart your server for changes to take effect.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    key: 'configs',
                    type: 'error',
                    message: 'Failed to update server properties',
                });
            })
            .finally(() => setSaving(false));
    };

    const handleChange = (key: string, value: any) => {
        setProperties((prev) => ({ ...prev, [key]: value }));
    };

    const categories = Array.from(new Set(Object.values(propertyConfigs).map((c) => c.category)));

    if (loading) {
        return (
            <ContentBlock title={'Server Properties'}>
                <Spinner size={'large'} centered />
            </ContentBlock>
        );
    }

    return (
        <ContentBlock title={'Server Properties'}>
            <FlashMessageRender byKey={'configs'} css={tw`mb-4`} />
            
            <div css={tw`space-y-4 mb-4`}>
                {categories.map((category) => (
                    <Card key={category} css={tw`p-4`}>
                        <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>{category}</h3>
                        <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                            {Object.entries(propertyConfigs)
                                .filter(([_, config]) => config.category === category)
                                .map(([key, config]) => {
                                    const value = properties[key];
                                    
                                    return (
                                        <div key={key} css={[tw`space-y-2`, key === 'motd' && tw`col-span-full`]}>
                                            <label css={tw`block text-sm font-medium text-gray-200`}>
                                                {config.label}
                                            </label>
                                            <p css={tw`text-xs text-gray-400`}>{config.description}</p>
                                            
                                            {key === 'motd' ? (
                                                <MotdEditor
                                                    value={value || ''}
                                                    onChange={(newValue) => handleChange(key, newValue)}
                                                />
                                            ) : config.type === 'boolean' ? (
                                                <label css={tw`flex items-center space-x-2`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={value === true}
                                                        onChange={(e) => handleChange(key, e.target.checked)}
                                                        css={tw`rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500`}
                                                    />
                                                    <span css={tw`text-sm text-gray-300`}>
                                                        {value === true ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </label>
                                            ) : config.type === 'select' ? (
                                                <select
                                                    value={value || ''}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    css={tw`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                                >
                                                    {config.options?.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : config.type === 'number' ? (
                                                <input
                                                    type="number"
                                                    value={value || 0}
                                                    onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                                                    css={tw`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value || ''}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    css={tw`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </Card>
                ))}
            </div>

            <div css={tw`flex justify-end`}>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </ContentBlock>
    );
};
