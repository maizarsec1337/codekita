export function IsPublic(): MethodDecorator {
  return function (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    // Mark the method as public (no auth guard)
    return descriptor;
  };
}