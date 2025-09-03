import {FHIRSnapshotGenerator} from './snapshot-generator';

describe('FHIRSnapshotGenerator', () => {
    let generator: FHIRSnapshotGenerator;

    beforeEach(() => {
        generator = new FHIRSnapshotGenerator();
    });

    describe('generateSnapshot', () => {
        it('should generate a complete snapshot with base elements merged with differential elements', () => {
            const structureDefinition = {
                resourceType: 'StructureDefinition',
                id: 'example',
                url: 'http://hl7.org/fhir/StructureDefinition/Example',
                name: 'Example',
                status: 'draft',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
                derivation: 'constraint',
                differential: {
                    element: [
                        {id: 'Patient.name', path: 'Patient.name', min: 1, max: '*'},
                    ],
                },
            };

            jest.spyOn<any, any>(
                generator,
                'getBaseElements'
            ).mockImplementation(() => [
                {id: 'Patient', path: 'Patient', min: 0, max: '*'},
                {id: 'Patient.name', path: 'Patient.name', min: 0, max: '1'},
            ]);

            const result = generator.generateSnapshot(structureDefinition);

            expect(result.snapshot?.element).toEqual([
                {id: 'Patient', path: 'Patient', min: 0, max: '*'},
                {id: 'Patient.name', path: 'Patient.name', min: 1, max: '*'},
            ]);
            expect(result.differential).toBeUndefined();
        });

    });
});