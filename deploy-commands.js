require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'suivi',
        description: 'Suivre un colis',
        options: [
            {
                name: 'tracking_number',
                type: 3, // Type 3 is string
                description: 'Le numéro de suivi du colis',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Début de l\'enregistrement des commandes slash.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Commandes slash enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes slash :', error);
    }
})();
