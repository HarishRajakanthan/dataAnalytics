const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const remoteHost = 'remote.server.com'; // Replace with your remote server's address
const username = 'yourUsername'; // Replace with your username
const privateKeyPath = '/path/to/your/private/key'; // Replace with the path to your private key
const remoteScriptPath = '/path/to/remote/script.sh'; // Replace with the path to your shell script on the remote server

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(`bash ${remoteScriptPath}`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).connect({
    host: remoteHost,
    port: 22, // Default SSH port
    username: username,
    privateKey: fs.readFileSync(privateKeyPath)
});
