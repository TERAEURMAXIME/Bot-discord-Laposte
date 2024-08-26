const { Client, GatewayIntentBits, Routes, ActivityType, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages // Ajout pour les messages privés
    ],
    partials: ['CHANNEL'] // Partials pour les messages privés
});

const LA_POSTE_API_KEY = process.env.LA_POSTE_API_KEY;

const commands = [
    new SlashCommandBuilder()
        .setName('suivi')
        .setDescription('Suivre un colis')
        .addStringOption(option => 
            option.setName('tracking_number')
                .setDescription('Le numéro de suivi du colis')
                .setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log('Bot connecté en tant que ' + client.user.tag);

    // Définir le statut du bot
    client.user.setPresence({
        activities: [{ name: 'La Poste', type: ActivityType.Watching }],
        status: 'dnd' // Définit le statut sur "Ne pas déranger"
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Enregistrement des commandes slash.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Commandes slash enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes slash :', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'suivi') {
        const trackingNumber = options.getString('tracking_number');

        try {
            const response = await axios.get(`https://api.laposte.fr/suivi/v2/idships/${trackingNumber}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Okapi-Key': LA_POSTE_API_KEY
                }
            });

            const shipment = response.data.shipment;
            let suiviMessage = `Statut actuel du colis ${trackingNumber} : ${shipment.timeline[0].status}\nDernière mise à jour : ${shipment.timeline[0].date}\n`;

            await interaction.reply(suiviMessage);

            // Envoyer les détails complets en DM
            const fullDetails = `Détails complets pour le suivi ${trackingNumber} :\n${JSON.stringify(shipment, null, 2)}`;
            await interaction.user.send(fullDetails);
        } catch (error) {
            console.error('Erreur lors de la récupération des informations de suivi :', error);

            let errorMessage = 'Je ne peux pas récupérer les informations de suivi pour le moment.';
            if (error.response && error.response.status === 404) {
                errorMessage = 'Numéro de suivi invalide.';
            }

            if (!interaction.replied) {
                await interaction.reply(errorMessage);
            } else {
                await interaction.followUp(errorMessage);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
