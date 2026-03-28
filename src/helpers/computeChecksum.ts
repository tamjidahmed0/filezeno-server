import * as fs from 'fs';
import * as crypto from 'crypto';

function computeChecksum(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
}

export default computeChecksum