// --- Importations des modules ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// --- Middlewares ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// --- Constantes ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERREUR: La variable d'environnement JWT_SECRET n'est pas définie.");
    process.exit(1);
}

// --- Middleware d'authentification ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ========================================
// ---         ROUTES DE L'API          ---
// ========================================

// --- Route racine pour confirmer que l'API est en ligne ---
app.get('/', (req, res) => {
    res.status(200).json({ message: "Bienvenue sur l'API NexaStay. Elle est en ligne et fonctionnelle." });
});

// --- Route pour la pré-inscription ---
app.post('/pre-register', async (req, res) => {
  const { name, email, city, region } = req.body;
  if (!name || !email || !city || !region) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }
  try {
    const newEntry = await prisma.preRegistration.create({
      data: { name, email, city, region },
    });
    res.status(201).json({ message: "Pré-inscription enregistrée !", data: newEntry });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Cette adresse email est déjà inscrite." });
    }
    res.status(500).json({ error: "Une erreur est survenue sur le serveur." });
  }
});

// --- Route pour récupérer les statistiques de pré-inscription ---
app.get('/stats/pre-registrations', async (req, res) => {
    try {
        const total = await prisma.preRegistration.count();
        const regionsData = await prisma.preRegistration.groupBy({
            by: ['region'],
            _count: { region: true },
            orderBy: { _count: { region: 'desc' } },
            take: 5,
        });
        const topRegions = regionsData.reduce((acc, item) => {
            acc[item.region] = item._count.region;
            return acc;
        }, {});
        const citiesData = await prisma.preRegistration.groupBy({
            by: ['city'],
            _count: { city: true },
            orderBy: { _count: { city: 'desc' } },
            take: 5,
        });
        const topCities = citiesData.reduce((acc, item) => {
            acc[item.city] = item._count.city;
            return acc;
        }, {});
        res.status(200).json({ total, topRegions, topCities });
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        res.status(500).json({ error: "Impossible de charger les statistiques." });
    }
});

// --- Authentification ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword, firstName, lastName, role: 'GUEST' }
        });
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '8h' });
        const { password: _, ...userData } = newUser;
        res.status(201).json({ user: userData, token });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            const { password: _, ...userData } = user;
            res.json({ user: userData, token });
        } else {
            res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }
    } catch (error) {
        res.status(500).json({ error: "Erreur de connexion." });
    }
});

// --- Annonces ---
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: "Impossible de récupérer les annonces." });
    }
});

app.get('/api/properties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const property = await prisma.property.findUnique({
            where: { id: id },
            include: { extras: true, reviews: { include: { author: true } } }
        });
        if (!property) return res.status(404).json({ error: "Propriété non trouvée." });
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: "Impossible de récupérer les détails." });
    }
});

// --- Réservations ---
app.post('/api/bookings', authenticateToken, async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(403).json({ error: "Utilisateur non authentifié." });
    }
    const { propertyId, checkInDate, checkOutDate, numberOfTravelers, hasPets } = req.body;
    const guestId = req.user.id;
    if (!propertyId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ error: "Informations de réservation manquantes." });
    }
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
        return res.status(400).json({ error: "Les dates fournies sont invalides." });
    }
    try {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) {
            return res.status(404).json({ error: "Propriété non trouvée." });
        }
        const pricePerNight = parseFloat(property.price);
        if (isNaN(pricePerNight)) {
            return res.status(500).json({ error: "Erreur de configuration du prix de la propriété." });
        }
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (nights <= 0) {
            return res.status(400).json({ error: "Le séjour doit durer au moins une nuit." });
        }
        const totalAmount = nights * pricePerNight;
        const newBooking = await prisma.booking.create({
            data: {
                propertyId,
                guestId,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                totalAmount,
                numberOfTravelers: parseInt(numberOfTravelers) || 1,
                hasPets: Boolean(hasPets) || false,
            }
        });
        res.status(201).json(newBooking);
    } catch (error) {
        console.error("ERREUR LORS DE LA CRÉATION DE LA RÉSERVATION:", error);
        res.status(500).json({ error: "Une erreur interne est survenue. Veuillez réessayer." });
    }
});

app.get('/api/bookings/my-bookings', authenticateToken, async (req, res) => {
    try {
        const myBookings = await prisma.booking.findMany({
            where: { guestId: req.user.id },
            include: { property: { select: { title: true, location: true } } },
            orderBy: { checkInDate: 'desc' }
        });
        res.json(myBookings);
    } catch (error) {
        res.status(500).json({ error: "Impossible de récupérer vos réservations." });
    }
});

// --- Démarrage du serveur ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur NexaStay démarré sur http://localhost:${PORT}`);
});