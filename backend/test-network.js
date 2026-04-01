const express = require('express');
const app = express();
const PORT = 3000;

// 获取所有IP地址
function getAllIps() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push({
                    interface: name,
                    address: net.address
                });
            }
        }
    }
    return ips;
}

app.get('/', (req, res) => {
    res.send(`
        <h1>Server is running!</h1>
        <p>Your IP addresses:</p>
        <ul>
            ${getAllIps().map(ip => `<li>${ip.interface}: ${ip.address}</li>`).join('')}
        </ul>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server running on:`);
    console.log(`   Local: http://localhost:${PORT}`);
    getAllIps().forEach(ip => {
        console.log(`   Network: http://${ip.address}:${PORT}`);
    });
    console.log(`\n📱 Test from other devices using one of the Network addresses above\n`);
});