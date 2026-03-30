import { Injectable } from '@nestjs/common';
import path from 'path';
import crypto from 'crypto';

@Injectable()
export class StorageService {

    generateSignedUrl(storagePath: string, expiresInSeconds = 900) {
        const filename = path.basename(storagePath);
        const expiry = Date.now() + expiresInSeconds * 1000;
        const data = `${filename}:${expiry}`;

        const signature = crypto
            .createHmac('sha256', process.env.STORAGE_SECRET || 'storage-secret')
            .update(data)
            .digest('hex');

        return {
            url: `/api/v1/files/serve/${filename}?sig=${signature}&exp=${expiry}`,
            expiresAt: new Date(expiry),
        };


    }



    verifySignedUrl(filename: string, sig: string, exp: string) {
        if (Date.now() > parseInt(exp)) throw new Error('URL expired');

        const data = `${filename}:${exp}`;
        const expected = crypto
            .createHmac('sha256', process.env.STORAGE_SECRET || 'storage-secret')
            .update(data)
            .digest('hex');

        if (sig !== expected) throw new Error('Invalid signature');
        return true;
    }



}
