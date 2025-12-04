import React, { useState } from 'react';
import tw from 'twin.macro';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/solid';
import PageContentBlock from '@/components/elements/PageContentBlock';

interface Section {
    title: string;
    content: React.ReactNode;
}

const MinecraftCheatSheet = () => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        java: true,
    });

    const toggleSection = (key: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const sections: Record<string, Section> = {
        java: {
            title: 'Java Versions for Minecraft',
            content: (
                <div css={tw`space-y-4`}>
                    <p css={tw`text-neutral-300`}>
                        Different Minecraft versions require specific Java versions to run properly. Using the wrong Java version can cause crashes or performance issues.
                    </p>
                    <div css={tw`bg-neutral-900 rounded-lg overflow-hidden`}>
                        <table css={tw`w-full`}>
                            <thead css={tw`bg-neutral-800`}>
                                <tr>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Minecraft Version</th>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Required Java</th>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Docker Image</th>
                                </tr>
                            </thead>
                            <tbody css={tw`divide-y divide-neutral-800`}>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 text-neutral-300`}>1.20.5+</td>
                                    <td css={tw`px-4 py-3 font-semibold text-green-400`}>Java 21</td>
                                    <td css={tw`px-4 py-3 font-mono text-xs text-neutral-400`}>ghcr.io/pterodactyl/yolks:java_21</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 text-neutral-300`}>1.18 - 1.20.4</td>
                                    <td css={tw`px-4 py-3 font-semibold text-blue-400`}>Java 17</td>
                                    <td css={tw`px-4 py-3 font-mono text-xs text-neutral-400`}>ghcr.io/pterodactyl/yolks:java_17</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 text-neutral-300`}>1.17 - 1.17.1</td>
                                    <td css={tw`px-4 py-3 font-semibold text-purple-400`}>Java 16</td>
                                    <td css={tw`px-4 py-3 font-mono text-xs text-neutral-400`}>ghcr.io/pterodactyl/yolks:java_16</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 text-neutral-300`}>1.12 - 1.16</td>
                                    <td css={tw`px-4 py-3 font-semibold text-yellow-400`}>Java 11</td>
                                    <td css={tw`px-4 py-3 font-mono text-xs text-neutral-400`}>ghcr.io/pterodactyl/yolks:java_11</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 text-neutral-300`}>1.11 and below</td>
                                    <td css={tw`px-4 py-3 font-semibold text-red-400`}>Java 8</td>
                                    <td css={tw`px-4 py-3 font-mono text-xs text-neutral-400`}>ghcr.io/pterodactyl/yolks:java_8</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div css={tw`bg-blue-900/20 border border-blue-700 rounded-lg p-4`}>
                        <p css={tw`text-sm text-blue-300`}>
                            <strong>💡 Tip:</strong> You can change the Java version in the <strong>Startup</strong> tab by selecting the appropriate Docker Image from the dropdown menu.
                        </p>
                    </div>
                </div>
            ),
        },
        serverTypes: {
            title: 'Server Types (Vanilla, Paper, Forge, Fabric)',
            content: (
                <div css={tw`space-y-4`}>
                    <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                        <div css={tw`bg-neutral-800 border border-neutral-700 rounded-lg p-4`}>
                            <h3 css={tw`text-lg font-semibold text-neutral-100 mb-2`}>Vanilla</h3>
                            <p css={tw`text-sm text-neutral-300 mb-2`}>Official Minecraft server from Mojang.</p>
                            <ul css={tw`text-sm text-neutral-400 space-y-1 list-disc list-inside`}>
                                <li>No mods or plugins</li>
                                <li>Pure Minecraft experience</li>
                                <li>Best for survival or creative</li>
                            </ul>
                        </div>
                        <div css={tw`bg-neutral-800 border border-neutral-700 rounded-lg p-4`}>
                            <h3 css={tw`text-lg font-semibold text-neutral-100 mb-2`}>Paper/Spigot</h3>
                            <p css={tw`text-sm text-neutral-300 mb-2`}>Optimized server with plugin support.</p>
                            <ul css={tw`text-sm text-neutral-400 space-y-1 list-disc list-inside`}>
                                <li>Supports Bukkit/Spigot plugins</li>
                                <li>Better performance than Vanilla</li>
                                <li>Great for minigames & custom servers</li>
                            </ul>
                        </div>
                        <div css={tw`bg-neutral-800 border border-neutral-700 rounded-lg p-4`}>
                            <h3 css={tw`text-lg font-semibold text-neutral-100 mb-2`}>Forge</h3>
                            <p css={tw`text-sm text-neutral-300 mb-2`}>Mod loader for heavily modded servers.</p>
                            <ul css={tw`text-sm text-neutral-400 space-y-1 list-disc list-inside`}>
                                <li>Supports Forge mods</li>
                                <li>Required for modpacks (CurseForge)</li>
                                <li>Clients need matching mods</li>
                            </ul>
                        </div>
                        <div css={tw`bg-neutral-800 border border-neutral-700 rounded-lg p-4`}>
                            <h3 css={tw`text-lg font-semibold text-neutral-100 mb-2`}>Fabric</h3>
                            <p css={tw`text-sm text-neutral-300 mb-2`}>Lightweight modern mod loader.</p>
                            <ul css={tw`text-sm text-neutral-400 space-y-1 list-disc list-inside`}>
                                <li>Supports Fabric mods</li>
                                <li>Faster updates than Forge</li>
                                <li>Better performance, fewer mods</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },
        commonIssues: {
            title: 'Common Issues & Solutions',
            content: (
                <div css={tw`space-y-3`}>
                    <div css={tw`bg-neutral-800 border-l-4 border-red-500 rounded p-4`}>
                        <h4 css={tw`font-semibold text-red-400 mb-2`}>Server won't start / Crashes immediately</h4>
                        <ul css={tw`text-sm text-neutral-300 space-y-1 list-disc list-inside ml-2`}>
                            <li>Check if you're using the correct Java version for your Minecraft version</li>
                            <li>Make sure you accepted the EULA (set <code css={tw`bg-black/30 px-1 rounded`}>eula=true</code> in eula.txt)</li>
                            <li>Verify you have enough RAM allocated (minimum 2GB recommended)</li>
                        </ul>
                    </div>
                    <div css={tw`bg-neutral-800 border-l-4 border-yellow-500 rounded p-4`}>
                        <h4 css={tw`font-semibold text-yellow-400 mb-2`}>Players can't join</h4>
                        <ul css={tw`text-sm text-neutral-300 space-y-1 list-disc list-inside ml-2`}>
                            <li>Check the Network tab to ensure your port allocation is correct</li>
                            <li>Verify <code css={tw`bg-black/30 px-1 rounded`}>online-mode</code> in server.properties</li>
                            <li>Make sure the server is actually running (check console)</li>
                        </ul>
                    </div>
                    <div css={tw`bg-neutral-800 border-l-4 border-purple-500 rounded p-4`}>
                        <h4 css={tw`font-semibold text-purple-400 mb-2`}>Modpack not working after installation</h4>
                        <ul css={tw`text-sm text-neutral-300 space-y-1 list-disc list-inside ml-2`}>
                            <li>Set the correct Java version in the Startup tab (check modpack requirements)</li>
                            <li>Wait for the modpack to fully install before restarting</li>
                            <li>Check console for mod loading errors</li>
                        </ul>
                    </div>
                    <div css={tw`bg-neutral-800 border-l-4 border-blue-500 rounded p-4`}>
                        <h4 css={tw`font-semibold text-blue-400 mb-2`}>Out of memory errors</h4>
                        <ul css={tw`text-sm text-neutral-300 space-y-1 list-disc list-inside ml-2`}>
                            <li>Increase RAM allocation in the startup settings</li>
                            <li>For modpacks, 4-8GB is recommended minimum</li>
                            <li>Check for memory leaks from specific mods</li>
                        </ul>
                    </div>
                </div>
            ),
        },
        serverProperties: {
            title: 'Important server.properties Settings',
            content: (
                <div css={tw`space-y-4`}>
                    <div css={tw`bg-neutral-900 rounded-lg overflow-hidden`}>
                        <table css={tw`w-full`}>
                            <thead css={tw`bg-neutral-800`}>
                                <tr>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Setting</th>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Description</th>
                                    <th css={tw`px-4 py-3 text-left text-sm font-semibold text-neutral-100`}>Common Values</th>
                                </tr>
                            </thead>
                            <tbody css={tw`divide-y divide-neutral-800`}>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>max-players</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>Maximum number of players</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>20, 50, 100</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>difficulty</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>Game difficulty</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>peaceful, easy, normal, hard</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>gamemode</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>Default game mode</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>survival, creative, adventure</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>pvp</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>Enable player vs player combat</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>true, false</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>view-distance</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>How far players can see (chunks)</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>8, 10, 12 (lower = better performance)</td>
                                </tr>
                                <tr css={tw`hover:bg-neutral-800/50`}>
                                    <td css={tw`px-4 py-3 font-mono text-sm text-neutral-100`}>online-mode</td>
                                    <td css={tw`px-4 py-3 text-neutral-300 text-sm`}>Verify players own Minecraft</td>
                                    <td css={tw`px-4 py-3 text-neutral-400 text-sm`}>true (recommended), false</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
        },
        usefulCommands: {
            title: 'Useful Server Commands',
            content: (
                <div css={tw`space-y-3`}>
                    <div css={tw`bg-neutral-800 rounded-lg p-4`}>
                        <h4 css={tw`font-semibold text-neutral-100 mb-2 flex items-center`}>
                            <span css={tw`bg-green-600 text-white text-xs px-2 py-1 rounded mr-2`}>OP</span>
                            Player Management
                        </h4>
                        <div css={tw`space-y-2 text-sm`}>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-green-400 mr-3 whitespace-nowrap`}>/op &lt;player&gt;</code>
                                <span css={tw`text-neutral-300`}>Give player operator permissions</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-green-400 mr-3 whitespace-nowrap`}>/deop &lt;player&gt;</code>
                                <span css={tw`text-neutral-300`}>Remove operator permissions</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-green-400 mr-3 whitespace-nowrap`}>/whitelist add &lt;player&gt;</code>
                                <span css={tw`text-neutral-300`}>Add player to whitelist</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-green-400 mr-3 whitespace-nowrap`}>/kick &lt;player&gt;</code>
                                <span css={tw`text-neutral-300`}>Kick a player from the server</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-green-400 mr-3 whitespace-nowrap`}>/ban &lt;player&gt;</code>
                                <span css={tw`text-neutral-300`}>Ban a player permanently</span>
                            </div>
                        </div>
                    </div>
                    <div css={tw`bg-neutral-800 rounded-lg p-4`}>
                        <h4 css={tw`font-semibold text-neutral-100 mb-2 flex items-center`}>
                            <span css={tw`bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2`}>WORLD</span>
                            World Management
                        </h4>
                        <div css={tw`space-y-2 text-sm`}>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-blue-400 mr-3 whitespace-nowrap`}>/time set day</code>
                                <span css={tw`text-neutral-300`}>Set time to day (0, noon, midnight also work)</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-blue-400 mr-3 whitespace-nowrap`}>/weather clear</code>
                                <span css={tw`text-neutral-300`}>Clear the weather (rain, thunder also work)</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-blue-400 mr-3 whitespace-nowrap`}>/gamerule keepInventory true</code>
                                <span css={tw`text-neutral-300`}>Keep inventory on death</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-blue-400 mr-3 whitespace-nowrap`}>/difficulty peaceful</code>
                                <span css={tw`text-neutral-300`}>Change difficulty (peaceful, easy, normal, hard)</span>
                            </div>
                        </div>
                    </div>
                    <div css={tw`bg-neutral-800 rounded-lg p-4`}>
                        <h4 css={tw`font-semibold text-neutral-100 mb-2 flex items-center`}>
                            <span css={tw`bg-purple-600 text-white text-xs px-2 py-1 rounded mr-2`}>SERVER</span>
                            Server Control
                        </h4>
                        <div css={tw`space-y-2 text-sm`}>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-purple-400 mr-3 whitespace-nowrap`}>/save-all</code>
                                <span css={tw`text-neutral-300`}>Force save the world</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-purple-400 mr-3 whitespace-nowrap`}>/list</code>
                                <span css={tw`text-neutral-300`}>Show online players</span>
                            </div>
                            <div css={tw`flex items-start`}>
                                <code css={tw`bg-black/40 px-2 py-1 rounded font-mono text-purple-400 mr-3 whitespace-nowrap`}>/say &lt;message&gt;</code>
                                <span css={tw`text-neutral-300`}>Broadcast a message to all players</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    };

    return (
        <PageContentBlock title={'Minecraft Server Cheat Sheet'}>
            <div css={tw`space-y-4`}>
                <p css={tw`text-neutral-400`}>
                    Quick reference guide for managing your Minecraft server. Click on any section to expand or collapse it.
                </p>

                {Object.entries(sections).map(([key, section]) => (
                    <div key={key} css={tw`bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden`}>
                        <button
                            onClick={() => toggleSection(key)}
                            css={tw`w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-700/50 transition-colors`}
                        >
                            <h2 css={tw`text-xl font-semibold text-neutral-100`}>{section.title}</h2>
                            {expandedSections[key] ? (
                                <ChevronDownIcon css={tw`w-6 h-6 text-neutral-400`} />
                            ) : (
                                <ChevronRightIcon css={tw`w-6 h-6 text-neutral-400`} />
                            )}
                        </button>
                        {expandedSections[key] && (
                            <div css={tw`px-6 py-4 border-t border-neutral-700`}>
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </PageContentBlock>
    );
};

export default MinecraftCheatSheet;
