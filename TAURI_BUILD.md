# Tauri Build Guide

## Prerequisites
- Rust installed (https://www.rust-lang.org/tools/install)
- Node.js & pnpm
- For cross-compilation: additional targets and tools

## Build Commands

### macOS (Apple Silicon - ARM64)
```bash
pnpm tauri:build
```
Output: `src-tauri/target/release/bundle/macos/Mown.app` and `.dmg`

### macOS (Intel - x86_64)
```bash
rustup target add x86_64-apple-darwin
pnpm tauri:build --target x86_64-apple-darwin
```

### Windows (x64)
Requires cross-compilation tools on macOS:
```bash
rustup target add x86_64-pc-windows-msvc
# Install mingw-w64: brew install mingw-w64
pnpm tauri:build:windows
```

### Linux (x64)
Requires cross-compilation tools:
```bash
rustup target add x86_64-unknown-linux-gnu
# Install cross-compilation tools
pnpm tauri:build:linux
```

## Build All Platforms (from macOS)
```bash
pnpm tauri:build:mac        # Both ARM64 and x86_64
pnpm tauri:build:windows   # Requires Windows target
pnpm tauri:build:linux    # Requires Linux target
```

## Optimization
- Builds are automatically optimized (release mode)
- For smaller bundles, use UPX compression (configure in tauri.conf.json)
- Use `cargo tauri build --features "custom-protocol"` for better performance

## Output Location
All builds are in: `src-tauri/target/release/bundle/`
- macOS: `bundle/macos/` and `bundle/dmg/`
- Windows: `bundle/nsis/`
- Linux: `bundle/deb/` and `bundle/appimage/`
