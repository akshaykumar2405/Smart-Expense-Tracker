# PowerShell script to start the expense tracker server
Write-Host "🚀 Starting Expense Tracker Backend Server..." -ForegroundColor Green
Write-Host ""

# Set the Python path to current directory
$env:PYTHONPATH = $PWD  # cspell:disable-line

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "💡 Please install Python 3.8+ and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if required packages are installed
try {
    python -c "import fastapi, uvicorn" 2>$null  # cspell:disable-line
    Write-Host "✅ Required packages found" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing required packages..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {  # install fall error \occured
        Write-Host "❌ Error: Failed to install packages" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the server
Write-Host "🌐 Starting server..." -ForegroundColor Green
python run_server.py

Read-Host "Press Enter to exit"