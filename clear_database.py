import sqlite3

# Connect to the database
conn = sqlite3.connect('tournament_app.db')
cursor = conn.cursor()

print("Deleting all records from database...")

# List of tables to clear (order matters due to foreign key constraints)
tables_to_clear = [
    'notifications',
    'user_achievements', 
    'post_likes',
    'comments',
    'social_posts',
    'tournament_discussions',
    'match_results',
    'tournament_participants',
    'user_connections',
    'tournaments',
    'users'
]

# Delete all records from each table
for table in tables_to_clear:
    try:
        # Get count before deletion
        count_before = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        
        # Delete all records
        cursor.execute(f"DELETE FROM {table}")
        
        # Get count after deletion
        count_after = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        
        print(f"✅ {table}: Deleted {count_before} records (remaining: {count_after})")
        
    except sqlite3.Error as e:
        print(f"❌ Error clearing {table}: {e}")

# Reset auto-increment counters
print("\nResetting auto-increment counters...")
for table in tables_to_clear:
    try:
        cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
        print(f"✅ Reset auto-increment for {table}")
    except sqlite3.Error as e:
        print(f"⚠️  Could not reset auto-increment for {table}: {e}")

# Commit changes
conn.commit()

# Verify all tables are empty
print("\nVerifying all tables are empty:")
total_records = 0
for table in tables_to_clear:
    count = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    total_records += count
    status = "✅ Empty" if count == 0 else f"⚠️  Still has {count} records"
    print(f"{table}: {status}")

print(f"\nTotal records remaining in database: {total_records}")

if total_records == 0:
    print("🎉 Database successfully cleared! All records deleted.")
else:
    print("⚠️  Some records may still remain.")

# Close connection
conn.close()
