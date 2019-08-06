/* istanbul ignore file */

/*
  Not easly testable because it only fixes decorators for babel. In TypeScript they're working just fine.

  https://github.com/leonardfactory/babel-plugin-transform-typescript-metadata/issues/2
*/

export const fixPropertyDecorator = <T extends Function>(decorator: T): T => {
  return ((...args: any[]) => (target: any, propertyName: any, ...decoratorArgs: any[]) => {
    decorator(...args)(target, propertyName, ...decoratorArgs);

    // for (let arg of decoratorArgs) {
    //   if (!arg) {
    //     continue;
    //   }

    //   const val = arg.initializer ? arg.initializer() : undefined;

    //   if (!target[propertyName] && typeof val !== "undefined") {
    //     target[propertyName] = val;
    //   }
    // }

    return Object.getOwnPropertyDescriptor(target, propertyName);
  }) as any;
};
