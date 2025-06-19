const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
}

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
}

async function runCommand(command, description) {
    colorLog(`\n🔄 ${description}...`, 'cyan')
    try {
        const { stdout, stderr } = await execAsync(command)
        if (stdout) console.log(stdout)
        if (stderr) console.warn(stderr)
        return { success: true, stdout, stderr }
    } catch (error) {
        colorLog(`❌ ${description} failed:`, 'red')
        console.error(error.message)
        return { success: false, error }
    }
}

async function checkCoverageThreshold() {
    const coverageFile = path.join(__dirname, 'tests_front', 'coverage', 'coverage-summary.json')

    if (!fs.existsSync(coverageFile)) {
        colorLog('⚠️  Coverage file not found', 'yellow')
        return false
    }

    try {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
        const total = coverage.total

        colorLog('\n📊 Coverage Results:', 'blue')
        colorLog(`Lines: ${total.lines.pct}%`, total.lines.pct >= 50 ? 'green' : 'red')
        colorLog(`Functions: ${total.functions.pct}%`, total.functions.pct >= 50 ? 'green' : 'red')
        colorLog(`Branches: ${total.branches.pct}%`, total.branches.pct >= 50 ? 'green' : 'red')
        colorLog(`Statements: ${total.statements.pct}%`, total.statements.pct >= 50 ? 'green' : 'red')

        const meetsThreshold = (
            total.lines.pct >= 50 &&
            total.functions.pct >= 50 &&
            total.branches.pct >= 50 &&
            total.statements.pct >= 50
        )

        if (meetsThreshold) {
            colorLog('\n✅ Coverage meets 50% threshold!', 'green')
            return true
        } else {
            colorLog('\n❌ Coverage below 50% threshold!', 'red')
            return false
        }
    } catch (error) {
        colorLog(`⚠️  Error reading coverage file: ${error.message}`, 'yellow')
        return false
    }
}

async function runAllFrontTests() {
    colorLog('🚀 Starting Frontend Tests for RentalProject', 'bright')
    colorLog('='.repeat(50), 'blue')

    let allTestsPassed = true

    // 1. Run unit tests
    const unitTestResult = await runCommand(
        'npx vitest run --config tests_front/vitest.config.js tests_front/unit',
        'Running Unit Tests'
    )
    if (!unitTestResult.success) {
        allTestsPassed = false
    }

    // 2. Run all tests with coverage
    const coverageResult = await runCommand(
        'npx vitest run --config tests_front/vitest.config.js --coverage tests_front',
        'Running Tests with Coverage'
    )
    if (!coverageResult.success) {
        allTestsPassed = false
    }

    // 3. Check coverage thresholds
    const coverageMeetsThreshold = await checkCoverageThreshold()
    if (!coverageMeetsThreshold) {
        allTestsPassed = false
    }

    // 4. Summary
    colorLog('\n' + '='.repeat(50), 'blue')
    if (allTestsPassed && coverageMeetsThreshold) {
        colorLog('🎉 All frontend tests passed and coverage meets threshold!', 'green')
        process.exit(0)
    } else {
        colorLog('💥 Some tests failed or coverage is below threshold!', 'red')
        process.exit(1)
    }
}

// Additional utility functions
const testCommands = {
    unit: () => runCommand('npx vitest run --config tests_front/vitest.config.js tests_front/unit', 'Unit Tests'),
    watch: () => runCommand('npx vitest --config tests_front/vitest.config.js tests_front --watch', 'Watch Mode'),
    coverage: () => runCommand('npx vitest run --config tests_front/vitest.config.js --coverage tests_front', 'Coverage Report'),
    ui: () => runCommand('npx vitest --config tests_front/vitest.config.js --ui tests_front', 'Vitest UI')
}

// Run if this file is executed directly
if (require.main === module) {
    runAllFrontTests().catch(error => {
        colorLog(`💥 Unexpected error: ${error.message}`, 'red')
        process.exit(1)
    })
}

module.exports = { runAllFrontTests, testCommands }