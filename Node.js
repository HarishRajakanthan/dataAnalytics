const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const remoteHost = 'remote.server.com'; // Replace with your remote server's address
const username = 'yourUsername'; // Replace with your username
const privateKeyPath = '/path/to/your/private/key'; // Replace with the path to your private key
const localFilePath = '/path/to/local/file.txt'; // Replace with the path to your local file
const remoteFilePath = '/path/to/remote/file.txt'; // Replace with the desired path on the remote server
const remoteScriptPath = '/path/to/remote/script.sh'; // Replace with the path to your shell script on the remote server

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        // Upload the file
        sftp.fastPut(localFilePath, remoteFilePath, (err) => {
            if (err) throw err;
            console.log('File transferred successfully');

            // Execute the remote script
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
        });
    });
}).connect({
    host: remoteHost,
    port: 22, // Default SSH port
    username: username,
    privateKey: fs.readFileSync(privateKeyPath)
});
