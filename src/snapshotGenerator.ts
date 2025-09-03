import * as fs from 'fs';
import * as path from 'path';

interface ElementDefinition {
  id?: string;
  path: string;
  min: number;
  max: string;
  base?: {
    path: string;
    min: number;
    max: string;
  };
  type?: Array<{
    code: string;
    profile?: string[];
    targetProfile?: string[];
  }>;
  slicing?: any;
  sliceName?: string;
  patternIdentifier?: any;
  definition?: string;
  short?: string;
  alias?: string[];
  binding?: any;
  mapping?: Array<{
    identity: string;
    map: string;
    comment?: string;
  }>;
  comment?: string;
  defaultValueBoolean?: boolean;
  isModifier?: boolean;
  isSummary?: boolean;
  meaningWhenMissing?: string;
  constraint?: any[];
  extension?: any[];
}

interface StructureDefinition {
  resourceType: string;
  id: string;
  url: string;
  name: string;
  title?: string;
  status: string;
  date?: string;
  publisher?: string;
  description?: string;
  fhirVersion?: string;
  baseDefinition: string;
  derivation: string;
  differential?: {
    element: ElementDefinition[];
  };
  snapshot?: {
    element: ElementDefinition[];
  };
}

class FHIRSnapshotGenerator {

  // Load base elements from FHIR R4 core package
  private loadBaseStructureDefinition(resourceType: string): ElementDefinition[] {
    const fhirCorePackagePath = path.join(__dirname, '..', 'node_modules', 'hl7.fhir.r4.core', `StructureDefinition-${resourceType}.json`);
    
    try {
      if (fs.existsSync(fhirCorePackagePath)) {
        console.log(`Info: Loading ${resourceType} base definition from FHIR R4 core package`);
        const baseStructureDef = FHIRSnapshotGenerator.fromFile(fhirCorePackagePath);
        if (baseStructureDef.snapshot?.element) {
          return baseStructureDef.snapshot.element;
        }
      }
    } catch (error) {
      console.log(`Error: Could not load base elements from FHIR R4 core package for ${resourceType}: ${error}`);
    }
    
    return [];
  }


  // Method to get base elements for any resource type
  private getBaseElements(resourceType: string): ElementDefinition[] {
    const baseElements: ElementDefinition[] = [];

    // For all FHIR resources, try to load from official base definitions
    // First try to load the specific resource type (e.g., Patient.json, Extension.json)
    let resourceElements = this.loadBaseStructureDefinition(resourceType);
    
    if (resourceElements.length > 0 && resourceElements[0].path === resourceType) {
      // Use the loaded resource-specific elements directly (best case)
      baseElements.push(...resourceElements);
    } else {
      // If no base definition found, throw an error
      throw new Error(`No base definition found for resource type: ${resourceType}. Neither local base-elements nor FHIR R4 core package contains this resource type.`);
    }

    return baseElements;
  }


  // Method to extract resource type from base definition URL
  private extractResourceType(baseDefinition: string): string {
    const match = baseDefinition.match(/StructureDefinition\/(\w+)$/);
    return match ? match[1] : 'DomainResource';
  }

  generateSnapshot(structureDefinition: StructureDefinition): StructureDefinition {
    if (!structureDefinition.differential?.element) {
      throw new Error('StructureDefinition must have differential elements');
    }

    // Determine the resource type from the base definition
    const resourceType = this.extractResourceType(structureDefinition.baseDefinition);
    console.log(`Base definition: ${structureDefinition.baseDefinition}`);
    
    // Get base elements for this resource type
    const baseElements = this.getBaseElements(resourceType);
    const snapshotElements = JSON.parse(JSON.stringify(baseElements));

    // Create a map for quick element lookup
    const elementMap = new Map<string, ElementDefinition>();
    snapshotElements.forEach((element: ElementDefinition) => {
      elementMap.set(element.path, element);
    });

    // Apply differential changes
    structureDefinition.differential.element.forEach(diffElement => {
      const elementId = diffElement.id;
      const path = diffElement.path;
      
      // Try to find existing element by ID first, then by path
      let existingElement = snapshotElements.find((el: ElementDefinition) => el.id === elementId);
      if (!existingElement) {
        existingElement = snapshotElements.find((el: ElementDefinition) => el.path === path && !diffElement.sliceName);
      }
      
      if (existingElement) {
        // Update existing element
        this.mergeElementDefinition(existingElement, diffElement);
      } else {
        // Add new element (extension, slice, etc.)
        const newElement: ElementDefinition = JSON.parse(JSON.stringify(diffElement));
        
        // Set base if not present
        if (!newElement.base) {
          newElement.base = {
            path: path,
            min: newElement.min ?? 0,
            max: newElement.max ?? "*"
          };
        }

        snapshotElements.push(newElement);
        elementMap.set(elementId || path, newElement);
      }
    });

    // Sort elements by path depth and alphabetically
    snapshotElements.sort((a: ElementDefinition, b: ElementDefinition) => {
      const aDepth = a.path.split('.').length;
      const bDepth = b.path.split('.').length;
      if (aDepth !== bDepth) {
        return aDepth - bDepth;
      }
      return a.path.localeCompare(b.path);
    });

    // Create the result
    const result: StructureDefinition = {
      ...structureDefinition,
      snapshot: {
        element: snapshotElements
      }
    };

    // Remove differential since we now have snapshot
    delete result.differential;

    return result;
  }

  private mergeElementDefinition(baseElement: ElementDefinition, diffElement: ElementDefinition): void {
    // Merge properties from differential into base element
    Object.keys(diffElement).forEach(key => {
      if (key === 'id' || key === 'path') {
        // Always use values from differential for id and path
        (baseElement as any)[key] = (diffElement as any)[key];
      } else if (key === 'type' && diffElement.type) {
        // Merge type definitions
        baseElement.type = diffElement.type;
      } else if (key === 'binding' && diffElement.binding) {
        // Replace binding completely
        baseElement.binding = diffElement.binding;
      } else if (key === 'slicing' && diffElement.slicing) {
        // Add slicing information
        baseElement.slicing = diffElement.slicing;
      } else if (key === 'extension' && diffElement.extension) {
        // Merge extensions
        baseElement.extension = diffElement.extension;
      } else if ((diffElement as any)[key] !== undefined) {
        // For all other properties, use differential value
        (baseElement as any)[key] = (diffElement as any)[key];
      }
    });
  }

  static fromFile(filePath: string): StructureDefinition {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  static saveToFile(structureDefinition: StructureDefinition, filePath: string): void {
    const content = JSON.stringify(structureDefinition, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

export { FHIRSnapshotGenerator, StructureDefinition, ElementDefinition };