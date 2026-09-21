import sqlite3
from datetime import datetime


DATABASE_PATH = "../phd_companion.db"


NEW_COLUMNS = {
    "tags": "TEXT",
    "notes": "TEXT",
    "research_problem": "TEXT",
    "methodology_notes": "TEXT",
    "key_findings": "TEXT",
    "research_gap": "TEXT",
    "limitations": "TEXT",
    "relevance": "TEXT",
    "personal_thoughts": "TEXT",
    "updated_at": "DATETIME",
}


def migrate_database():
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(papers)")
    existing_columns = {
        row[1]
        for row in cursor.fetchall()
    }

    print("Checking papers table...")

    for column_name, column_type in NEW_COLUMNS.items():

        if column_name in existing_columns:
            print(f"✓ {column_name} already exists")

        else:
            cursor.execute(
                f"""
                ALTER TABLE papers
                ADD COLUMN {column_name} {column_type}
                """
            )

            print(f"+ Added column: {column_name}")

    # Give existing papers an initial timestamp
    cursor.execute(
        """
        UPDATE papers
        SET updated_at = ?
        WHERE updated_at IS NULL
        """,
        (datetime.utcnow(),),
    )

    connection.commit()
    connection.close()

    print()
    print("Database migration completed successfully.")


if __name__ == "__main__":
    migrate_database()