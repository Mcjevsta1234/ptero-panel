import http from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';

export default async (uuid: string): Promise<string> => {
    // Try to get latest.log, fallback to logs/latest.log
    let content: string;
    try {
        content = await getFileContents(uuid, '/latest.log');
    } catch (e) {
        try {
            content = await getFileContents(uuid, '/logs/latest.log');
        } catch (e2) {
            throw new Error('Could not find latest.log file. Make sure your server has generated logs.');
        }
    }

    // Upload to mclo.gs
    const response = await fetch('https://api.mclo.gs/1/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `content=${encodeURIComponent(content)}`,
    });

    if (!response.ok) {
        throw new Error('Failed to upload log to mclo.gs');
    }

    const data = await response.json();
    
    if (!data.success || !data.url) {
        throw new Error('mclo.gs did not return a valid URL');
    }

    return data.url;
};
