# Database Seed Scripts

This directory contains scripts for seeding the database with initial data.

## Seed Script

The `seed.ts` script populates the database with:

- **4 Cities**: Samarkand, Shymkent, Tashkent, and Bukhara with exact data from design.md
- **4 Characters**: Merchant Aziz, Craftsman Rustam, Student Farhod, and Chef Shavkat
- **10 Cosmetic Items**: 5 clothing items and 5 background items with Uzbek cultural aesthetics
- **Dev User**: A development user for testing (if DEV_USERNAME and DEV_PASSWORD are set)

### Running the Seed Script

```bash
# From the backend directory
npm run seed
```

### Prerequisites

1. MongoDB connection must be configured in `.env`:
   ```
   MONGODB_URI=mongodb+srv://...
   DB_NAME=uzbek_wars
   ```

2. (Optional) For dev user creation, set in `.env`:
   ```
   DEV_USERNAME=developer
   DEV_PASSWORD=dev123456
   ```

### Idempotency

The seed script is **idempotent**, meaning it can be run multiple times safely:

- Cities: Updates existing cities or creates new ones
- Cosmetic Items: Updates existing items or creates new ones
- Dev User: Skips creation if user already exists

### Dev User Details

When created, the dev user receives:

- **Level**: 10 (for easier testing)
- **Soms**: 10,000 (game currency)
- **Crystals**: 1,000 (donation currency)
- **Character**: Merchant Aziz (first character)
- **City**: Samarkand (first city)
- **Email**: `{DEV_USERNAME}@dev.local`

### Character Data

All 4 characters are available for selection:

1. **Merchant Aziz** (`char_merchant`) - Experienced trader from Chorsu Bazaar
2. **Craftsman Rustam** (`char_craftsman`) - Skilled artisan creating traditional items
3. **Student Farhod** (`char_student`) - Young student learning modern technologies
4. **Chef Shavkat** (`char_chef`) - Master of cooking plov and Uzbek dishes

### City Data

All cities have:

- Multilingual names (ru, uz, uk, en)
- Unique theme colors from design document
- Max capacity: 1,000 players each
- Background images and descriptions

### Cosmetic Items

**Clothing Items** (5):
- Blue Chapan (common, 100 crystals)
- Golden Chapan (epic, 500 crystals)
- Traditional Doppi (common, 50 crystals)
- Atlas Dress (rare, 300 crystals)
- Modern Suit (rare, 200 crystals)

**Background Items** (5):
- Registan Square (rare, 150 crystals)
- Chorsu Bazaar (common, 100 crystals)
- Bukhara Ark (rare, 200 crystals)
- Tashkent Metro (rare, 150 crystals)
- Tian Shan Mountains (epic, 250 crystals)

### Testing

Run the seed script tests:

```bash
npm test -- seed.test.ts
```

Tests validate:
- Character data structure and uniqueness
- City data completeness and correctness
- Theme colors match design document
- Multilingual support for all entities

### Troubleshooting

**Error: Missing required environment variables**
- Ensure `.env` file exists with MONGODB_URI and DB_NAME

**Error: Connection timeout**
- Check MongoDB Atlas connection string
- Verify network access in MongoDB Atlas settings

**Warning: DEV_USERNAME or DEV_PASSWORD not set**
- This is normal if you don't need a dev user
- Set these variables in `.env` if you want to create a dev user

### Professional Code Standards

The seed script follows enterprise patterns:

- **Idempotent operations**: Safe to run multiple times
- **Comprehensive logging**: Clear feedback on operations
- **Error handling**: Graceful failure with informative messages
- **Type safety**: Full TypeScript typing
- **Documentation**: Comments explain "why", not "what"
- **Separation of concerns**: Data definitions separate from logic
- **Testability**: Exported constants for testing
