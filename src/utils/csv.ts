import { StatEntry } from '../types';

/**
 * Exports statistic entries to a downloadable CSV file.
 */
export function exportToCSV(entries: StatEntry[], filename = 'timeseries_statistics.csv') {
  // Sort entries by date before export
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  const headers = ['Date', 'Value', 'IsCheckpoint', 'IsEvent', 'EventName'];
  const rows = sortedEntries.map(entry => [
    entry.date,
    entry.value !== undefined && entry.value !== null ? entry.value.toString() : '',
    entry.isCheckpoint ? 'true' : 'false',
    entry.isEvent ? 'true' : 'false',
    entry.eventName ? `"${entry.eventName.replace(/"/g, '""')}"` : ''
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses a CSV string and returns an array of StatEntry items.
 * Robustly handles headers and handles invalid/malformed lines gracefully.
 */
export function parseCSV(text: string): Omit<StatEntry, 'id'>[] {
  const lines = text.split(/\r?\n/);
  const result: Omit<StatEntry, 'id'>[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts: string[] = [];
    let insideQuotes = false;
    let currentPart = '';
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        parts.push(currentPart);
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart);

    if (parts.length < 2) continue;
    
    const firstPart = parts[0].trim();
    const secondPart = parts[1].trim();
    const thirdPart = parts[2] ? parts[2].trim().toLowerCase() : 'false';
    const fourthPart = parts[3] ? parts[3].trim().toLowerCase() : 'false';
    const fifthPart = parts[4] ? parts[4].trim() : '';
    
    // Skip header row if it contains descriptive text
    if (i === 0 && (firstPart.toLowerCase() === 'date' || secondPart.toLowerCase() === 'value' || (isNaN(Number(secondPart)) && fourthPart !== 'true'))) {
      continue;
    }
    
    const dateStr = firstPart.replace(/['"]/g, '');
    const isEvent = fourthPart === 'true' || fourthPart === '1' || fourthPart === 'yes';
    const valueNum = secondPart ? Number(secondPart) : null;
    const isCheckpoint = thirdPart === 'true' || thirdPart === '1' || thirdPart === 'yes';
    const eventName = fifthPart.replace(/['"]/g, '');
    
    // Basic validation: event checkpoints don't require valueNum to be a number
    if (dateStr && (isEvent || !isNaN(Number(secondPart)))) {
      result.push({
        date: dateStr,
        value: isEvent ? null : valueNum,
        isCheckpoint: isEvent ? false : isCheckpoint,
        isEvent,
        eventName: isEvent ? (eventName || 'Milestone Event') : undefined
      });
    }
  }
  
  return result;
}
