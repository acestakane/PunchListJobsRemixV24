"""
Migration: Add transportation_type field to all existing crew user documents.

Run this script once to backfill the field:
    cd /app/backend && python migrations/add_transportation_type.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "punchlistjobs")


async def run():
    if not MONGO_URL:
        print("ERROR: MONGO_URL environment variable not set.")
        sys.exit(1)

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Add transportation_type: None to every crew user that doesn't already have it
    result = await db.users.update_many(
        {"role": "crew", "transportation_type": {"$exists": False}},
        {"$set": {"transportation_type": None}},
    )
    print(f"Backfilled transportation_type on {result.modified_count} crew document(s).")

    # Also ensure the settings collection has the feature flag defaulted to False
    settings_result = await db.settings.update_one(
        {"enable_crew_transportation_type": {"$exists": False}},
        {"$set": {"enable_crew_transportation_type": False}},
        upsert=False,
    )
    if settings_result.modified_count:
        print("Added enable_crew_transportation_type=False to existing settings document.")
    else:
        print("Settings document already has enable_crew_transportation_type OR no settings document exists (will use default on first load).")

    client.close()
    print("Migration complete.")


if __name__ == "__main__":
    asyncio.run(run())
