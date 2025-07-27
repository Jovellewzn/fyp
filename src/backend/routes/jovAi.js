
const Openai = require('openai');
const express = require('express');
const router = express.Router();
const db = require('../db/db_connect');
const openai = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
});

const prompt = `
You are a helpful AI assistant for analyzing tournament data. Your task is predict the winner of a tournament based on the teams and their match results.
You will be provided with a list of teams and their match results. Use this information to make your prediction.

Teams: {teams}
Match Results: {matchResults}

Provide a very brief (1-2 sentences) analysis of the teams' performance and predict the winner of the tournament, then rank the top 3 teams.
Please respond with your analysis and prediction in a JSON format:
{
    "analysis": "Your analysis here",
    "prediction": [ "Team A", "Team B", "Team C" ]
}

`

router.get('/:tid', async (req, res) => {

    const tid = req.params.tid;
    const allTeamsSql = `
        SELECT DISTINCT t.team_name
        FROM   tournament_participants t
        WHERE  t.tournament_id = ?`;
    const matchResultsSql = `
        SELECT m.*
        FROM   match_results m
        WHERE  m.tournament_id = ?`;

    db.all(allTeamsSql, [tid], async (err, rows) => {
        if (err) {
            console.error('Error fetching teams:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No teams found for this tournament' });
        }

        const teams = rows.map(row => row.team_name);
        
        db.all(matchResultsSql, [tid], async (err2, matchRows) => {
            if (err2) {
                console.error('Error fetching match results:', err2.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (matchRows.length === 0) {
                return res.status(404).json({ error: 'No match results found for this tournament' });
            }

            console.log('Teams:', teams);
            console.log('Match Results:', matchRows);

            const formattedPrompt = prompt
                .replace('{teams}', JSON.stringify(teams))
                .replace('{matchResults}', JSON.stringify(matchRows));

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4.1",
                    messages: [{ role: "user", content: formattedPrompt }]
                });
                
                // Parse the AI response
                const aiResponse = JSON.parse(response.choices[0].message.content);
                res.json({
                    analysis: aiResponse.analysis,
                    prediction: aiResponse.prediction
                });
            } catch (error) {
                console.error('Error fetching AI response:', error.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        });

    });

    // const prompt = "Write a one-sentence bedtime story about a unicorn.";
    // const response = await openai.chat.completions.create({
    //     model: "gpt-4.1",
    //     messages: [{ role: "user", content: prompt }]
    // });

    // console.log(response.choices[0].message.content);

    // Get all teams in the tournament



    // res.send('Hello from the JovAI API!');
});

module.exports = router;