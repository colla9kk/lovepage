"""Export a consistent SQLite snapshot; output contains private customer data."""
import json
import sqlite3
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit('Uso: python scripts/export-sqlite.py prisma/dev.db backup.export.json')
source = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2])
with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as database:
    database.row_factory = sqlite3.Row
    database.execute('BEGIN')
    tables = {row[0] for row in database.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    data = {name: [dict(row) for row in database.execute(f'SELECT * FROM "{name}"')] if name in tables else [] for name in ('Order', 'Page')}
with output.open('x', encoding='utf-8') as target:
    json.dump(data, target, ensure_ascii=False)
output.chmod(0o600)
print(f'Exportados {len(data["Page"])} páginas e {len(data["Order"])} pedidos.')
