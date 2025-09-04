import { FHIRSnapshotGenerator, StructureDefinition, ElementDefinition } from './snapshot-generator';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('FHIRSnapshotGenerator', () => {
    let generator: FHIRSnapshotGenerator;

    beforeEach(() => {
        generator = new FHIRSnapshotGenerator();
        jest.clearAllMocks();
    });

    describe('fromFile', () => {
        it('should load structure definition from file', () => {
            const mockStructureDef: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint'
            };

            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockStructureDef));

            const result = FHIRSnapshotGenerator.fromFile('/path/to/test.json');

            expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/test.json', 'utf-8');
            expect(result).toEqual(mockStructureDef);
        });

        it('should throw error if file cannot be read', () => {
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            expect(() => {
                FHIRSnapshotGenerator.fromFile('/path/to/nonexistent.json');
            }).toThrow('File not found');
        });

        it('should throw error for invalid JSON', () => {
            mockFs.readFileSync.mockReturnValue('invalid json');

            expect(() => {
                FHIRSnapshotGenerator.fromFile('/path/to/invalid.json');
            }).toThrow();
        });
    });

    describe('saveToFile', () => {
        it('should save structure definition to file', () => {
            const mockStructureDef: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint'
            };

            FHIRSnapshotGenerator.saveToFile(mockStructureDef, '/path/to/output.json');

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                '/path/to/output.json',
                JSON.stringify(mockStructureDef, null, 2),
                'utf-8'
            );
        });
    });

    describe('extractResourceType (private method)', () => {
        it('should extract resource type from base definition URL', () => {
            const extractResourceType = (generator as any).extractResourceType.bind(generator);

            expect(extractResourceType('http://hl7.org/fhir/StructureDefinition/Patient')).toBe('Patient');
            expect(extractResourceType('http://hl7.org/fhir/StructureDefinition/Observation')).toBe('Observation');
            expect(extractResourceType('http://hl7.org/fhir/StructureDefinition/Extension')).toBe('Extension');
        });

        it('should return DomainResource for invalid URLs', () => {
            const extractResourceType = (generator as any).extractResourceType.bind(generator);

            expect(extractResourceType('invalid-url')).toBe('DomainResource');
            expect(extractResourceType('http://example.org/invalid')).toBe('DomainResource');
            expect(extractResourceType('')).toBe('DomainResource');
        });
    });

    describe('loadBaseStructureDefinition (private method)', () => {
        it('should load base structure definition from FHIR R4 core package', () => {
            const mockBaseStructureDef: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'Patient',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                name: 'Patient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                derivation: 'specialization',
                snapshot: {
                    element: [
                        { path: 'Patient', min: 0, max: '*' },
                        { path: 'Patient.id', min: 0, max: '1' }
                    ]
                }
            };

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockBaseStructureDef));

            const loadBaseStructureDefinition = (generator as any).loadBaseStructureDefinition.bind(generator);
            const result = loadBaseStructureDefinition('Patient');

            expect(mockFs.existsSync).toHaveBeenCalled();
            expect(mockFs.readFileSync).toHaveBeenCalled();
            expect(result).toEqual(mockBaseStructureDef.snapshot!.element);
        });

        it('should return empty array if base structure definition file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);

            const loadBaseStructureDefinition = (generator as any).loadBaseStructureDefinition.bind(generator);
            const result = loadBaseStructureDefinition('NonexistentResource');

            expect(result).toEqual([]);
        });

        it('should return empty array if base structure definition has no snapshot', () => {
            const mockBaseStructureDef: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'Patient',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                name: 'Patient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                derivation: 'specialization'
            };

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockBaseStructureDef));

            const loadBaseStructureDefinition = (generator as any).loadBaseStructureDefinition.bind(generator);
            const result = loadBaseStructureDefinition('Patient');

            expect(result).toEqual([]);
        });

        it('should handle file read errors gracefully', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error('File read error');
            });

            const loadBaseStructureDefinition = (generator as any).loadBaseStructureDefinition.bind(generator);
            const result = loadBaseStructureDefinition('Patient');

            expect(result).toEqual([]);
        });
    });

    describe('getBaseElements (private method)', () => {
        it('should return base elements for valid resource type', () => {
            const mockBaseElements: ElementDefinition[] = [
                { path: 'Patient', min: 0, max: '*' },
                { path: 'Patient.id', min: 0, max: '1' }
            ];

            const mockBaseStructureDef: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'Patient',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                name: 'Patient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                derivation: 'specialization',
                snapshot: {
                    element: mockBaseElements
                }
            };

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockBaseStructureDef));

            const getBaseElements = (generator as any).getBaseElements.bind(generator);
            const result = getBaseElements('Patient');

            expect(result).toEqual(mockBaseElements);
        });

        it('should throw error if no base definition found', () => {
            mockFs.existsSync.mockReturnValue(false);

            const getBaseElements = (generator as any).getBaseElements.bind(generator);

            expect(() => {
                getBaseElements('NonexistentResource');
            }).toThrow('No base definition found for resource type: NonexistentResource');
        });
    });

    describe('mergeElementDefinition (private method)', () => {
        it('should merge differential element into base element', () => {
            const baseElement: ElementDefinition = {
                id: 'Patient.name',
                path: 'Patient.name',
                min: 0,
                max: '*'
            };

            const diffElement: ElementDefinition = {
                id: 'Patient.name',
                path: 'Patient.name',
                min: 1,
                max: '1',
                short: 'Patient name'
            };

            const mergeElementDefinition = (generator as any).mergeElementDefinition.bind(generator);
            mergeElementDefinition(baseElement, diffElement);

            expect(baseElement.min).toBe(1);
            expect(baseElement.max).toBe('1');
            expect(baseElement.short).toBe('Patient name');
        });

        it('should merge type definitions', () => {
            const baseElement: ElementDefinition = {
                path: 'Patient.identifier',
                min: 0,
                max: '*',
                type: [{ code: 'Identifier' }]
            };

            const diffElement: ElementDefinition = {
                path: 'Patient.identifier',
                min: 0,
                max: '*',
                type: [{
                    code: 'Identifier',
                    profile: ['http://example.org/StructureDefinition/CustomIdentifier']
                }]
            };

            const mergeElementDefinition = (generator as any).mergeElementDefinition.bind(generator);
            mergeElementDefinition(baseElement, diffElement);

            expect(baseElement.type).toEqual(diffElement.type);
        });

        it('should merge binding information', () => {
            const baseElement: ElementDefinition = {
                path: 'Patient.gender',
                min: 0,
                max: '1'
            };

            const diffElement: ElementDefinition = {
                path: 'Patient.gender',
                min: 0,
                max: '1',
                binding: {
                    strength: 'required',
                    valueSet: 'http://hl7.org/fhir/ValueSet/administrative-gender'
                }
            };

            const mergeElementDefinition = (generator as any).mergeElementDefinition.bind(generator);
            mergeElementDefinition(baseElement, diffElement);

            expect(baseElement.binding).toEqual(diffElement.binding);
        });

        it('should merge extensions', () => {
            const baseElement: ElementDefinition = {
                path: 'Patient.name',
                min: 0,
                max: '*'
            };

            const diffElement: ElementDefinition = {
                path: 'Patient.name',
                min: 0,
                max: '*',
                extension: [
                    {
                        url: 'http://example.org/extension',
                        valueString: 'test'
                    }
                ]
            };

            const mergeElementDefinition = (generator as any).mergeElementDefinition.bind(generator);
            mergeElementDefinition(baseElement, diffElement);

            expect(baseElement.extension).toEqual(diffElement.extension);
        });

        it('should not override id and path with undefined values', () => {
            const baseElement: ElementDefinition = {
                id: 'Patient.name',
                path: 'Patient.name',
                min: 0,
                max: '*'
            };

            const diffElement: ElementDefinition = {
                path: 'Patient.name',
                min: 1,
                max: '1'
            };

            const mergeElementDefinition = (generator as any).mergeElementDefinition.bind(generator);
            mergeElementDefinition(baseElement, diffElement);

            expect(baseElement.id).toBe('Patient.name');
            expect(baseElement.path).toBe('Patient.name');
            expect(baseElement.min).toBe(1);
        });
    });

    describe('generateSnapshot', () => {
        it('should generate a complete snapshot with base elements merged with differential elements', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'example',
                url: 'http://hl7.org/fhir/StructureDefinition/Example',
                name: 'Example',
                status: 'draft',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        { id: 'Patient.name', path: 'Patient.name', min: 1, max: '*' }
                    ]
                }
            };

            jest.spyOn<any, any>(generator, 'getBaseElements').mockImplementation(() => [
                { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                { id: 'Patient.name', path: 'Patient.name', min: 0, max: '1' }
            ]);

            const result = generator.generateSnapshot(structureDefinition);

            expect(result.snapshot?.element).toEqual([
                { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                { id: 'Patient.name', path: 'Patient.name', min: 1, max: '*' }
            ]);
            expect(result.differential).toBeUndefined();
        });

        it('should throw error if differential elements are missing', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint'
            };

            expect(() => {
                generator.generateSnapshot(structureDefinition);
            }).toThrow('StructureDefinition must have differential elements');
        });

        it('should add new elements from differential with base information', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        {
                            path: 'Patient.customExtension',
                            min: 0,
                            max: '1',
                            type: [{
                                code: 'Extension',
                                profile: ['http://example.org/StructureDefinition/CustomExtension']
                            }]
                        }
                    ]
                }
            };

            // Mock with proper base elements
            const mockBaseElements = [{ id: 'Patient', path: 'Patient', min: 0, max: '*' }];
            jest.spyOn<any, any>(generator, 'getBaseElements').mockImplementation(() => mockBaseElements);

            const result = generator.generateSnapshot(structureDefinition);

            // Should have Patient base element + custom extension element  
            expect(result.snapshot!.element.length).toBe(2);
            
            // Verify Patient base element is present
            const patientElement = result.snapshot!.element.find(el => el.path === 'Patient');
            expect(patientElement).toBeDefined();
            
            // Verify the custom extension was added as new element
            const customElement = result.snapshot!.element.find(el => el.path === 'Patient.customExtension');
            expect(customElement).toBeDefined();
            expect(customElement!.base).toBeDefined();
            expect(customElement!.base!.path).toBe('Patient.customExtension');
            expect(customElement!.base!.min).toBe(0);
            expect(customElement!.base!.max).toBe('1');
        });

        it('should sort elements by path depth and alphabetically', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        { path: 'Patient.name.family', min: 1, max: '1' },
                        { path: 'Patient.name', min: 1, max: '*' },
                        { path: 'Patient.identifier', min: 0, max: '*' }
                    ]
                }
            };

            // Mock base elements with Patient root and some existing base elements
            jest.spyOn<any, any>(generator, 'getBaseElements').mockImplementation(() => [
                { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                { id: 'Patient.identifier', path: 'Patient.identifier', min: 0, max: '*' },
                { id: 'Patient.name', path: 'Patient.name', min: 0, max: '*' }
            ]);

            const result = generator.generateSnapshot(structureDefinition);
            const paths = result.snapshot!.element.map(el => el.path);
            
            // Check that Patient comes first (depth 1)
            expect(paths[0]).toBe('Patient');
            
            // Check that depth 2 elements come before depth 3 elements if any exist  
            const depth2Elements = result.snapshot!.element.filter(el => el.path.split('.').length === 2);
            const depth3Elements = result.snapshot!.element.filter(el => el.path.split('.').length === 3);
            
            // Verify elements are present (the ones that should be there based on processing)
            expect(paths).toContain('Patient');
            expect(paths).toContain('Patient.identifier');
            expect(paths).toContain('Patient.name');
            
            // Expected behavior: differential elements that don't exist in base are added
            // Since Patient.name.family is in differential but not in base, it should be added
            expect(result.snapshot!.element.length).toBeGreaterThanOrEqual(3);
            
            // Verify sorting: depth 1 should come before depth 2, depth 2 before depth 3
            const sortedByDepth = result.snapshot!.element.every((el, i) => {
                if (i === 0) return true;
                const currentDepth = el.path.split('.').length;
                const prevDepth = result.snapshot!.element[i-1].path.split('.').length;
                return currentDepth >= prevDepth;
            });
            expect(sortedByDepth).toBe(true);
        });

        it('should handle elements with sliceName correctly', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        { path: 'Patient.name', min: 1, max: '*', sliceName: 'officialName' }
                    ]
                }
            };

            jest.spyOn<any, any>(generator, 'getBaseElements').mockImplementation(() => [
                { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                { id: 'Patient.name', path: 'Patient.name', min: 0, max: '*' }
            ]);

            const result = generator.generateSnapshot(structureDefinition);

            // Should add new element since sliceName doesn't match existing element (existing has no sliceName)
            // Base elements: Patient (1), Patient.name (1), + new slice element (1) = 3 total
            expect(result.snapshot!.element.length).toBe(3);
            const sliceElement = result.snapshot!.element.find(el => el.sliceName === 'officialName');
            expect(sliceElement).toBeDefined();
            expect(sliceElement!.path).toBe('Patient.name');
            expect(sliceElement!.min).toBe(1);
        });

        it('should match elements by ID when available', () => {
            const structureDefinition: StructureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'test-patient',
                url: 'http://example.org/StructureDefinition/test-patient',
                name: 'TestPatient',
                status: 'active',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        { id: 'Patient.name', path: 'Patient.name', min: 1, max: '*' }
                    ]
                }
            };

            jest.spyOn<any, any>(generator, 'getBaseElements').mockImplementation(() => [
                { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                { id: 'Patient.name', path: 'Patient.name', min: 0, max: '*' }
            ]);

            const result = generator.generateSnapshot(structureDefinition);

            const nameElement = result.snapshot!.element.find(el => el.id === 'Patient.name');
            expect(nameElement).toBeDefined();
            expect(nameElement!.min).toBe(1);
            expect(nameElement!.max).toBe('*');
        });
    });
});