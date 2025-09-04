# FHIR Snapshot Builder

A TypeScript/Node.js tool for generating FHIR snapshots from differential StructureDefinitions, specifically designed for processing Dutch healthcare standards (Zorginformatiebouwstenen - ZiB) and FHIR R4 resources.

## Overview

This tool processes FHIR StructureDefinition resources that contain differential elements and generates complete snapshots by merging them with base FHIR R4 definitions. It's particularly useful for working with healthcare information building blocks and creating complete, resolved FHIR profiles.

## Features

- **FHIR R4 Compliance**: Uses official `hl7.fhir.r4.core` package for base definitions
- **Dutch Healthcare Support**: Optimized for ZiB (Zorginformatiebouwstenen) processing
- **Automatic Base Resolution**: Loads appropriate base StructureDefinitions automatically
- **Element Merging**: Intelligent merging of differential elements with base elements
- **Path Sorting**: Proper element ordering by path depth and alphabetical sorting
- **Kebab-case Output**: Converts output filenames to kebab-case for consistency
- **CLI Interface**: Simple command-line interface with optional filename argument

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/martijn-on-fhir/snapshot-builder.git
   cd snapshot-builder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Basic Usage

Generate a snapshot from the input file :
```bash
npm start your-file.json
```

### Custom Input File

Generate a snapshot from a specific file:
```bash
npm run build && node dist/index.js your-file.json
```

### Input File Format

Input files should be FHIR StructureDefinition resources in JSON format with:
- `resourceType: "StructureDefinition"`
- `baseDefinition`: URL pointing to the base FHIR resource
- `differential.element[]`: Array of differential elements to merge

### Output

Generated snapshots are saved to the `output/` directory with kebab-case filenames based on the StructureDefinition's `name` property.

## Project Structure

```
snapshot-builder/
├── src/
│   ├── index.ts                 # CLI entry point
│   └── snapshot-generator.ts    # Core snapshot generation logic
├── input/                       # Input FHIR StructureDefinition files
│   ├── terminology/             # Terminology and code systems
│   └── *.xml.json              # FHIR StructureDefinitions (including ZiB)
├── output/                      # Generated snapshot files
├── dist/                        # Compiled JavaScript
└── node_modules/
    └── hl7.fhir.r4.core/       # Official FHIR R4 base definitions
```

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run snapshot` - Build and run snapshot generator
- `npm start` - Alias for snapshot command
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run release` - Create semantic release
- `npm run release:dry-run` - Test semantic release without publishing

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Build the project** with `npm run build`
3. **Test changes** with `npm run snapshot [filename]`
4. **Run tests** with `npm test`
5. **Lint code** with ESLint (configured but not in scripts yet)

### Architecture

#### FHIRSnapshotGenerator Class
- Loads base definitions from `hl7.fhir.r4.core` package
- Merges differential elements with base elements
- Handles element path resolution and slicing
- Manages type definitions and binding information

#### Element Processing
- **Path Resolution**: Maps differential elements to base elements by ID or path
- **Element Merging**: Combines properties from differential into base elements
- **New Element Addition**: Adds extensions, slices, and new paths
- **Sorting**: Orders final elements by path depth and alphabetically

## FHIR Standards Compliance

This tool ensures compliance with:
- **HL7 FHIR R4** specifications
- **Dutch healthcare information standards** (Nictiz/ZiB)
- **Medical terminology code systems** (SNOMED CT, LOINC, etc.)
- **Healthcare data privacy and security** requirements

## Troubleshooting

### Common Issues

**"No base definition found for resource type"**
- Ensure the input file has a valid `baseDefinition` URL
- Check that the referenced resource type exists in `hl7.fhir.r4.core`

**"Input file does not exist"**
- Verify the file path is correct relative to the project root
- Ensure the file is in the `input/` directory

**Build failures**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript compilation with `npm run build`

### Getting Help

- Check the [Issues](https://github.com/martijn-on-fhir/snapshot-builder/issues) section
- Review FHIR R4 documentation at [hl7.org/fhir/R4](https://hl7.org/fhir/R4/)
- Consult Dutch ZiB documentation at [zibs.nl](https://zibs.nl/)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is public. See the repository settings for details.

---

**Built with TypeScript and FHIR R4** 🔥