import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const days = body.days || 7;
    const dryRun = body.dryRun || false;
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'fi-sync.py');
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');
    
    // Build command
    let command = `${pythonPath} ${scriptPath} --type manual --days ${days}`;
    if (dryRun) {
      command += ' --dry-run';
    }
    
    console.log('Running Fi sync:', command);
    
    // Execute sync script
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      timeout: 120000, // 2 minute timeout
    });
    
    // Parse output for stats
    const output = stdout + stderr;
    const stats = {
      activities: extractStat(output, 'Activities synced'),
      walks: extractStat(output, 'Walks synced'),
      sleepRecords: extractStat(output, 'Sleep records synced'),
      totalRecords: extractStat(output, 'Total records'),
    };
    
    const success = output.includes('SYNC COMPLETE');
    
    return NextResponse.json({
      success,
      message: success ? 'Fi sync completed successfully!' : 'Fi sync completed with warnings',
      stats,
      output: output.split('\n').slice(-20).join('\n'), // Last 20 lines
      dryRun,
    });
    
  } catch (error: any) {
    console.error('Fi sync error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Fi sync failed',
      error: error.message,
      output: error.stdout || error.stderr || '',
    }, { status: 500 });
  }
}

export async function GET() {
  // Return sync status
  try {
    return NextResponse.json({
      available: true,
      message: 'Fi sync endpoint is available. Use POST to trigger sync.',
      defaultDays: 7,
    });
  } catch (error: any) {
    return NextResponse.json({
      available: false,
      error: error.message,
    }, { status: 500 });
  }
}

function extractStat(output: string, label: string): number {
  const regex = new RegExp(`${label}:\\s*(\\d+)`);
  const match = output.match(regex);
  return match ? parseInt(match[1], 10) : 0;
}
