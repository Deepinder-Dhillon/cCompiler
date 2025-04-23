# VS Code cCompiler Extension

A simple extension that helps you build C projects in VS Code. It creates a Makefile for you, figures out which `.c` files are needed by scanning your `#include` headers, and compiles everything with a single command.

---

## Install

Install using this link https://marketplace.visualstudio.com/items?itemName=DeepinderDhillon.cCompiler

or 

Search C-Compile in VS Code Extensions

## Features

| Feature | What it does |
|--------|---------------|
| **Makefile generation** | Creates a clean Makefile with one click. |
| **Include tracking** | Follows `#include "file.h"` and adds the matching `.c` files to the build. |
| **Ignores system headers** | Skips standard includes like `<stdio.h>`, only tracks local ones. |
| **Custom settings** | Set your own compiler, flags, and libraries in VS Code settings. |
| **Safe file handling** | Asks before overwriting an existing Makefile. |
| **Includes clean target** | Use `make clean` to remove object files and the binary. |

---

## How to Use

1. Open a `.c` file in your editor.
2. Press `F1`, `Ctrl+Shift+P`, or type `>` to open the command palette.
3. Type and run `Compile C Code`.
   - It will generate a Makefile (if one doesn’t exist), scan for dependencies, and compile the project.

---

## Customizing the Build
You can change the compiler or flags in the extension settings.

### Method 1: VS Code Settings UI
Go to **Settings → Extensions → cCompiler** and set:
- `CC` – the compiler (e.g. `gcc`)
- `CFLAGS` – compiler flags
- `LIBS` – linker libraries

### Method 2: Editing `settings.json`
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Select **Preferences: Open Settings (JSON)**
3. Add the following:

```json
{
  "cCompiler.CC": "gcc",
  "cCompiler.CFLAGS": ["-std=c11", "-Wall"],
  "cCompiler.LIBS": ["-lm", "-lpthread"]
}
```

These settings will apply when generating a Makefile or compiling a file directly.

---

## Requirements
- VS Code version 1.99 or higher
- GCC installed and available in your system `PATH`

---

## Contributing
1. Fork the repo
2. Create a new branch
3. Open a pull request with your changes

---

## License
MIT
