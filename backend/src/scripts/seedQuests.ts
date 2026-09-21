/**
 * Applies only the global quests.
 *
 * Run: npm run seed:quests --workspace=backend
 *
 * The operation is idempotent: quests are upserted by `id`, no other
 * collections (players, activities, cities, cosmetics) are touched.
 */

import mongoose from 'mongoose';
import { Quest } from '../models/Quest';
import { GLOBAL_QUESTS } from '../data/quests';

async function seedQuestsOnly(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoUri || !dbName) {
        throw new Error('MONGODB_URI and DB_NAME must be set in environment');
    }

    await mongoose.connect(mongoUri, { dbName });
    console.log(`Connected to MongoDB database: ${dbName}`);

    try {
        for (const quest of GLOBAL_QUESTS) {
            await Quest.findOneAndUpdate({ id: quest.id }, quest, { upsert: true, new: true });
            console.log(`✓ quest ${quest.id} (уровень ${quest.requirements.level})`);
        }
        console.log(`Готово: ${GLOBAL_QUESTS.length} квестов в базе.`);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

seedQuestsOnly().catch((error) => {
    console.error('Error seeding quests:', error);
    process.exit(1);
});
