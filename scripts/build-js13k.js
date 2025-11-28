/**
 * Build script for JS13k version of OS13k
 * Cross-platform Node.js implementation of build.bat
 * 
 * This script:
 * 1. Compiles index.js with Google Closure Compiler (ADVANCED mode)
 * 2. Further minifies with Terser
 * 3. Compresses with Roadroller for better zip compression
 * 4. Creates the final HTML and ZIP file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const JS13K_DIR = path.join(__dirname, '..', 'JS13k');
const BUILD_DIR = path.join(JS13K_DIR, 'build');
const OUTPUT_NAME = 'OS13k';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    log(`> ${command}`, 'cyan');
    try {
        return execSync(command, { 
            stdio: 'inherit',
            cwd: JS13K_DIR,
            ...options
        });
    } catch (error) {
        log(`Error executing: ${command}`, 'red');
        throw error;
    }
}

function execOutput(command, options = {}) {
    return execSync(command, { 
        encoding: 'utf-8',
        cwd: JS13K_DIR,
        ...options
    }).trim();
}

async function build() {
    log('\n=== Building JS13k Version ===\n', 'green');
    
    // Check if JS13k/index.js exists
    const indexJsPath = path.join(JS13K_DIR, 'index.js');
    if (!fs.existsSync(indexJsPath)) {
        log('Warning: JS13k/index.js not found. Skipping JS13k build.', 'yellow');
        log('The JS13k build requires the source file to be present.', 'yellow');
        return;
    }

    // Clean up old files
    log('\n1. Cleaning up old files...', 'yellow');
    try {
        if (fs.existsSync(path.join(JS13K_DIR, 'index.zip'))) {
            fs.unlinkSync(path.join(JS13K_DIR, 'index.zip'));
        }
        if (fs.existsSync(path.join(JS13K_DIR, 'index.min.html'))) {
            fs.unlinkSync(path.join(JS13K_DIR, 'index.min.html'));
        }
        if (fs.existsSync(BUILD_DIR)) {
            fs.rmSync(BUILD_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        log(`Warning: Could not clean up some files: ${err.message}`, 'yellow');
    }

    // Create build directory
    fs.mkdirSync(BUILD_DIR, { recursive: true });

    // Step 1: Google Closure Compiler
    log('\n2. Running Google Closure Compiler...', 'yellow');
    try {
        exec(`npx google-closure-compiler --js index.js --externs externs.js --js_output_file build/index.js --compilation_level ADVANCED --language_out ECMASCRIPT_2019 --warning_level VERBOSE --jscomp_off "*"`);
    } catch (error) {
        log('Closure Compiler failed. Trying with less strict settings...', 'yellow');
        exec(`npx google-closure-compiler --js index.js --externs externs.js --js_output_file build/index.js --compilation_level SIMPLE --language_out ECMASCRIPT_2019`);
    }

    // Add prefix to disable strict mode (compatibility fix)
    log('\n3. Adding strict mode fix...', 'yellow');
    const compiledJs = fs.readFileSync(path.join(BUILD_DIR, 'index.js'), 'utf-8');
    fs.writeFileSync(path.join(BUILD_DIR, 'index.js'), '0\n' + compiledJs);

    // Step 2: Terser minification
    log('\n4. Running Terser minification...', 'yellow');
    exec('npx terser -o build/index.js --compress --mangle -- build/index.js');

    // Step 3: Roadroller compression
    log('\n5. Running Roadroller compression...', 'yellow');
    try {
        exec('npx roadroller build/index.js -o build/index.js');
    } catch (error) {
        log('Roadroller failed, continuing without it...', 'yellow');
    }

    // Step 4: Create final HTML
    log('\n6. Creating final HTML...', 'yellow');
    const finalJs = fs.readFileSync(path.join(BUILD_DIR, 'index.js'), 'utf-8');
    const finalHtml = `<body><script>${finalJs}</script>`;
    fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), finalHtml);

    // Step 5: Create ZIP file
    log('\n7. Creating ZIP file...', 'yellow');
    process.chdir(BUILD_DIR);
    try {
        // Use standard zip command
        exec('zip -9 index.zip index.html', { cwd: BUILD_DIR });
    } catch (zipError) {
        log('Warning: Could not create ZIP file - zip command not available', 'yellow');
    }

    // Copy results to JS13k folder
    log('\n8. Copying results...', 'yellow');
    if (fs.existsSync(path.join(BUILD_DIR, 'index.zip'))) {
        fs.copyFileSync(path.join(BUILD_DIR, 'index.zip'), path.join(JS13K_DIR, `${OUTPUT_NAME}.zip`));
    }
    fs.copyFileSync(path.join(BUILD_DIR, 'index.html'), path.join(JS13K_DIR, 'index.min.html'));

    // Report sizes
    log('\n=== Build Complete ===\n', 'green');
    const minHtmlSize = fs.statSync(path.join(JS13K_DIR, 'index.min.html')).size;
    log(`Minified HTML: ${minHtmlSize} bytes (${(minHtmlSize / 1024).toFixed(2)} KB)`, 'green');
    
    if (fs.existsSync(path.join(JS13K_DIR, `${OUTPUT_NAME}.zip`))) {
        const zipSize = fs.statSync(path.join(JS13K_DIR, `${OUTPUT_NAME}.zip`)).size;
        log(`ZIP file: ${zipSize} bytes (${(zipSize / 1024).toFixed(2)} KB)`, 'green');
        
        if (zipSize <= 13312) {
            log(`✓ ZIP is under 13KB limit! (${13312 - zipSize} bytes to spare)`, 'green');
        } else {
            log(`✗ ZIP exceeds 13KB limit by ${zipSize - 13312} bytes`, 'red');
        }
    }

    // Cleanup build directory
    try {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    } catch (err) {
        // Ignore cleanup errors
    }
}

// Run the build
build().catch(err => {
    log(`Build failed: ${err.message}`, 'red');
    process.exit(1);
});
