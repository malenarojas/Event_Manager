import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsEndTimeAfterStartTime(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEndTimeAfterStartTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          
          if (!value || !relatedValue) {
            return true; // Let other validators handle required fields
          }

          const endTime = new Date(value);
          const startTime = new Date(relatedValue);

          return endTime > startTime;
        },
      },
    });
  };
} 