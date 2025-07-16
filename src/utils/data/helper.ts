import * as fs from 'fs';

const privateKeys: string[] = fs.readFileSync('wallets.txt', {encoding: 'utf-8'})
    .split('\n')
    .map(line => line.trim());

const recipients: string[] = fs.readFileSync('recipients.txt', {encoding: 'utf-8'})
    .split('\n')
    .map(line => line.trim());


export {privateKeys, recipients}