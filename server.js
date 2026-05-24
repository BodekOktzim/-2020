const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'facebook.db');

const DRIVE_URL =
'https://dl.dropboxusercontent.com/scl/fi/2lexnf75czsrap1zxm3za/facebook.db-2020?rlkey=72a5jth0f255sgix7376fa20w';

app.use(express.static('public'));

async function downloadDatabase() {

    try {

        if (fs.existsSync(DB_FILE)) {

            fs.unlinkSync(DB_FILE);

            console.log('Old DB deleted');
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

                const stats = fs.statSync(DB_FILE);

                console.log('DB SIZE:', stats.size);

                resolve();
            });

            writer.on('error', reject);
        });

    } catch (err) {

        console.log('DOWNLOAD ERROR:', err);
    }
}

app.get('/search', async (req, res) => {

    try {

        const value = req.query.value;

        if (!value) {

            return res.json({
                success: false,
                error: 'Missing value'
            });
        }

        if (!fs.existsSync(DB_FILE)) {

            return res.json({
                success: false,
                error: 'Database file does not exist'
            });
        }

        const stats = fs.statSync(DB_FILE);

        console.log('DB SIZE:', stats.size);

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

                    console.log('SQL ERROR:', err);

                    return res.json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    count: rows.length,
                    results: rows
                });

                db.close();
            }
        );

    } catch (e) {

        console.log('SERVER ERROR:', e);

        res.json({
            success: false,
            error: e.message
        });
    }
});

async function startServer() {

    await downloadDatabase();

    app.listen(PORT, () => {

        console.log(`Server running on port ${PORT}`);
    });
}

startServer();