const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');
    await prisma.product.deleteMany(); // Vide la table avant de la remplir

    await prisma.product.create({
        data: {
            name: 'Pack Linge Premium',
            description: 'Draps, serviettes et housses de qualité hôtelière.',
            price: 89.00,
            imageUrl: '🛏️',
            category: 'Linge'
        }
    });
    await prisma.product.create({
        data: {
            name: 'Kit Entretien Complet',
            description: 'Tous les produits d\'entretien pour vos propriétés.',
            price: 45.00,
            imageUrl: '🧼',
            category: 'Entretien'
        }
    });
    await prisma.product.create({
        data: {
            name: 'Pack Accueil Voyageurs',
            description: 'Café, thé, biscuits et produits de bienvenue.',
            price: 32.00,
            imageUrl: '☕',
            category: 'Accueil'
        }
    });
    console.log('Seeding finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });