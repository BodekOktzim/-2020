const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'facebook.db');

const DRIVE_URL =
'const DRIVE_URL =
'https://dl.dropboxusercontent.com/scl/fi/2lexnf75czsrap1zxm3za/facebook.db-2020?rlkey=72a5jth0f255sgix7376fa20w';

app.use(express.static('public'));

async function downloadDatabase() {

    if (fs.existsSync(DB_FILE)) {

        console.log('Database already exists');

        return;
    }

    console.log('Downloading database...');

    const response = await axios({
        method: 'GET',
        url: DRIVE_URL,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(DB_FILE);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {

        writer.on('finish', () => {

            console.log('Database downloaded');

            resolve();
        });

        writer.on('error', reject);
    });
}

app.get('/search', async (req, res) => {

    const value = req.query.value;

    if (!value) {

    return res.json({
        success: false,
        error: 'Missing value'
    });
}

    const db = new sqlite3.Database(DB_FILE);

    db.all(
        `
        SELECT *
        FROM users
        WHERE phone = ?
        OR uid = ?
        LIMIT 10
        `,
        [value, value],

        (err, rows) => {

            if (err) {

                console.log(err);

                return res.json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                results: rows
            });

            db.close();
        }
    );
});

async function startServer() {

    await downloadDatabase();

    app.listen(PORT, () => {

        console.log(`Server running on port ${PORT}`);
    });
}

startServer();