from sqlalchemy import create_engine, text, inspect
import pandas as pd

try:
    engine = create_engine('sqlite:///dss_v2.db')
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("=== TABLES ===")
    print(tables)
    print("\n")

    conn = engine.connect()

    for table in tables:
        print(f"--- Table: {table} ---")
        # Get columns
        columns = inspector.get_columns(table)
        print("Columns:")
        for col in columns:
            print(f"- {col['name']} ({col['type']})")
        
        # Get count
        count = conn.execute(text(f'SELECT COUNT(*) FROM {table}')).scalar()
        print(f"Total Rows: {count}")
        
        # Get sample
        if count > 0:
            print("Sample Data:")
            df = pd.read_sql(f'SELECT * FROM {table} LIMIT 3', conn)
            print(df.to_string(index=False))
        print("\n")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
