const mongoose = require('mongoose');
require('dotenv').config();

function mongooseConnection() {
    mongoose.set('strictQuery', true);

    mongoose.connect(process.env.MONGOOSE_CONNECTION, {
        tls: true, // ✅ Ensures a secure connection
        tlsAllowInvalidCertificates: true // ✅ Only use if you face certificate issues
    })
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch(err => console.error("❌ Database Connection Error:", err));
}

module.exports = { mongooseConnection };
