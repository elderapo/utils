/* istanbul ignore file */

import {
  ArgsType,
  Field,
  MiddlewareInterface,
  NextFn,
  ResolverData,
  SymbolKeysNotSupportedError,
  UseMiddleware
} from "type-graphql";
import { getParamInfo } from "type-graphql/dist/helpers/params";
import { getMetadataStorage } from "type-graphql/dist/metadata/getMetadataStorage";
import { noop } from "../../other";
import { SyncOrAsync } from "../../types";

export interface IReCAPTCHAOptions<CONTEXT extends {}> {
  getValidateFN: () => (token: string, resolverData: ResolverData<CONTEXT>) => SyncOrAsync<void>;
  disabled?: boolean;
  tokenFieldKey?: string;
}

const defaultOptions = Object.freeze<Required<IReCAPTCHAOptions<any>>>({
  getValidateFN: () => () => noop(),
  disabled: false,
  tokenFieldKey: "_reCAPTCHAToken"
});

export const createReCAPTCHADecorator = <CONTEXT extends {} = any>(
  _options: IReCAPTCHAOptions<CONTEXT>
) => {
  const options = Object.assign({}, defaultOptions, _options);

  @ArgsType()
  class ReCAPTCHAArgs {}
  Field(type => String, { nullable: options.disabled })(ReCAPTCHAArgs, options.tokenFieldKey);

  const AddReCAPTCHAArgs = (): MethodDecorator | PropertyDecorator => {
    const returnTypeFunc = () => ReCAPTCHAArgs;

    return (prototype, propertyKey, descriptor) => {
      if (typeof propertyKey === "symbol") {
        throw new SymbolKeysNotSupportedError();
      }

      getMetadataStorage().collectHandlerParamMetadata({
        kind: "args",
        ...getParamInfo({
          prototype,
          propertyKey,
          parameterIndex: 999999999,
          returnTypeFunc,
          options: {}
        })
      });
    };
  };

  class ReCAPTCHAMiddleware implements MiddlewareInterface {
    async use(data: ResolverData<any>, next: NextFn) {
      const validateFN = options.getValidateFN();

      await validateFN(data.args[options.tokenFieldKey], data);

      return next();
    }
  }

  const decorator = (): MethodDecorator => {
    return (prototype, propertyKey, descriptor) => {
      AddReCAPTCHAArgs()(prototype, propertyKey, descriptor);
      UseMiddleware(ReCAPTCHAMiddleware)(prototype, propertyKey, descriptor);
    };
  };

  return decorator;
};
