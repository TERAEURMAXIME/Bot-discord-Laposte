const { Client, REST, Routes, GatewayIntentBits, ActivityType } = require('discord.js');
const axios = require('axios');

const token = 'jeton du bot';
const laPosteApiKey = 'clé api la poste';
const clientId = 'clé clientid';  // Remplacez par l'ID du client
const guildId = 'clé guildid'; // Remplacez par l'ID du serveur où vous voulez enregistrer les commandes

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent // Assurez-vous que ce intent est bien activé dans le portail développeur
    ]
});

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

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Début de l\'enregistrement des commandes slash.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), // Enregistrer les commandes pour un serveur spécifique
            { body: commands },
        );

        console.log('Commandes slash enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes slash :', error);
    }
})();

client.once('ready', () => {
    console.log('Bot connecté en tant que ' + client.user.tag);

    // Définir un statut personnalisé
    client.user.setPresence({
        activities: [{ name: 'laposte.fr', type: ActivityType.Playing }],
        status: 'online'
    });

    console.log('Statut personnalisé défini avec succès.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'suivi') {
        const trackingNumber = options.getString('tracking_number');
        const status = await getTrackingStatus(trackingNumber);
        await interaction.reply(status);
    }
});

async function getTrackingStatus(trackingNumber) {
    const url = `https://api.laposte.fr/suivi/v2/idships/${trackingNumber}?lang=fr_FR`;
    const headers = {
        'Accept': 'application/json',
        'X-Okapi-Key': laPosteApiKey
    };

    try {
        const response = await axios.get(url, { headers });
        if (response.status === 200) {
            const data = response.data;
            if (data.returnCode === 200) {
                const events = data.shipment.event.map(event => `Date: ${event.date}\nStatut: ${event.label}`).join('\n\n');
                return `Historique des statuts de suivi pour le colis ${trackingNumber}:\n\n${events}`;
            } else {
                return `Erreur de l'API: ${data.returnMessage}`;
            }
        } else {
            return 'Numéro de suivi invalide ou erreur de l\'API.';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut de suivi :', error);
        return 'Une erreur s\'est produite lors de la récupération du statut de suivi.';
    }
}

client.login(token);
