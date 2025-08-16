// =================================================================
// SERVEUR NEXASTAY - simple_serveur.js
// =================================================================

// --- 1. IMPORTS ---
// On importe les librairies nécessaires
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors'); // Essentiel pour que ta page hébergée puisse parler à ce serveur

// --- 2. INITIALISATION ---
const app = express();
const prisma = new PrismaClient();
const PORT = 3000; // Le port sur lequel le serveur va écouter

// --- 3. MIDDLEWARE (les "outils" de notre serveur) ---
// Active CORS pour autoriser les requêtes venant de l'extérieur (ton hébergeur)
app.use(cors());
// Permet à notre serveur de comprendre et de lire le format JSON
app.use(express.json());


// --- 4. ROUTES DE L'API ---

// Une route simple pour vérifier que le serveur est bien en ligne
app.get('/', (req, res) => {
  res.send('🚀 Le serveur NexaStay est en ligne et prêt à travailler !');
});


// --- ROUTES POUR LA PRÉ-INSCRIPTION ---

/**
 * Route pour ENREGISTRER une nouvelle pré-inscription.
 * Méthode: POST
 * URL: /api/pre-register
 */
app.post('/api/pre-register', async (req, res) => {
  // On récupère les données envoyées par le formulaire dans le "corps" de la requête
  const { name, email, city, region } = req.body;

  // On vérifie que toutes les données nécessaires sont bien là
  if (!name || !email || !city || !region) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // On utilise Prisma pour créer une nouvelle entrée dans la table "PreRegistration"
    const newEntry = await prisma.preRegistration.create({
      data: {
        name: name,
        email: email,
        city: city,
        region: region,
      },
    });
    // Si tout s'est bien passé, on renvoie un message de succès
    res.status(201).json({ message: "Pré-inscription enregistrée avec succès !", data: newEntry });
  } catch (error) {
    // Si l'email existe déjà, Prisma renverra une erreur avec ce code
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Cette adresse email est déjà inscrite." });
    }
    // Pour toute autre erreur, on l'affiche dans la console et on renvoie une erreur générique
    console.error("Erreur lors de la création :", error);
    res.status(500).json({ error: "Une erreur est survenue sur le serveur." });
  }
});


/**
 * Route pour OBTENIR les statistiques des pré-inscriptions.
 * Méthode: GET
 * URL: /api/stats/pre-registrations
 */
app.get('/api/stats/pre-registrations', async (req, res) => {
    try {
        // On récupère toutes les inscriptions de la base de données
        const allEntries = await prisma.preRegistration.findMany();

        // On calcule les statistiques
        const regionCounts = {};
        const cityCounts = {};
        allEntries.forEach(item => {
            regionCounts[item.region] = (regionCounts[item.region] || 0) + 1;
            cityCounts[item.city] = (cityCounts[item.city] || 0) + 1;
        });

        // On trie pour ne garder que le Top 5
        const topRegions = Object.entries(regionCounts).sort(([,a],[,b]) => b-a).slice(0, 5);
        const topCities = Object.entries(cityCounts).sort(([,a],[,b]) => b-a).slice(0, 5);

        // On renvoie un objet JSON avec toutes les statistiques
        res.status(200).json({
            total: allEntries.length,
            topRegions: Object.fromEntries(topRegions),
            topCities: Object.fromEntries(topCities)
        });

    } catch (error) {
        console.error("Erreur de statistique :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des statistiques." });
    }
});


// --- AJOUTE TES FUTURES ROUTES ICI (connexion, annonces, etc.) ---


// --- 5. DÉMARRAGE DU SERVEUR ---
// Le serveur se met en écoute sur le port défini
app.listen(PORT, () => {
  console.log(`🚀 Serveur NexaStay démarré sur http://localhost:${PORT}`);
});