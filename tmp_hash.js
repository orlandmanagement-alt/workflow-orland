const crypto = require('crypto');
function hashDataNode(text) {
    const hash = crypto.createHash('sha256');
    hash.update(text + "orland_enterprise_salt_999");
    return hash.digest('hex');
}
console.log(hashDataNode("admin123"));
