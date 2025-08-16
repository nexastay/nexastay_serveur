const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Début du processus de seeding...');

    // --- Nettoyage des données existantes (avec les bons noms de modèles en minuscule) ---
    console.log('Nettoyage de la base de données...');
    await prisma.review.deleteMany().catch(() => {});
    await prisma.extra.deleteMany().catch(() => {});
    await prisma.booking.deleteMany().catch(() => {});
    await prisma.property.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.preRegistration.deleteMany().catch(() => {});
    
    // --- Création d'un utilisateur Hôte ---
    console.log('Création de l\'utilisateur propriétaire de test...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const hostUser = await prisma.user.create({
        data: {
            email: 'proprietaire@nexastay.com',
            password: hashedPassword,
            firstName: 'Marie',
            lastName: 'Blanchard',
            role: 'HOST',
        },
    });

    // --- Création des propriétés avec détails ---
    console.log('Création des propriétés de test...');
    const villa = await prisma.property.create({
        data: {
            title: 'Villa Méditerranéenne avec Vue Mer',
            location: 'Nice, France',
            price: 350.00,
            image: '🏖️',
            ownerId: hostUser.id,
            description: "Une magnifique villa avec une vue imprenable sur la mer Méditerranée.",
            photos: ["https://placehold.co/600x400/3182CE/FFFFFF?text=Photo+1"],
        },
    });

    // --- Ajout d'extras pour la Villa ---
    console.log('Ajout des extras...');
    await prisma.extra.createMany({
        data: [
            { name: 'Panier Petit-Déjeuner Local', description: 'Produits frais de la région.', price: 25.00, propertyId: villa.id },
        ]
    });

    console.log('Seeding terminé avec succès ! ✅');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
