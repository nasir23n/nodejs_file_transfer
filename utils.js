const os = require('os');

const getLANIP = () => {
    const interfaces = os.networkInterfaces();
    let lanIP = null;
  
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                lanIP = iface.address;
                break;
            }
        }
        if (lanIP) break;
    }
  
    return lanIP;
}

module.exports = {
    getLANIP
}