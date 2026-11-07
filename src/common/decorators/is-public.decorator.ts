import { ArgumentException } from "@nestjs/common";

export function IsPublic(): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    // Mark the method as public (no auth guard)
    return descriptor;
  };
}