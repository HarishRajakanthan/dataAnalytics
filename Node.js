const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');

const sshClient = new Client();
const sftpClient = new SftpClient();

const remoteHost = 'remote.server.com'; // Replace with your remote server's address
const username = 'yourUsername'; // Replace with your username
const privateKeyPath = '/path/to/your/private/key'; // Replace with the path to your private key
const localFilePath = '/path/to/local/file.txt'; // Replace with the path to your local file
const remoteFilePath = '/path/to/remote/file.txt'; // Replace with the desired path on the remote server
const remoteScriptPath = '/path/to/remote/script.sh'; // Replace with the path to your shell script on the remote server

const privateKey = fs.readFileSync(privateKeyPath);

async function transferFileAndExecuteScript() {
  try {
    // Connect to the SFTP server
    await sftpClient.connect({
      host: remoteHost,
      port: 22,
      username: username,
      privateKey: privateKey
    });

    // Upload the file
    await sftpClient.put(localFilePath, remoteFilePath);
    console.log('File transferred successfully');

    // Disconnect SFTP client
    await sftpClient.end();

    // Connect SSH client
    sshClient.on('ready', () => {
      console.log('SSH Client :: ready');
      sshClient.exec(`bash ${remoteScriptPath}`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          sshClient.end();
        }).on('data', (data) => {
          console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
          console.error('STDERR: ' + data);
        });
      });
    }).connect({
      host: remoteHost,
      port: 22,
      username: username,
      privateKey: privateKey
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

transferFileAndExecuteScript();
