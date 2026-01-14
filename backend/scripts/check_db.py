from sqlalchemy import create_engine, text, inspect

engine = create_engine('sqlite:///dss_v2.db')
inspector = inspect(engine)
tables = inspector.get_table_names()

print("Available tables:", tables)
print()

conn = engine.connect()

if 'transactions' in tables:
    txn_count = conn.execute(text('SELECT COUNT(*) FROM transactions')).scalar()
    print(f'Transactions: {txn_count:,}')
    
    # Get sample
    result = conn.execute(text('SELECT * FROM transactions LIMIT 3'))
    print("\nSample transactions:")
    for row in result:
        print(row)

if 'rlfm_data' in tables:
    rlfm_count = conn.execute(text('SELECT COUNT(*) FROM rlfm_data')).scalar()
    print(f'\nRLFM Records: {rlfm_count:,}')
else:
    print("\nRLFM table does not exist yet")

conn.close()
