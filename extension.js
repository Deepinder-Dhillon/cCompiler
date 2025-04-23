// Import VS Code API and Node modules
const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Recursively find all C source files corresponding to included headers.
 * Protects against circular dependencies.
 */
function findDependentCFiles(folderPath, filePath, cFilesSet, scannedFiles) {
    if (scannedFiles.has(filePath)) return;
    scannedFiles.add(filePath);

    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`Error reading ${filePath}: ${err.message}`);
        return;
    }

    const includeRegex = /#include\s+["<](.+?)[">]/g;
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
        // Ignore system headers <stdio.h>
        if (match[0].includes('<')) continue;
        const header = match[1];
        const cFile = header.replace(/\.h$/, '.c');
        const cPath = path.join(folderPath, cFile);
        if (fs.existsSync(cPath)) {
            cFilesSet.add(path.relative(folderPath, cPath));
            findDependentCFiles(folderPath, cPath, cFilesSet, scannedFiles);
        }
    }
}

/**
 * Build Makefile content using workspace settings.
 */
function createMakefile(folderPath, mainFile) {
    const cfg = vscode.workspace.getConfiguration('cCompiler');
    const cc = cfg.get('CC', 'gcc');
    const cflags = cfg.get('CFLAGS', ['-Wall', '-g']).join(' ');
    const libs = cfg.get('LIBS', []).join(' ');

    const mainPath = path.join(folderPath, mainFile);
    const cFiles = new Set([mainFile]);
    findDependentCFiles(folderPath, mainPath, cFiles, new Set());

    const lines = [
        `CC=${cc}`,
        `CFLAGS=${cflags}`,
        `LIBS=${libs}`,
        `MAIN=${mainFile.replace(/\.c$/, '')}`,
        `SRCS=${Array.from(cFiles).join(' ')}`,
        `OBJS=$(SRCS:.c=.o)`,
        ``,
        `all: $(MAIN)`,
        ``,
        `$(MAIN): $(OBJS)`,
        `\t$(CC) $(CFLAGS) $(OBJS) $(LIBS) -o $(MAIN)`,
        ``,
        `%.o: %.c`,
        `\t$(CC) $(CFLAGS) -c $< -o $@`,
        ``,
        `clean:`,
        `\trm -f $(OBJS) $(MAIN)`
    ];

    return lines.join('\n');
}

/**
 * Run `make` in given folder and return promise of stdout.
 */
function runMake(directory) {
    return new Promise((resolve, reject) => {
        cp.exec('make', { cwd: directory }, (err, stdout, stderr) => {
            if (err) {
                // Forward stderr as error message.
                return reject(stderr || err.message);
            }
            resolve(stdout);
        });
    });
}

/**
 * Compile a single file directly with the compiler (no Makefile).
 */
function compileFileDirect(filePath) {
    const cfg = vscode.workspace.getConfiguration('cCompiler');
    const cc = cfg.get('CC', 'gcc');
    const cflags = cfg.get('CFLAGS', ['-Wall', '-g']).join(' ');
    const libs = cfg.get('LIBS', []).join(' ');

    const output = path.basename(filePath, '.c');
    const cmd = `${cc} ${cflags} "${filePath}" -o "${output}" ${libs}`;

    return new Promise((resolve, reject) => {
        cp.exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout);
        });
    });
}

/**
 * Activate extension.
 */
function activate(context) {
    // Compile via Makefile
    context.subscriptions.push(vscode.commands.registerCommand('cCompiler.compile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return vscode.window.showErrorMessage('No file open.');
        const filePath = editor.document.fileName;
        if (path.extname(filePath) !== '.c') return vscode.window.showErrorMessage('Not a C file.');

        const dir = path.dirname(filePath);
        const mfPath = path.join(dir, 'Makefile');
        let regenerate = true;
        if (fs.existsSync(mfPath)) {
            const ans = await vscode.window.showWarningMessage('Makefile exists. Regenerate?', 'Yes', 'No');
            regenerate = ans === 'Yes';
        }
        if (regenerate) {
            fs.writeFileSync(mfPath, createMakefile(dir, path.basename(filePath)), 'utf8');
            vscode.window.showInformationMessage('Makefile generated.');
        }

        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Compiling with make...' }, () => runMake(dir));
            vscode.window.showInformationMessage('Compilation succeeded!');
        } catch (err) {
            vscode.window.showErrorMessage(`Make failed:\n${err}`);
        }
    }));

    // Compile current file directly (no Makefile)
    context.subscriptions.push(vscode.commands.registerCommand('cCompiler.compileFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return vscode.window.showErrorMessage('No file open.');
        const filePath = editor.document.fileName;
        if (path.extname(filePath) !== '.c') return vscode.window.showErrorMessage('Not a C file.');

        try {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Compiling file...' }, () => compileFileDirect(filePath));
            vscode.window.showInformationMessage('File compiled successfully!');
        } catch (err) {
            vscode.window.showErrorMessage(`Compile failed:\n${err}`);
        }
    }));
}

function deactivate() {}

module.exports = { activate, deactivate };
