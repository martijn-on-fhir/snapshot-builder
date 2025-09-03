# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `snapshorbuilder`, a TypeScript/Node.js project for processing Dutch healthcare standards and FHIR (HL7 Fast Healthcare Interoperability Resources) data. The project works with Zorginstituut Nederland (ZiB) healthcare information building blocks and implements healthcare data transformation capabilities.

## Commands

### Build
```bash
npm run build
```
Compiles TypeScript source code from `src/` to `dist/` using the TypeScript compiler.

### Development
Currently no development server or watch mode is configured. Build manually after changes.

## Architecture and Structure

### Healthcare Data Organization
- `nl-core/` - Dutch healthcare core profiles and extensions (175+ FHIR-compliant JSON files)
- `zib/` - Healthcare Information Building Blocks with terminology, patterns, and clinical definitions (400+ files)
- `src/` - TypeScript source code with FHIR snapshot generation
- `node_modules/hl7.fhir.r4.core/` - Official FHIR R4 base StructureDefinitions

### Technology Stack
- **Language**: TypeScript 5.5.3+ with strict type checking
- **Runtime**: Node.js with CommonJS modules  
- **Target**: ES2016
- **Build**: TypeScript compiler (tsc)
- **FHIR**: hl7.fhir.r4.core package for official base definitions

### Healthcare Domain Context
The project processes:
- FHIR resource definitions and profiles
- Dutch healthcare terminology systems and code sets
- Medical device definitions and patient care assessments
- Clinical observation patterns and healthcare provider structures
- Healthcare interoperability standards compliance

### Data Structure Patterns
Healthcare data follows standardized JSON formats with:
- FHIR resource type definitions
- Dutch healthcare system terminologies
- Structured clinical data elements
- Interoperability mappings and transformations

## Development Notes

### Missing Development Infrastructure
- No testing framework configured
- No linting (ESLint) or formatting (Prettier) setup
- No documentation generation
- No development watch mode or hot reload

### Healthcare Standards Compliance
When working with healthcare data, ensure compliance with:
- HL7 FHIR R4+ specifications
- Dutch healthcare information standards (Nictiz/ZiB)
- Medical terminology code systems (SNOMED CT, LOINC, etc.)
- Healthcare data privacy and security requirements