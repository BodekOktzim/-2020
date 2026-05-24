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