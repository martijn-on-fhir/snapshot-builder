import { FHIRSnapshotGenerator } from './snapshotGenerator';
import * as path from 'path';
import * as fs from 'fs';

// Get command line arguments
const args = process.argv.slice(2);
const inputFileName = args[0] || 'zib-Patient.xml.json';

// Construct input file path
const inputFile = path.join(__dirname, '..', 'zib', inputFileName);

// Check if input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`\n❌  Error: Input file '${inputFile}' does not exist`);
    process.exit(1);
}

try {

  console.log('Loading StructureDefinition from:', inputFile);
  
  // Load the differential StructureDefinition
  const structureDefinition = FHIRSnapshotGenerator.fromFile(inputFile);

    // Function to convert to kebab case
    const toKebabCase = (str: string) => {
        return str
            .replace(/^zib/i, '') // Remove 'zib' prefix
            .replace(/([A-Z])/g, '-$1') // Add hyphen before capitals
            .toLowerCase() // Convert to lowercase
            .replace(/^-/, ''); // Remove leading hyphen
    };

    // Construct output file path using the name property
    const outputFileName = `${toKebabCase(structureDefinition.name)}.json`;
    const outputFile = path.join(__dirname, '..', 'output', outputFileName);
  
  console.log(`Processing ${structureDefinition.name} (${structureDefinition.id})`);
  console.log(`\nBase definition: ${structureDefinition.baseDefinition}`);
  console.log(`Differential elements: ${structureDefinition.differential?.element.length || 0}`);
  
  // Generate snapshot
  const generator = new FHIRSnapshotGenerator();
  const snapshotResult = generator.generateSnapshot(structureDefinition);
  
  console.log(`Generated snapshot with ${snapshotResult.snapshot?.element.length} elements`);

  const outputDir = path.dirname(outputFile);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  FHIRSnapshotGenerator.saveToFile(snapshotResult, outputFile);
  
  console.log('Snapshot saved to:', outputFile);
  console.log("\n✅  Snapshot generation completed successfully.\n");
  
} catch (error) {
  console.error("\n❌  Error generating snapshot:", error);
  process.exit(1);
}
