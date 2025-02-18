import { openDb } from '../utils/db.js';
import { logError } from '../utils/logger.js';

const sampleArticles = [
    {
        title: "Premier article",
        content: "Contenu du premier article"
    },
    {
        title: "Deuxième article",
        content: "Contenu du deuxième article"
    },
    {
        title: "Troisième article",
        content: "Contenu du troisième article"
    }
];

async function seedDatabase() {
    try {
        const db = await openDb();

// Supprime les données existantes
        await db.run('DELETE FROM articles');

// Insère les données de test
        for (const article of sampleArticles) {
            await db.run(
                'INSERT INTO articles (title, content) VALUES (?, ?)',
                [article.title, article.content]
            );
        }

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        await logError(error);
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
}

seedDatabase();
