const { execSync } = require('child_process');
const path = require('path');

console.log('🔐 WSZYSTKIE TESTY AUTH');
console.log('='.repeat(30));

const testsDir = path.join(__dirname, 'tests_front');

try {
    console.log('📁 Folder testów:', testsDir);
    console.log('🎯 Uruchamianie wszystkich testów auth...');
    console.log('');

    // Uruchom wszystkie testy z folderu unit/auth/
    execSync('npx vitest run unit/auth/ unit/ui/ unit/utils/ unit/routes/', {
        stdio: 'inherit',
        cwd: testsDir
    });



    console.log('');
    console.log('✅ WSZYSTKIE TESTY AUTH PRZESZŁY!');
    console.log('🔐 System uwierzytelniania działa!');

} catch (error) {
    console.error('❌ Niektóre testy się wysypały:', error.message);
    process.exit(1);
}
