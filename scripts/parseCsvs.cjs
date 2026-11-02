const fs = require('fs');
const path = require('path');

const files = [
  { file: 'ERA_members.csv', alliance: 'ERA' },
  { file: 'FFF_members.csv', alliance: 'FFF' },
  { file: 'TEA_members.csv', alliance: 'TEA' },
  { file: 'VIK_members.csv', alliance: 'VIK' }
];

const players = [];

for (const { file, alliance } of files) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error('File missing:', filePath);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split(/\r?\n/);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // RFC-compliant CSV line parsing
    const row = [];
    let insideQuote = false;
    let current = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    const name = row[0] || 'Unknown';
    const id = row[1] || String(Date.now() + Math.random());
    const rank = row[2] || 'R1';
    const currentPower = parseInt(row[3], 10) || 0;
    const tgLevel = row[4] || '';

    players.push({
      id,
      name,
      rank,
      currentPower,
      tgLevel,
      alliance,
      battleGroup: 'Unassigned',
      updatedAt: new Date().toISOString()
    });
  }
}

const dir = path.resolve(process.cwd(), 'src/data');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const code = `import { Player } from '../types/roster';\n\nexport const INITIAL_PLAYERS: Player[] = ${JSON.stringify(players, null, 2)};\n`;
fs.writeFileSync(path.join(dir, 'initialData.ts'), code, 'utf8');
console.log('Successfully wrote', players.length, 'players to src/data/initialData.ts');
